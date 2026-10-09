"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { easeOutSoft } from "@/lib/motion";
import { progress as sharedProgress } from "@/lib/progress";
import { DOLLY_PUSH, SCENES, SCENE_NAMES } from "@/scroll/script";

/** A camera pose: position, field of view and look-at target. */
export type Pose = { pos: [number, number, number]; fov: number; look: [number, number, number] };

export type DollySegment = { range: readonly [number, number]; from: Pose; to: Pose; ease?: (t: number) => number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Evaluates a dolly track at progress `p` into `out` (no allocation). Before the
 * first segment the first `from` holds, after a segment its `to` holds, so
 * consecutive segments give a continuous camera.
 */
export function evalDolly(segments: readonly DollySegment[], p: number, out: Pose): Pose {
  let pose = segments[0].from;
  let t = 0;
  let to = pose;
  for (const s of segments) {
    if (p >= s.range[1]) {
      pose = to = s.to;
      t = 0;
    } else if (p > s.range[0]) {
      pose = s.from;
      to = s.to;
      t = (s.ease ?? easeOutSoft)(clamp01((p - s.range[0]) / (s.range[1] - s.range[0])));
      break;
    } else {
      break;
    }
  }
  for (let i = 0; i < 3; i++) {
    out.pos[i] = pose.pos[i] + (to.pos[i] - pose.pos[i]) * t;
    out.look[i] = pose.look[i] + (to.look[i] - pose.look[i]) * t;
  }
  out.fov = pose.fov + (to.fov - pose.fov) * t;
  return out;
}

/** Default slow push-in: one eased segment per scene, continuous across scenes. */
export function defaultDollyTrack(): DollySegment[] {
  const [z0, z1] = DOLLY_PUSH.z;
  const [f0, f1] = DOLLY_PUSH.fov;
  const pose = (frac: number): Pose => ({
    pos: [0, 0, z0 + (z1 - z0) * frac],
    fov: f0 + (f1 - f0) * frac,
    look: [0, 0, 0],
  });
  return SCENE_NAMES.map((n) => ({ range: SCENES[n], from: pose(SCENES[n][0]), to: pose(SCENES[n][1]) }));
}

export const DEFAULT_DOLLY = defaultDollyTrack();

/** Scratch pose shared by callers that only need the current camera state. */
const scratch: Pose = { pos: [0, 0, 0], fov: 40, look: [0, 0, 0] };

/** The default camera pose at progress `p`, for non-R3F consumers (plate shaders). */
export function dollyAt(p: number, out: Pose = scratch): Pose {
  return evalDolly(DEFAULT_DOLLY, p, out);
}

/**
 * Zoom factor of the default camera relative to the first pose: how much larger
 * the subject appears. Straight-on cameras only (look-at x/y equals position x/y).
 */
export function zoomOf(pose: Pose): number {
  const base = DEFAULT_DOLLY[0].from;
  const rad = Math.PI / 360; // deg to half-angle radians
  return (base.pos[2] * Math.tan(base.fov * rad)) / (pose.pos[2] * Math.tan(pose.fov * rad));
}

/** Per-frame camera write (plain function; the camera is mutated by design). */
function driveCamera(camera: PerspectiveCamera, segments: readonly DollySegment[], p: number, pose: Pose) {
  evalDolly(segments, p, pose);
  camera.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
  if (camera.fov !== pose.fov) {
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
  }
  camera.lookAt(pose.look[0], pose.look[1], pose.look[2]);
}

/**
 * Drives the R3F camera along a track of segments from the shared progress,
 * with the shared easing. Reads the MotionValue in useFrame, no React state.
 * Renders on demand: invalidates when progress changes.
 */
export function useDollyTrack(
  segments: readonly DollySegment[],
  progress: MotionValue<number> = sharedProgress,
) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const pose = useRef<Pose>({ pos: [0, 0, 0], fov: 40, look: [0, 0, 0] });
  useMotionValueEvent(progress, "change", () => invalidate());
  useFrame(() => driveCamera(camera, segments, progress.get(), pose.current));
}

const DEFAULT_FROM: Pose = { pos: [0, 0, DOLLY_PUSH.z[0]], fov: DOLLY_PUSH.fov[0], look: [0, 0, 0] };
const DEFAULT_TO: Pose = { pos: [0, 0, DOLLY_PUSH.z[1]], fov: DOLLY_PUSH.fov[1], look: [0, 0, 0] };

/**
 * Eases the camera's position, FOV and look-at over a progress range with the
 * shared easing. Defaults to a slow push-in toward the subject.
 */
export function useDolly(
  range: readonly [number, number],
  from: Pose = DEFAULT_FROM,
  to: Pose = DEFAULT_TO,
  progress: MotionValue<number> = sharedProgress,
) {
  const segments = useMemo<DollySegment[]>(() => [{ range, from, to }], [range, from, to]);
  useDollyTrack(segments, progress);
}
