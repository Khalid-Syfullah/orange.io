"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, InstancedMesh, Object3D, Quaternion, RepeatWrapping, SRGBColorSpace, Vector3, type Group, type PerspectiveCamera } from "three";
import { progress, velocityNorm } from "@/lib/progress";
import { branchGrowth, fruitSize, fruitStem, leafUnfold, secondaryGrowth, trunkHeight } from "@/scroll/growth";
import { FLY_HANDOVER, GROWTH, PLUCK } from "@/scroll/script";
import { focusMove, ripenGrowth, ripenRgb } from "@/scroll/ripening";
import { branchRecoil, handDistance, handPresence, pull, stemAttached, stemStretch, twist } from "@/scroll/pluck";
import { APPROACH, PULL_DIR, fruitDisplacement } from "./pluck-pose";
import { ModelSlot } from "./model-slot";
import { peelTexture } from "./peel";
import { mulberry32 } from "./rng";

// ---------------------------------------------------------------- layout ---
// A deterministic mature layout. At any progress every part is placed from its
// own growth window: nothing is a scaled copy of the whole tree.

const PRIMARIES = 8;
const FRUITS = 10;
const HERO_FRUIT = 1; // chosen so it lands centre-right at the end of growth
const LEAVES_PER_YOUNG = 17;

type Primary = { s: number; dir: Vector3; Lm: number; Ly: number };
type Secondary = { parent: number; t: number; dir: Vector3; Lm: number };
type Leaf = { kind: 0 | 1; idx: number; t: number; off: Vector3; phase: number; scale: number; yaw: number; tilt: number; a: number; b: number };
type Fruit = { sec: number; t: number };

const LM = [1.0, 1.25, 1.4, 1.35, 1.2, 1.0, 0.8, 0.55];
const LY = [0.55, 0.65, 0.7, 0.65, 0.6, 0.5, 0, 0];

function buildLayout() {
  const rnd = mulberry32(11);
  const primaries: Primary[] = [];
  for (let i = 0; i < PRIMARIES; i++) {
    const a = i * 2.399 + rnd() * 0.3;
    const el = 0.5 + rnd() * 0.25 + (i > 5 ? 0.35 : 0);
    primaries.push({ s: 0.3 + 0.1 * i, dir: new Vector3(Math.cos(a), el, Math.sin(a) * 0.65).normalize(), Lm: LM[i], Ly: LY[i] });
  }
  const secondaries: Secondary[] = [];
  for (let i = 0; i < PRIMARIES; i++) {
    for (const [k, t] of [[0, 0.45], [1, 0.75]] as const) {
      const side = k === 0 ? 1 : -1;
      const d = primaries[i].dir.clone();
      d.applyAxisAngle(new Vector3(0, 1, 0), side * (0.9 + rnd() * 0.3)).add(new Vector3(0, 0.25, 0)).normalize();
      secondaries.push({ parent: i, t, dir: d, Lm: primaries[i].Lm * (0.4 + rnd() * 0.25) });
    }
  }
  const leaves: Leaf[] = [];
  const push = (kind: 0 | 1, idx: number, t: number, a: number, b: number) =>
    leaves.push({
      kind, idx, t,
      off: new Vector3((rnd() - 0.5) * 0.16, (rnd() - 0.2) * 0.12, (rnd() - 0.5) * 0.16),
      phase: rnd() * Math.PI * 2,
      scale: 0.8 + rnd() * 0.6,
      yaw: rnd() * Math.PI * 2,
      tilt: (rnd() - 0.5) * 0.9,
      a, b,
    });
  // the young tree's leaves: already open
  for (let i = 0; i < 6; i++) for (let n = 0; n < LEAVES_PER_YOUNG; n++) push(0, i, 0.35 + rnd() * 0.3, 0, 0);
  // new leaves on every primary emerge and unfold in the leaf window
  const [l0, l1] = GROWTH.leaves;
  for (let i = 0; i < PRIMARIES; i++) {
    for (let n = 0; n < 10; n++) {
      const a = l0 + rnd() * (l1 - l0) * 0.5;
      push(0, i, 0.3 + rnd() * 0.7, a, a + (l1 - l0) * (0.5 + rnd() * 0.4));
    }
  }
  // the tree becomes fuller: leaves on the secondary branches
  const [f0, f1] = GROWTH.fuller;
  for (let j = 0; j < secondaries.length; j++) {
    for (let n = 0; n < 9; n++) {
      const a = f0 + rnd() * (f1 - f0) * 0.5;
      push(1, j, 0.3 + rnd() * 0.7, a, a + (f1 - f0) * (0.5 + rnd() * 0.4));
    }
  }
  const fruits: Fruit[] = [];
  for (let k = 0; k < FRUITS; k++) fruits.push({ sec: (k * 3 + 2) % secondaries.length, t: 0.9 });
  return { primaries, secondaries, leaves, fruits };
}

