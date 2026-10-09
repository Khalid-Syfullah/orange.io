import { useTransform, type MotionValue } from "motion/react";
import { progress as sharedProgress } from "@/lib/progress";
import { BOUNDARIES, STAGE_VH, TRANSITION_VH, type Boundary } from "@/scroll/script";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 before the boundary's dissolve window, 1 after it. Linear in scroll, so it reverses exactly. */
export function transitionMix(vh: number, boundary: Boundary): number {
  return clamp01((vh - boundary.startVh) / TRANSITION_VH);
}

/** The boundary whose dissolve window contains `vh`, or null while no dissolve is running. */
export function activeBoundary(vh: number): Boundary | null {
  for (const b of BOUNDARIES) {
    if (vh > b.startVh && vh < b.atVh) return b;
  }
  return null;
}

/** Maps progress to `uMix` (0 to 1) for one scene boundary. */
export function useTransition(
  boundary: Boundary,
  progress: MotionValue<number> = sharedProgress,
): MotionValue<number> {
  return useTransform(progress, (p) => transitionMix(p * STAGE_VH, boundary));
}
