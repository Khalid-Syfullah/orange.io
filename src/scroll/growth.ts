import { GROWTH } from "./script";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Smooth 0 to 1 over [a, b]. */
export const ease = (p: number, a: number, b: number) => {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const window01 = (p: number, w: readonly [number, number]) => ease(p, w[0], w[1]);

/** Trunk height in metres: a subtle rise first, then slower growth through the scene. */
export function trunkHeight(p: number): number {
  return 1.55 + 0.75 * window01(p, GROWTH.trunk) + 0.95 * ease(p, GROWTH.trunk[0] + 0.02, GROWTH.fruit[0] + 0.02);
}

/** Share of a primary branch's mature length at `p` (branch i staggers slightly). */
export function branchGrowth(p: number, i: number): number {
  const a = GROWTH.branches[0] + i * 0.002;
  return ease(p, a, a + 0.04);
}

/** Share of a secondary branch's mature length at `p`. */
export function secondaryGrowth(p: number, i: number): number {
  const a = GROWTH.fuller[0] - 0.01 + i * 0.0008;
  return ease(p, a, a + 0.028);
}

/** Leaf unfold 0..1 inside its own [a, b] window (a === b means always open). */
export function leafUnfold(p: number, a: number, b: number): number {
  return a === b ? 1 : ease(p, a, b);
}

/** Fruit k: stem 0..1, then radius share 0..1 (small green oranges appear last). */
export function fruitStem(p: number, k: number): number {
  const a = GROWTH.fruit[0] + k * 0.002;
  return ease(p, a, a + 0.02);
}
export function fruitSize(p: number, k: number): number {
  const a = GROWTH.fruit[0] + 0.006 + k * 0.002;
  return ease(p, a, GROWTH.fruit[1]);
}