const L = buildLayout();
const STICKS = 6 + PRIMARIES * 2 + L.secondaries.length * 2 + FRUITS;
const LEAF_COLORS = ["#476b35", "#587d3f", "#6a9048", "#3f6130"];
const FRUIT_GREEN = "#9db85a";
/** Each fruit ripens a touch earlier or later, so they never all change at once. */
const FRUIT_STAGGER = Array.from({ length: FRUITS }, (_, k) => ((k % 5) - 2) * 0.004);
const rgb: [number, number, number] = [0, 0, 0];
const tint = new Color();
const hero = new Vector3();
/** The fruit's own scratch object: writeStick reuses `dummy`, which would overwrite the fruit pose. */
const fd = new Object3D();
const handC = new Vector3();
const push = new Vector3();
const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------- scratch math ---
const UP = new Vector3(0, 1, 0);
const A = new Vector3();
const B = new Vector3();
const C = new Vector3();
const D = new Vector3();
const q = new Quaternion();
const dummy = new Object3D();

function trunkPoint(H: number, s: number, out: Vector3) {
  const k = H / 3.2;
  return out.set(0.05 * Math.sin(s * 3.1) * k, s * H, 0.04 * Math.cos(s * 2.3) * k * s);
}

/** Point at fraction t along primary i at progress p. */
function primaryPoint(p: number, i: number, t: number, out: Vector3) {
  const P = L.primaries[i];
  const len = P.Ly + (P.Lm - P.Ly) * branchGrowth(p, i);
  trunkPoint(trunkHeight(p), P.s, out);
  out.addScaledVector(P.dir, len * t);
  out.y -= 0.2 * len * t * t;
  return out;
}

function secondaryLength(p: number, j: number) {
  return L.secondaries[j].Lm * secondaryGrowth(p, j);
}

/** Point at fraction t along secondary j at progress p. */
function secondaryPoint(p: number, j: number, t: number, out: Vector3) {
  const S = L.secondaries[j];
  const len = secondaryLength(p, j);
  primaryPoint(p, S.parent, S.t, out);
  out.addScaledVector(S.dir, len * t);
  out.y -= 0.15 * len * t * t;
  if (j === HERO_SEC) out.addScaledVector(tug, t * t); // the branch dips when the fruit is pulled and springs back
  return out;
}

function branchPoint(p: number, kind: 0 | 1, idx: number, t: number, out: Vector3) {
  return kind === 0 ? primaryPoint(p, idx, t, out) : secondaryPoint(p, idx, t, out);
}

