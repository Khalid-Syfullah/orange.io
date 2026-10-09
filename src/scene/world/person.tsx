"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { ModelSlot } from "./model-slot";
import { WateringCan } from "./watering-can";

/** Posture driven from outside (GSAP). All values are small, in radians or 0..1. */
export type Pose = { turn: number; lean: number; head: number; armL: number; armR: number; breath: number };
export const restPose = (): Pose => ({ turn: 0, lean: 0, head: 0, armL: 0, armR: 0, breath: 0 });

export type PersonStyle = {
  height: number;
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoe: string;
  /** "dress" draws a skirt over the legs. */
  kind: "man" | "woman";
  /** Which hand holds the watering can. */
  canHand: "L" | "R";
};

type Refs = { root: Group | null; spine: Group | null; head: Group | null; armL: Group | null; armR: Group | null };

/** Applies a pose to the rig. Plain function: the rig is mutated by design. */
function applyPose(r: Refs, pose: Pose, baseTurn: number) {
  if (r.root) r.root.rotation.y = baseTurn + pose.turn;
  if (r.spine) {
    r.spine.rotation.z = pose.lean;
    r.spine.scale.y = 1 + pose.breath * 0.012;
  }
  if (r.head) r.head.rotation.y = pose.head;
  if (r.armL) r.armL.rotation.z = 0.06 + pose.armL;
  if (r.armR) r.armR.rotation.z = -0.06 - pose.armR;
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
 * shading, relaxed stance. `pose` is read each frame (set by the GSAP timeline).
 */
export function Person({ style, pose, position, turn }: { style: PersonStyle; pose: Pose; position: [number, number, number]; turn: number }) {
  const refs = useRef<Refs>({ root: null, spine: null, head: null, armL: null, armR: null });
  useFrame(() => applyPose(refs.current, pose, turn));

  const k = style.height / 1.75; // scale from the 1.75m reference
  const woman = style.kind === "woman";
  const shoulder = woman ? 0.19 : 0.23;
  const torsoR = woman ? 0.135 : 0.16;

  return (
    <ModelSlot name={style.kind}>
      <group ref={(g) => void (refs.current.root = g)} position={position} scale={k}>
        {/* legs */}
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

        {/* spine: torso, neck, head, arms */}
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

          {/* arms hang from the shoulders; one holds a watering can */}
          {(["L", "R"] as const).map((side) => {
            const x = side === "L" ? -shoulder : shoulder;
            return (
              <group key={side} ref={(g) => void (refs.current[side === "L" ? "armL" : "armR"] = g)} position={[x, 0.46, 0]}>
                <Limb r={0.045} len={0.3} color={style.top} />
                <group position={[0, -0.3, 0]} rotation={[-0.12, 0, 0]}>
                  <Limb r={0.04} len={0.28} color={style.skin} />
                  <mesh position={[0, -0.3, 0]} castShadow>
                    <sphereGeometry args={[0.042, 10, 8]} />
                    <meshStandardMaterial color={style.skin} roughness={0.7} />
                  </mesh>
                  {style.canHand === side ? (
                    <group position={[0, -0.34, 0]} rotation={[0, side === "L" ? 0.5 : -0.5, 0]}>
                      <WateringCan />
                    </group>
                  ) : null}
                </group>
              </group>
            );
          })}
        </group>
      </group>
    </ModelSlot>
  );
}
