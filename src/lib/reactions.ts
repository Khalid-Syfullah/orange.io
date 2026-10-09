import { motionValue } from "motion/react";

// Tunables for the small tactile reactions. Everything reads MotionValues; no React state.
export const REACTIONS = {
  /** Scroll velocity (px/frame) that maps to 1. Beyond it everything clamps. */
  velocityRef: 40,
  /** Max pointer parallax shift in px, multiplied by each layer's depth (0 to 1). */
  parallaxPx: 6,
  /** Sheen decay time constant in ms. */
  sheenDecayMs: 400,
  /** Subject scale breath at full velocity (3%). */
  breath: 0.03,
  /** Max vertical smear at the screen edges, in uv, at full velocity. */
  smear: 0.01,
} as const;

/** Pointer position in -1..1 (x right, y down), 0 at rest. */
export const pointerX = motionValue(0);
export const pointerY = motionValue(0);
/** Pointer in screen uv (0..1, y up) for shaders. */
export const sheenX = motionValue(0.5);
export const sheenY = motionValue(0.5);
/** Sheen strength 0..1, decays to exactly 0. */
export const sheen = motionValue(0);