/** Writes a tapered stick from a to b with radius r (scale 0 hides it). */
function writeStick(mesh: InstancedMesh, i: number, a: Vector3, b: Vector3, r: number) {
  D.subVectors(b, a);
  const len = D.length();
  if (len < 1e-4 || r <= 0) {
    dummy.scale.setScalar(0);
  } else {
    dummy.position.addVectors(a, b).multiplyScalar(0.5);
    dummy.quaternion.copy(q.setFromUnitVectors(UP, D.multiplyScalar(1 / len)));
    dummy.scale.set(r, len, r);
  }
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

/**
 * Where the hero fruit hangs once it has stopped growing (local to the tree
 * group; the world offset is added by the caller). Pure: growth is finished by then.
 */
export function heroFruitPosition(p: number, out: Vector3): Vector3 {
  const F = L.fruits[HERO_FRUIT];
  secondaryPoint(p, F.sec, F.t, out);
  const size = fruitSize(p, HERO_FRUIT) * 0.075 * ripenGrowth(p + FRUIT_STAGGER[HERO_FRUIT]);
  out.y -= 0.14 * fruitStem(p, HERO_FRUIT) + size * 0.9;
  return out;
}

// ------------------------------------------------------------- per frame ---

/** The held fruit right now (tree-local), for the hand and the depth-of-field focus. Updated every frame. */
export const heroLive = { x: 0, y: 0, z: 0, radius: 0.12, rot: 0 };
const tug = new Vector3();
const disp = new Vector3();
const HERO_SEC = L.fruits[HERO_FRUIT].sec;

export type HeroFruit = { x: number; y: number; size: number; visible: boolean };
/** Screen position (percent of viewport) and diameter (fraction of viewport height) of the hero fruit. */
export const heroFruit: HeroFruit = { x: 0, y: 0, size: 0, visible: false };
/** Dev aid: screen position of every fruit, to choose and align the hero. */
export const fruitScreen: HeroFruit[] = Array.from({ length: FRUITS }, () => ({ x: 0, y: 0, size: 0, visible: false }));

type Meshes = { sticks: InstancedMesh; leaves: InstancedMesh; fruits: InstancedMesh };

/** Places every part of the tree for progress `p`. Plain function: instance buffers are mutated by design. */
function stepTree(m: Meshes, group: Group, camera: PerspectiveCamera, p: number, vel: number) {
  let n = 0;
  // the fruit's branch dips as the fruit is pulled, then springs back (a damped swing) once the stem lets go
  const amp = stemAttached(p) ? pull(p) / Math.max(1e-6, pull(PLUCK.stemDetaches)) : branchRecoil(p);
  tug.copy(PULL_DIR).multiplyScalar(0.05 * amp);
  const H = trunkHeight(p);
  const grown = Math.min(1, (H - 1.55) / 1.7);
  // trunk: 6 segments that thicken as the tree grows
  for (let k = 0; k < 6; k++) {
    trunkPoint(H, k / 6, A);
    trunkPoint(H, (k + 1) / 6, B);
    writeStick(m.sticks, n++, A, B, (0.05 + 0.045 * grown) * (1 - k * 0.1));
  }
  // primaries: two segments each, thicker as they lengthen
  for (let i = 0; i < PRIMARIES; i++) {
    const g = branchGrowth(p, i);
    const r = 0.018 + 0.012 * g;
    primaryPoint(p, i, 0, A);
    primaryPoint(p, i, 0.5, B);
    primaryPoint(p, i, 1, C);
    const live = L.primaries[i].Ly > 0 || g > 0;
    writeStick(m.sticks, n++, A, B, live ? r : 0);
    writeStick(m.sticks, n++, B, C, live ? r * 0.7 : 0);
  }
  for (let j = 0; j < L.secondaries.length; j++) {
    const live = secondaryGrowth(p, j) > 0.001;
    secondaryPoint(p, j, 0, A);
    secondaryPoint(p, j, 0.5, B);
    secondaryPoint(p, j, 1, C);
    writeStick(m.sticks, n++, A, B, live ? 0.011 : 0);
    writeStick(m.sticks, n++, B, C, live ? 0.008 : 0);
  }

  // fruit stems then small green oranges
  heroFruit.visible = false;
  const gust = 1 + Math.abs(vel) * 2.5;
  for (let k = 0; k < FRUITS; k++) {
    const F = L.fruits[k];
    const stem = fruitStem(p, k);
    const size = fruitSize(p, k) * (k === HERO_FRUIT ? 0.075 : 0.062) * ripenGrowth(p + FRUIT_STAGGER[k]);
    secondaryPoint(p, F.sec, F.t, A);
    B.set(A.x, A.y - 0.14 * stem, A.z);
    // the fly layer takes over the hero fruit once it has been plucked
    const handedOver = k === HERO_FRUIT && p >= FLY_HANDOVER;
    const r = handedOver ? 0 : size;
    fd.position.set(B.x, B.y - size * 0.9, B.z);
    fd.quaternion.identity();
    let stemRadius = stem > 0.001 ? 0.005 : 0;
    if (k === HERO_FRUIT) {
      // held: carried by the hand (pull, then toward the camera) and twisted with it
      fruitDisplacement(p, disp);
      fd.position.add(disp);
      fd.quaternion.setFromAxisAngle(UP, twist(p));
      if (stemAttached(p)) {
        // the stem stays on the fruit's top and stretches
        B.set(fd.position.x, fd.position.y + size * 0.9, fd.position.z);
        stemRadius *= 1 - 0.4 * stemStretch(p);
      } else {
        // let go: the stem springs back toward where it hung
        fruitDisplacement(PLUCK.stemDetaches, disp);
        const t = Math.min(1, (p - PLUCK.stemDetaches) / 0.03);
        const e = t * t * (3 - 2 * t);
        const topX = B.x + disp.x;
        const topY = B.y - 0.0 + disp.y;
        const topZ = B.z + disp.z;
        B.set(topX + (B.x - topX) * e, topY + (B.y - topY) * e, topZ + (B.z - topZ) * e);
      }
      heroLive.x = fd.position.x;
      heroLive.y = fd.position.y;
      heroLive.z = fd.position.z;
      heroLive.radius = Math.max(size, 0.01);
      heroLive.rot = twist(p);
    }
    writeStick(m.sticks, n++, A, B, stemRadius);
    fd.scale.setScalar(r);
    fd.updateMatrix();
    m.fruits.setMatrixAt(k, fd.matrix);
    // ripening: green to yellow-orange to ripe, mixed in OKLab, per-fruit stagger
    const [cr, cg, cb] = ripenRgb(p + FRUIT_STAGGER[k], rgb);
    m.fruits.setColorAt(k, tint.setRGB(cr, cg, cb, SRGBColorSpace));
    if (size > 0) projectFruit(k === HERO_FRUIT ? heroFruit : fruitScreen[k], group, camera, fd.position, size);
  }
  m.sticks.instanceMatrix.needsUpdate = true;
  m.fruits.instanceMatrix.needsUpdate = true;
  if (m.fruits.instanceColor) m.fruits.instanceColor.needsUpdate = true;

  // leaves near the selected fruit part as the camera singles it out, so nothing hides it
  const parting = focusMove(p);
  heroFruitPosition(p, hero);
  // the approaching hand brushes nearby leaves aside
  const presence = handPresence(p);
  handC.set(heroLive.x, heroLive.y, heroLive.z).addScaledVector(APPROACH, 0.22 + handDistance(p) * 1.1);
  // leaves ride their branches; they unfold and grow inside their own windows; wind follows scroll
  for (let i = 0; i < L.leaves.length; i++) {
    const l = L.leaves[i];
    const u = leafUnfold(p, l.a, l.b);
    branchPoint(p, l.kind, l.idx, l.t, A);
    const s = Math.sin(p * 90 + l.phase) * 0.12 * gust;
    dummy.position.copy(A).addScaledVector(l.off, 0.4 + 0.6 * u);
    // folded (pointing up and narrow) while emerging, open once unfolded
    dummy.rotation.set(l.tilt * u + (1 - u) * 1.2 + s, l.yaw, s * 0.6);
    const handD = dummy.position.distanceTo(handC);
    if (presence > 0 && handD < 0.3) {
      const f = (1 - handD / 0.3) * (1 - handD / 0.3) * 0.06 * presence;
      dummy.position.addScaledVector(push.subVectors(dummy.position, handC).normalize(), f);
    }
    const near = dummy.position.distanceTo(hero);
    const clear = 1 - parting * (1 - smoothstep((near - 0.1) / 0.2));
    const k = l.scale * u * clear;
    dummy.scale.set(0.15 * k, 0.035 * k * (0.4 + 0.6 * u), 0.085 * (0.3 + 0.7 * u) * l.scale * clear * (u > 0 ? 1 : 0));
    dummy.updateMatrix();
    m.leaves.setMatrixAt(i, dummy.matrix);
  }
  m.leaves.instanceMatrix.needsUpdate = true;
}

/** Projects the hero fruit to the screen so the fly layer can pick it up exactly. */
function projectFruit(out: HeroFruit, group: Group, camera: PerspectiveCamera, local: Vector3, radius: number) {
  // the camera pose for this frame was set earlier in the frame; refresh its matrices before projecting
  camera.updateMatrixWorld();
  group.updateWorldMatrix(true, false);
  A.copy(local);
  group.localToWorld(A);
  const dist = A.distanceTo(camera.position);
  A.project(camera);
  out.x = (A.x + 1) * 50;
  out.y = (1 - A.y) * 50;
  // diameter as a share of the viewport height
  out.size = (radius * 2) / (2 * dist * Math.tan((camera.fov * Math.PI) / 360));
  out.visible = true;
}

function barkTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#6b5238";
  g.fillRect(0, 0, 32, 128);
  const rnd = mulberry32(3);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = rnd() > 0.5 ? "rgba(40,28,18,0.45)" : "rgba(150,118,80,0.35)";
    g.lineWidth = 1 + rnd() * 1.5;
    const x = rnd() * 32;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + rnd() * 6 - 3, 40, x + rnd() * 6 - 3, 90, x + rnd() * 4 - 2, 128);
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/**
 * The orange tree, grown from its parts: trunk, primary and secondary branches,
 * leaves, fruit stems and small green oranges. Every position is a pure
 * function of scroll progress, so scrolling back un-grows it.
 */
