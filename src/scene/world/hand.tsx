"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Object3D, Quaternion, Vector3, type Group, type InstancedMesh } from "three";
import { progress } from "@/lib/progress";
import { grasp, handDistance, handPresence, twist } from "@/scroll/pluck";
import { APPROACH, FINGER_HINT } from "./pluck-pose";
import { FINGERS, PALM, solveCurls } from "./hand-rig";
import { heroLive } from "./growing-tree";

/** The hand is built at human size and scaled up so it can wrap the (oversized) fruit. */
const SCALE = 1.9;
/** 1 for one hand, -1 for its mirror image (which side the thumb is on). */
const MIRROR: 1 | -1 = 1;
const PALM_GAP = 0.004; // palm to fruit skin, in hand units
const BONES = FINGERS.reduce((n, f) => n + f.lengths.length, 0);
const JOINTS = FINGERS.reduce((n, f) => n + f.lengths.length + 1, 0);
const SKIN = "#e2b08a";
const UP = new Vector3(0, 1, 0);

const s = {
  a: new Vector3(),
  n: new Vector3(),
  ex: new Vector3(),
  ey: new Vector3(),
  ez: new Vector3(),
  hint: new Vector3(),
  p: new Vector3(),
  local: new Vector3(),
  d: new Vector3(),
  q: new Quaternion(),
  m: new Matrix4(),
  qi: new Quaternion(),
  dummy: new Object3D(),
  curls: [0, 0, 0],
  pts: [new Vector3(), new Vector3(), new Vector3(), new Vector3()],
};

type Parts = { root: Group; bones: InstancedMesh; joints: InstancedMesh };

/**
 * Poses the hand for progress `p`: places the palm against the fruit (with the
 * approach, twist and carry from the timeline), solves each finger's curl so it
 * wraps the fruit without entering it, and writes the bone matrices.
 */
function stepHand(parts: Parts, p: number) {
  const presence = handPresence(p);
  parts.root.visible = presence > 0.001;
  if (!parts.root.visible) return;

  const r = heroLive.radius;
  const alpha = twist(p);
  // rotate the whole grip about the fruit's vertical axis, so hand and fruit twist together
  s.a.copy(APPROACH).applyAxisAngle(UP, alpha);
  s.hint.copy(FINGER_HINT).applyAxisAngle(UP, alpha);
  s.n.copy(s.a).negate();
  s.ey.copy(s.hint).addScaledVector(s.n, -s.hint.dot(s.n)).normalize();
  s.ez.copy(s.n);
  s.ex.crossVectors(s.ey, s.ez);

  // palm centre: on the fruit's skin side, further out while the hand is still approaching
  const dist = handDistance(p);
  const gap = r + (PALM.thickness / 2) * SCALE + PALM_GAP * SCALE;
  s.p.set(heroLive.x, heroLive.y, heroLive.z).addScaledVector(s.a, gap + dist * 1.1).addScaledVector(s.ey, -dist * 0.25);

  s.m.makeBasis(s.ex, s.ey, s.ez);
  s.q.setFromRotationMatrix(s.m);
  parts.root.position.copy(s.p);
  parts.root.quaternion.copy(s.q);
  parts.root.scale.setScalar(SCALE);

  // fruit centre in hand-local space (unit scale)
  s.qi.copy(s.q).invert();
  s.local.set(heroLive.x, heroLive.y, heroLive.z).sub(s.p).applyQuaternion(s.qi).multiplyScalar(1 / SCALE);
  const rLocal = r / SCALE;
  const g = grasp(p);

  let bone = 0;
  let joint = 0;
  for (const f of FINGERS) {
    solveCurls(f, g, s.local, rLocal, MIRROR, s.curls, s.pts);
    for (let k = 0; k < f.lengths.length; k++) {
      s.d.subVectors(s.pts[k + 1], s.pts[k]);
      const len = s.d.length();
      s.dummy.position.addVectors(s.pts[k], s.pts[k + 1]).multiplyScalar(0.5);
      s.dummy.quaternion.setFromUnitVectors(UP, s.d.multiplyScalar(1 / len));
      s.dummy.scale.set(f.radii[k], len, f.radii[k]);
      s.dummy.updateMatrix();
      parts.bones.setMatrixAt(bone++, s.dummy.matrix);
    }
    for (let k = 0; k <= f.lengths.length; k++) {
      const rad = f.radii[Math.min(k, f.lengths.length - 1)];
      s.dummy.position.copy(s.pts[k]);
      s.dummy.quaternion.identity();
      s.dummy.scale.setScalar(rad * 1.04);
      s.dummy.updateMatrix();
      parts.joints.setMatrixAt(joint++, s.dummy.matrix);
    }
  }
  parts.bones.instanceMatrix.needsUpdate = true;
  parts.joints.instanceMatrix.needsUpdate = true;
}

/**
 * A skeletal hand: palm, wrist and forearm, four fingers of three bones and a
 * two-bone thumb. Reaches in, wraps the fruit, twists and pulls it free, then
 * opens and withdraws. Entirely driven by progress.
 */
export function Hand() {
  const root = useRef<Group>(null);
  const bones = useRef<InstancedMesh>(null);
  const joints = useRef<InstancedMesh>(null);
  useEffect(() => {
    if (root.current) root.current.visible = false;
  }, []);
  useFrame(() => {
    if (root.current && bones.current && joints.current) stepHand({ root: root.current, bones: bones.current, joints: joints.current }, progress.get());
  }, 0.5);

  return (
    <group ref={root} visible={false}>
      {/* palm */}
      <mesh scale={[PALM.width / 2 + 0.004, PALM.length / 2 + 0.004, PALM.thickness / 2 + 0.002]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      {/* wrist and forearm, running out of frame */}
      <mesh position={[0, -PALM.length / 2 - 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.027, 0.3, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      <mesh position={[0, -PALM.length / 2 - 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.038, 0.16, 16]} />
        <meshStandardMaterial color="#f1e6d0" roughness={0.9} />
      </mesh>
      <instancedMesh ref={bones} args={[undefined, undefined, BONES]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={joints} args={[undefined, undefined, JOINTS]} castShadow frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </instancedMesh>
    </group>
  );
}
