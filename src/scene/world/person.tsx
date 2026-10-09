"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import { ModelSlot } from "./model-slot";
import { WateringCan } from "./watering-can";

/**
 * Posture, driven from outside (GSAP). Radians unless noted.
 * sh / el / wr act on the arm that holds the can: shoulder raise, elbow bend,
 * wrist tilt (the pour). off is a small swing of the free arm.
 */
export type Pose = { turn: number; lean: number; head: number; sh: number; el: number; wr: number; off: number; breath: number };
export const restPose = (): Pose => ({ turn: 0, lean: 0, head: 0, sh: 0, el: 0, wr: 0, off: 0, breath: 0 });

export type PersonStyle = {
  height: number;
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoe: string;
  kind: "man" | "woman";
  /** Which side's arm holds the can. */
  canHand: "L" | "R";
  /** +1 when the spout points toward +x, -1 toward -x (after the person's own turn). */
  spout: 1 | -1;
};

type Arm = { shoulder: Group | null; elbow: Group | null; wrist: Group | null };
type Refs = { root: Group | null; spine: Group | null; head: Group | null; L: Arm; R: Arm };
const newRefs = (): Refs => ({ root: null, spine: null, head: null, L: { shoulder: null, elbow: null, wrist: null }, R: { shoulder: null, elbow: null, wrist: null } });

/** Applies a pose to the rig by interpolated joint angles. Plain function: the rig is mutated by design. */
function applyPose(r: Refs, pose: Pose, style: PersonStyle, baseTurn: number) {
  if (r.root) r.root.rotation.y = baseTurn + pose.turn;
  if (r.spine) {
    r.spine.rotation.z = pose.lean;
    r.spine.scale.y = 1 + pose.breath * 0.012;
  }
  if (r.head) r.head.rotation.y = pose.head;
  for (const side of ["L", "R"] as const) {
    const a = r[side];
    const holds = style.canHand === side;
    const out = side === "L" ? 1 : -1; // free arm drifts slightly outward
    if (a.shoulder) {
      a.shoulder.rotation.x = holds ? -pose.sh : pose.off * 0.6;
      a.shoulder.rotation.z = (side === "L" ? 1 : -1) * (0.06 + (holds ? pose.sh * 0.1 : Math.abs(pose.off) * out * 0.2));
    }
    // elbows stay naturally bent a little even at rest
    if (a.elbow) a.elbow.rotation.x = -(0.12 + (holds ? pose.el : 0));
    if (a.wrist) a.wrist.rotation.z = holds ? -style.spout * pose.wr : 0;
  }
}

function Limb({ r, len, color }: { r: number; len: number; color: string }) {
  return (
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[r, len - r * 2, 4, 10]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

/**
 * A stylized adult built from capsules and spheres: natural proportions, soft
 * shading. The can arm is a shoulder, elbow and wrist chain; the can is parented
 * to the wrist, so the hand never separates from it. `pose` is read each frame.
 */
export function Person({
  style,
  pose,
  position,
  turn,
  roseRef,
}: {
  style: PersonStyle;
  pose: Pose;
  position: [number, number, number];
  turn: number;
  roseRef?: React.Ref<Object3D>;
}) {
  const refs = useRef<Refs>(newRefs());
  useFrame(() => applyPose(refs.current, pose, style, turn));

  const k = style.height / 1.75;
  const woman = style.kind === "woman";
  const shoulderX = woman ? 0.19 : 0.23;
  const torsoR = woman ? 0.135 : 0.16;
  const canYaw = style.spout === 1 ? 0 : Math.PI;

  return (
    <ModelSlot name={style.kind}>
      <group ref={(g) => void (refs.current.root = g)} position={position} scale={k}>
        {[-0.085, 0.085].map((x) => (
          <group key={x} position={[x, 0.86, 0]}>
            <Limb r={0.07} len={0.78} color={style.bottom} />
            <mesh position={[0, -0.82, 0.05]} castShadow>
              <boxGeometry args={[0.1, 0.07, 0.24]} />
              <meshStandardMaterial color={style.shoe} roughness={0.7} />
            </mesh>
          </group>
        ))}
        {woman ? (
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.3, 0.62, 20]} />
            <meshStandardMaterial color={style.bottom} roughness={0.9} />
          </mesh>
        ) : null}

        <group ref={(g) => void (refs.current.spine = g)} position={[0, 0.9, 0]}>
          <mesh position={[0, 0.27, 0]} scale={[woman ? 1 : 1.12, 1, 0.82]} castShadow>
            <capsuleGeometry args={[torsoR, 0.42, 6, 14]} />
            <meshStandardMaterial color={style.top} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
            <meshStandardMaterial color={style.skin} roughness={0.7} />
          </mesh>
          <group ref={(g) => void (refs.current.head = g)} position={[0, 0.72, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.105, 20, 16]} />
              <meshStandardMaterial color={style.skin} roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.025, -0.02]} scale={[1.06, 1.02, 1.08]} castShadow>
              <sphereGeometry args={[0.105, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color={style.hair} roughness={0.8} />
            </mesh>
            {woman ? (
              <mesh position={[0, -0.1, -0.07]} castShadow>
                <capsuleGeometry args={[0.07, 0.2, 4, 10]} />
                <meshStandardMaterial color={style.hair} roughness={0.8} />
              </mesh>
            ) : null}
          </group>

          {(["L", "R"] as const).map((side) => (
            <group key={side} ref={(g) => void (refs.current[side].shoulder = g)} position={[side === "L" ? -shoulderX : shoulderX, 0.46, 0]}>
              <Limb r={0.045} len={0.3} color={style.top} />
              <group ref={(g) => void (refs.current[side].elbow = g)} position={[0, -0.3, 0]}>
                <Limb r={0.04} len={0.28} color={style.skin} />
                <group ref={(g) => void (refs.current[side].wrist = g)} position={[0, -0.29, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.042, 10, 8]} />
                    <meshStandardMaterial color={style.skin} roughness={0.7} />
                  </mesh>
                  {style.canHand === side ? (
                    <group position={[0, -0.04, 0]} rotation={[0, canYaw, 0]}>
                      <WateringCan roseRef={roseRef} />
                    </group>
                  ) : null}
                </group>
              </group>
            </group>
          ))}
        </group>
      </group>
    </ModelSlot>
  );
}
