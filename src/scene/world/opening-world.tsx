"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import type { Group, Object3D, PerspectiveCamera } from "three";
import { progress } from "@/lib/progress";
import { GROWTH, WATERING as W } from "@/scroll/script";
import { ContactShadow, Ground, Lights, Sky } from "./environment";
import { Person, restPose, type Pose, type PersonStyle } from "./person";
import { GrowingTree } from "./growing-tree";
import { WaterStreams, WetSoil, type WaterRefs } from "./watering-effects";
import { useInvalidateOn } from "@/scene/webgl";

const MAN: PersonStyle = { kind: "man", height: 1.82, skin: "#d8a37c", hair: "#2b2220", top: "#cdbf9f", bottom: "#6b6a5a", shoe: "#3a302a", canHand: "R", spout: 1 };
const WOMAN: PersonStyle = { kind: "woman", height: 1.68, skin: "#e2b08a", hair: "#5a3a28", top: "#f1e6d0", bottom: "#a7845f", shoe: "#4a3a30", canHand: "L", spout: -1 };

/** Where the world sits in the frame: the tree right of centre so the headline owns the left. */
const WORLD_OFFSET: [number, number, number] = [2.15, -1.5, 0];

type Rig = { man: Pose; woman: Pose; cam: { dx: number; dy: number; dz: number } };

/** The timeline is authored in progress units, so a tween at 0.12 happens at progress 0.12. */
const END = GROWTH.fruit[1];

/**
 * Scenes 01 and 02 on one paused GSAP timeline, scrubbed from the shared
 * progress (so it reverses exactly). It tweens plain objects that the 3D rig
 * reads each frame: interpolated joint angles, no physics.
 */
function buildTimeline(rig: Rig) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
  const pour = (who: Pose, d: number) => {
    tl.to(who, { sh: 0.62, el: 0.8, off: 0.2, duration: W.tiltAt - W.liftAt, ease: "power2.out" }, W.liftAt + d) // lift
      .to(who, { wr: 1.0, duration: W.flowAt - W.tiltAt }, W.tiltAt + d) // tilt
      .to(who, { sh: 0.72, duration: W.stopAt - W.flowAt, ease: "none" }, W.flowAt + d) // lean into the pour
      .to(who, { wr: 0, duration: 0.012, ease: "power2.in" }, W.stopAt - 0.004 + d) // level the can as the flow stops
      .to(who, { sh: 0, el: 0, off: 0, duration: W.relaxAt - W.stopAt - 0.002 }, W.stopAt + 0.002 + d); // lower to relaxed
  };

  // Scene 01: settle, glance toward the tree
  tl.to(rig.man, { head: 0.45, lean: 0.035, turn: 0.12, breath: 1, duration: 0.056 }, 0)
    .to(rig.woman, { head: -0.4, lean: -0.03, turn: -0.1, breath: 1, duration: 0.064 }, 0.008)
    .to(rig.man, { head: 0.15, turn: 0.2, duration: 0.024 }, 0.056)
    .to(rig.woman, { head: -0.1, turn: -0.18, duration: 0.016 }, 0.064);
  // Scene 02: both lift, tilt, pour together, then lower
  pour(rig.man, 0);
  pour(rig.woman, 0.003);
  tl.to(rig.man, { head: 0.5, duration: 0.04 }, W.liftAt)
    .to(rig.woman, { head: -0.5, duration: 0.04 }, W.liftAt + 0.003)
    .to([rig.man, rig.woman], { head: 0, duration: 0.02 }, W.stopAt);
  // Camera: a small push in the opening, then a slow push toward the tree with a subtle perspective shift
  tl.to(rig.cam, { dz: -0.6, dy: 0.1, duration: W.liftAt, ease: "none" }, 0).to(rig.cam, { dz: -1.9, dx: 0.9, dy: 0.05, duration: W.relaxAt - W.liftAt, ease: "none" }, W.liftAt);
  // Scene 03: keep closing in on the tree, rising as it grows, until it fills most of the frame
  tl.to(rig.cam, { dz: -2.6, dx: 1.85, dy: 0.4, duration: GROWTH.fruit[1] - W.relaxAt, ease: "none" }, W.relaxAt);
  tl.set({}, {}, END); // make the timeline exactly END long
  return tl;
}

function attachRose(w: WaterRefs, i: number, o: Object3D | null) {
  w.roses[i] = o;
}
function attachGroup(w: WaterRefs, g: Group | null) {
  w.group = g;
}

/** Plain per-frame step: scrub the timeline and nudge the camera. */
function step(tl: gsap.core.Timeline, rig: Rig, camera: PerspectiveCamera, p: number) {
  tl.time(Math.min(p, END));
  camera.position.x += rig.cam.dx;
  camera.position.y += rig.cam.dy;
  camera.position.z += rig.cam.dz;
}

/**
 * Scenes 01 and 02: a small orange tree between a man and a woman, each with a
 * watering can, in warm golden-hour light. The world carries both scenes so the
 * move from one to the next is a continuous dolly.
 */
export function OpeningWorld({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const rig = useMemo<Rig>(() => ({ man: restPose(), woman: restPose(), cam: { dx: 0, dy: 0, dz: 0 } }), []);
  const tl = useMemo(() => buildTimeline(rig), [rig]);
  useEffect(() => () => void tl.kill(), [tl]);
  useInvalidateOn(progress);

  const water = useMemo<WaterRefs>(() => ({ roses: [null, null], group: null }), []);

  // before the people and tree read their poses, so nothing lags a frame behind the timeline
  useFrame(() => step(tl, rig, camera, progress.get()), -1);

  return (
    <group ref={groupRef} visible={false}>
      <Sky />
      <Lights />
      <group ref={(g) => attachGroup(water, g)} position={WORLD_OFFSET}>
        <Ground />
        <WetSoil />
        <GrowingTree />
        <ContactShadow position={[0, 0, 0]} radius={0.9} />
        <Person style={MAN} pose={rig.man} position={[-1.9, 0, 0.15]} turn={0.45} roseRef={(o) => attachRose(water, 0, o)} />
        <ContactShadow position={[-1.9, 0, 0.15]} radius={0.5} />
        <Person style={WOMAN} pose={rig.woman} position={[1.9, 0, 0.15]} turn={-0.45} roseRef={(o) => attachRose(water, 1, o)} />
        <ContactShadow position={[1.9, 0, 0.15]} radius={0.48} />
        <WaterStreams refs={water} />
      </group>
    </group>
  );
}
