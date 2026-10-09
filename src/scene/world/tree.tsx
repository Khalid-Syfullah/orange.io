"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D, Quaternion, Vector3 } from "three";
import { progress } from "@/lib/progress";
import { velocityNorm } from "@/lib/progress";
import { ModelSlot } from "./model-slot";
import { mulberry32 } from "./rng";

type Branch = { from: Vector3; to: Vector3 };
type Leaf = { base: Vector3; phase: number; scale: number; yaw: number; tilt: number };

const UP = new Vector3(0, 1, 0);

/** Deterministic young tree: slender trunk, six branches, a modest crown of leaves. */
function buildTree() {
  const rnd = mulberry32(11);
  const trunk: Branch = { from: new Vector3(0, 0, 0), to: new Vector3(0.04, 1.55, 0) };
  const branches: Branch[] = [];
  for (let i = 0; i < 6; i++) {
    const h = 0.75 + i * 0.16;
    const a = i * 2.4 + rnd() * 0.5;
    const len = 0.55 + rnd() * 0.3 - i * 0.04;
    const start = new Vector3(0.04 * (h / 1.55), h, 0);
    const dir = new Vector3(Math.cos(a), 0.55 + rnd() * 0.25, Math.sin(a) * 0.6).normalize();
    branches.push({ from: start, to: start.clone().addScaledVector(dir, len) });
  }
  branches.push({ from: trunk.to.clone(), to: trunk.to.clone().add(new Vector3(0.06, 0.28, 0.02)) });

  const leaves: Leaf[] = [];
  for (const b of branches) {
    const n = 15 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) {
      const t = 0.35 + rnd() * 0.65;
      const base = b.from.clone().lerp(b.to, t).add(new Vector3((rnd() - 0.5) * 0.22, (rnd() - 0.2) * 0.16, (rnd() - 0.5) * 0.22));
      leaves.push({ base, phase: rnd() * Math.PI * 2, scale: 0.8 + rnd() * 0.6, yaw: rnd() * Math.PI * 2, tilt: (rnd() - 0.5) * 0.9 });
    }
  }
  return { trunk, branches, leaves };
}

const TREE = buildTree();
const LEAF_COLORS = ["#476b35", "#587d3f", "#6a9048", "#3f6130"];

function Stick({ from, to, r0, r1 }: { from: Vector3; to: Vector3; r0: number; r1: number }) {
  const { pos, quat, len } = useMemo(() => {
    const dir = to.clone().sub(from);
    const len = dir.length();
    return {
      len,
      pos: from.clone().add(to).multiplyScalar(0.5),
      quat: new Quaternion().setFromUnitVectors(UP, dir.normalize()),
    };
  }, [from, to]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r1, r0, len, 8]} />
      <meshStandardMaterial color="#6b5238" roughness={0.9} />
    </mesh>
  );
}

const dummy = new Object3D();

/** Writes leaf matrices for the current wind. Wind is a function of scroll, not of time. */
function stepLeaves(mesh: InstancedMesh, p: number, vel: number) {
  const gust = 1 + Math.abs(vel) * 2.5;
  for (let i = 0; i < TREE.leaves.length; i++) {
    const l = TREE.leaves[i];
    const s = Math.sin(p * 90 + l.phase) * 0.12 * gust;
    dummy.position.copy(l.base);
    dummy.rotation.set(l.tilt + s, l.yaw, s * 0.6);
    dummy.scale.set(0.15 * l.scale, 0.035 * l.scale, 0.085 * l.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function Tree() {
  const leaves = useRef<InstancedMesh>(null);
  useEffect(() => {
    const m = leaves.current;
    if (!m) return;
    const c = new Color();
    for (let i = 0; i < TREE.leaves.length; i++) m.setColorAt(i, c.set(LEAF_COLORS[i % LEAF_COLORS.length]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    stepLeaves(m, progress.get(), 0);
  }, []);
  useFrame(() => {
    if (leaves.current) stepLeaves(leaves.current, progress.get(), velocityNorm.get());
  });

  return (
    <ModelSlot name="tree">
      <group>
        <Stick from={TREE.trunk.from} to={TREE.trunk.to} r0={0.055} r1={0.022} />
        {TREE.branches.map((b, i) => (
          <Stick key={i} from={b.from} to={b.to} r0={0.022} r1={0.008} />
        ))}
        <instancedMesh ref={leaves} args={[undefined, undefined, TREE.leaves.length]} castShadow frustumCulled={false}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial roughness={0.7} />
        </instancedMesh>
      </group>
    </ModelSlot>
  );
}