export function GrowingTree() {
  const sticks = useRef<InstancedMesh>(null);
  const leaves = useRef<InstancedMesh>(null);
  const fruits = useRef<InstancedMesh>(null);
  const group = useRef<Group>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const bark = useMemo(() => barkTexture(), []);
  const peel = useMemo(() => peelTexture(), []);
  useEffect(() => () => bark.dispose(), [bark]);
  useEffect(() => () => peel.dispose(), [peel]);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") Object.assign(window, { __heroFruit: heroFruit, __fruits: fruitScreen, __heroLive: heroLive });
  }, []);

  useEffect(() => {
    const m = leaves.current;
    const f = fruits.current;
    if (!m || !f) return;
    const c = new Color();
    for (let i = 0; i < L.leaves.length; i++) m.setColorAt(i, c.set(LEAF_COLORS[i % LEAF_COLORS.length]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    for (let k = 0; k < FRUITS; k++) f.setColorAt(k, c.set(FRUIT_GREEN));
    if (f.instanceColor) f.instanceColor.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (!sticks.current || !leaves.current || !fruits.current || !group.current) return;
    stepTree({ sticks: sticks.current, leaves: leaves.current, fruits: fruits.current }, group.current, camera, progress.get(), velocityNorm.get());
  });

  return (
    <ModelSlot name="tree">
      <group ref={group}>
        <instancedMesh ref={sticks} args={[undefined, undefined, STICKS]} castShadow frustumCulled={false}>
          <cylinderGeometry args={[0.6, 1, 1, 7]} />
          <meshStandardMaterial map={bark} roughness={0.95} />
        </instancedMesh>
        <instancedMesh ref={leaves} args={[undefined, undefined, L.leaves.length]} castShadow frustumCulled={false}>
          <sphereGeometry args={[1, 8, 6]} />
          {/* a little emissive green stands in for light passing through the leaf */}
          <meshStandardMaterial roughness={0.6} side={2} emissive="#2f4a22" emissiveIntensity={0.4} />
        </instancedMesh>
        <instancedMesh ref={fruits} args={[undefined, undefined, FRUITS]} castShadow frustumCulled={false}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshPhysicalMaterial map={peel} bumpMap={peel} bumpScale={2.2} roughness={0.55} clearcoat={0.22} clearcoatRoughness={0.5} />
        </instancedMesh>
      </group>
    </ModelSlot>
  );
}
