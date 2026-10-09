"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import type { Group, PerspectiveCamera } from "three";
import { progress } from "@/lib/progress";
import { sceneProgress } from "@/lib/timeline";
import { ContactShadow, Ground, Lights, Sky } from "./environment";
import { Person, restPose, type Pose, type PersonStyle } from "./person";
import { Tree } from "./tree";
import { useInvalidateOn } from "@/scene/webgl";

const MAN: PersonStyle = { kind: "man", height: 1.82, skin: "#d8a37c", hair: "#2b2220", top: "#cdbf9f", bottom: "#6b6a5a", shoe: "#3a302a", canHand: "R" };
const WOMAN: PersonStyle = { kind: "woman", height: 1.68, skin: "#e2b08a", hair: "#5a3a28", top: "#f1e6d0", bottom: "#a7845f", shoe: "#4a3a30", canHand: "L" };

/** Where the world sits in the frame: the tree right of centre so the headline owns the left. */
const WORLD_OFFSET: [number, number, number] = [2.15, -1.5, 0];

type Rig = { man: Pose; woman: Pose; cam: { dz: number; dy: number } };

/**
 * One GSAP timeline over the opening scene (local progress 0 to 1), paused and
 * scrubbed from the shared progress, so it reverses exactly. It tweens plain
 * objects that the 3D rig reads each frame.
 */
function buildTimeline(rig: Rig) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
  tl.to(rig.cam, { dz: -0.6, dy: 0.1, duration: 1, ease: "none" }, 0)
    .to(rig.man, { head: 0.45, lean: 0.035, armR: 0.08, turn: 0.12, breath: 1, duration: 0.7 }, 0)
    .to(rig.woman, { head: -0.4, lean: -0.03, armL: 0.07, turn: -0.1, breath: 1, duration: 0.8 }, 0.1)
    .to(rig.man, { head: 0.15, turn: 0.2, duration: 0.3 }, 0.7)
    .to(rig.woman, { head: -0.1, turn: -0.18, duration: 0.2 }, 0.8);
  return tl;
}

/** Plain per-frame step: scrub the timeline and nudge the camera. */
function step(tl: gsap.core.Timeline, rig: Rig, camera: PerspectiveCamera, p: number) {
  tl.progress(sceneProgress("opening", p));
  camera.position.z += rig.cam.dz;
  camera.position.y += rig.cam.dy;
}

/**
 * Scene 01, "The Beginning": a small orange tree between a man and a woman,
 * each with a watering can, in warm golden-hour light. The world also carries
 * the watering scene, so the move between them is a continuous dolly.
 */
export function OpeningWorld({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const rig = useMemo<Rig>(() => ({ man: restPose(), woman: restPose(), cam: { dz: 0, dy: 0 } }), []);
  const tl = useMemo(() => buildTimeline(rig), [rig]);
  useEffect(() => () => void tl.kill(), [tl]);
  useInvalidateOn(progress);

  useFrame(() => step(tl, rig, camera, progress.get()));

  return (
    <group ref={groupRef} visible={false}>
      <Sky />
      <Lights />
      <group position={WORLD_OFFSET}>
        <Ground />
        <Tree />
        <ContactShadow position={[0, 0, 0]} radius={0.9} />
        <Person style={MAN} pose={rig.man} position={[-1.9, 0, 0.15]} turn={0.45} />
        <ContactShadow position={[-1.9, 0, 0.15]} radius={0.5} />
        <Person style={WOMAN} pose={rig.woman} position={[1.9, 0, 0.15]} turn={-0.45} />
        <ContactShadow position={[1.9, 0, 0.15]} radius={0.48} />
      </group>
    </group>
  );
}
