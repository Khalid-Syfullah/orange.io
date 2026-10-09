import { CLOUD_SLOWDOWN as C } from "./script";

/**
 * Cloud drift phase for progress `p`: the integral of a speed that is 1 until
 * C.from, eases down to C.speed by C.to, then holds. Continuous in p, so slowing
 * the clouds never makes them jump, and it reverses exactly.
 */
export function cloudPhase(p: number): number {
  if (p <= C.from) return p;
  const span = C.to - C.from;
  const q = Math.min(p, C.to) - C.from;
  const ramp = q - ((1 - C.speed) * q * q) / (2 * span);
  const base = C.from + ramp;
  return p <= C.to ? base : base + C.speed * (p - C.to);
}

/** Instantaneous cloud speed (derivative of cloudPhase). */
export function cloudSpeed(p: number): number {
  if (p <= C.from) return 1;
  if (p >= C.to) return C.speed;
  return 1 - ((1 - C.speed) * (p - C.from)) / (C.to - C.from);
}
