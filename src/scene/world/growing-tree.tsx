"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, InstancedMesh, Object3D, Quaternion, RepeatWrapping, SRGBColorSpace, Vector3, type Group, type PerspectiveCamera } from "three";
import { progress, velocityNorm } from "@/lib/progress";
import { branchGrowth, fruitSize, fruitStem, leafUnfold, secondaryGrowth, trunkHeight } from "@/scroll/growth";
import { FRUIT_RIPEN, GROWTH } from "@/scroll/script";
import { ModelSlot } from "./model-slot";
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

// ------------------------------------------------------------- per frame ---

export type HeroFruit = { x: number; y: number; size: number; visible: boolean };
/** Screen position (percent of viewport) and diameter (fraction of viewport height) of the hero fruit. */
export const heroFruit: HeroFruit = { x: 0, y: 0, size: 0, visible: false };
/** Dev aid: screen position of every fruit, to choose and align the hero. */
export const fruitScreen: HeroFruit[] = Array.from({ length: FRUITS }, () => ({ x: 0, y: 0, size: 0, visible: false }));

type Meshes = { sticks: InstancedMesh; leaves: InstancedMesh; fruits: InstancedMesh };

/** Places every part of the tree for progress `p`. Plain function: instance buffers are mutated by design. */
function stepTree(m: Meshes, group: Group, camera: PerspectiveCamera, p: number, vel: number) {
  let n = 0;
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
    const size = fruitSize(p, k) * (k === HERO_FRUIT ? 0.075 : 0.062);
    secondaryPoint(p, F.sec, F.t, A);
    B.set(A.x, A.y - 0.14 * stem, A.z);
    writeStick(m.sticks, n++, A, B, stem > 0.001 ? 0.005 : 0);
    // the fly layer takes over the hero fruit when ripening begins
    const handedOver = k === HERO_FRUIT && p >= FRUIT_RIPEN[0];
    const r = handedOver ? 0 : size;
    dummy.position.set(B.x, B.y - size * 0.9, B.z);
    dummy.quaternion.identity();
    dummy.scale.setScalar(r);
    dummy.updateMatrix();
    m.fruits.setMatrixAt(k, dummy.matrix);
    if (size > 0) projectFruit(k === HERO_FRUIT ? heroFruit : fruitScreen[k], group, camera, dummy.position, size);
  }
  m.sticks.instanceMatrix.needsUpdate = true;
  m.fruits.instanceMatrix.needsUpdate = true;

  // leaves ride their branches; they unfold and grow inside their own windows; wind follows scroll
  for (let i = 0; i < L.leaves.length; i++) {
    const l = L.leaves[i];
    const u = leafUnfold(p, l.a, l.b);
    branchPoint(p, l.kind, l.idx, l.t, A);
    const s = Math.sin(p * 90 + l.phase) * 0.12 * gust;
    dummy.position.copy(A).addScaledVector(l.off, 0.4 + 0.6 * u);
    // folded (pointing up and narrow) while emerging, open once unfolded
    dummy.rotation.set(l.tilt * u + (1 - u) * 1.2 + s, l.yaw, s * 0.6);
    const k = l.scale * u;
    dummy.scale.set(0.15 * k, 0.035 * k * (0.4 + 0.6 * u), 0.085 * (0.3 + 0.7 * u) * l.scale * (u > 0 ? 1 : 0));
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
  useEffect(() => () => bark.dispose(), [bark]);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") Object.assign(window, { __heroFruit: heroFruit, __fruits: fruitScreen });
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
          <meshStandardMaterial roughness={0.55} />
        </instancedMesh>
      </group>
    </ModelSlot>
  );
}
