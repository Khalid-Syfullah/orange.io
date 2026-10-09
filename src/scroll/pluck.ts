import { FLY_HANDOVER, PLUCK as P } from "./script";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const win = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)));

/** The hand is in the frame: enters at handEnters, leaves again after the fruit is handed to the fly layer. */
export function handPresence(p: number): number {
  return win(p, P.handEnters, P.fingersApproach) * (1 - win(p, FLY_HANDOVER, P.towardCamera));
}

/**
 * How far the hand is from the fruit, 1 = off screen, 0 = palm on the fruit.
 * It glides in to a pre-grasp hover (0.3) as the fingers approach, closes to
 * contact as they wrap, and withdraws after the hand-over.
 */
export function handDistance(p: number): number {
  const enter = 1 - 0.7 * win(p, P.handEnters, P.fingersApproach);
  const close = enter - 0.3 * win(p, P.fingersApproach, P.wraps);
  return close + 1.0 * win(p, FLY_HANDOVER, P.towardCamera);
}

/** Finger closure 0..1: open on approach, wraps the fruit by `wraps`, opens again as the hand leaves. */
export function grasp(p: number): number {
  return win(p, P.fingersApproach + 0.005, P.wraps) * (1 - win(p, FLY_HANDOVER, P.towardCamera - 0.004));
}

/** Twist of the fruit (and the hand holding it) about its vertical axis, radians. */
export function twist(p: number): number {
  return 0.6 * win(p, P.wraps, P.rotates + 0.004);
}

/** Pull away from the branch 0..1 (the stem stretches), then the move toward the camera. */
export function pull(p: number): number {
  return win(p, P.wraps + 0.004, P.separates);
}
export function toCamera(p: number): number {
  return win(p, P.separates, P.towardCamera);
}

/** Stem stretch 0..1 while attached; the stem lets go at stemDetaches. */
export function stemStretch(p: number): number {
  return win(p, P.rotates, P.stemDetaches);
}
export function stemAttached(p: number): boolean {
  return p < P.stemDetaches;
}

/** Spring-back of the released stem and branch, 0 until the stem lets go, damped after. */
export function branchRecoil(p: number): number {
  if (p < P.stemDetaches) return 0;
  const t = (p - P.stemDetaches) / 0.004;
  return Math.exp(-t * 0.9) * Math.cos(t * 2.4);
}

/** Depth-of-field extras for the studio transition: background veils toward cream. */
export function studioMix(p: number): number {
  return win(p, P.fingersApproach, P.towardCamera);
}
