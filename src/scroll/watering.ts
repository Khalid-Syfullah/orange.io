import { WATERING as W } from "./script";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** How many times a droplet column cycles over the whole stage (water moves as you scroll). */
export const CYCLES = 70;

/**
 * The visible part of the stream, as fractions of its path from spout (0) to
 * ground (1). The front reaches the ground between flowAt and groundAt; the
 * tail leaves the spout as the flow stops, so the stream thins and ends.
 */
export function flowWindow(p: number): { front: number; tail: number } {
  const front = clamp01((p - W.flowAt) / (W.groundAt - W.flowAt));
  const tail = clamp01((p - (W.stopAt - 0.005)) / (W.relaxAt - 0.005 - (W.stopAt - 0.005)));
  return { front, tail };
}

/** 0 = dry soil, 1 = fully darkened. Starts when water lands and then stays (it carries into later scenes). */
export function wetness(p: number): number {
  return smooth(clamp01((p - W.groundAt) / (W.relaxAt - W.groundAt)));
}

/** Position of droplet `i` of `n` along its path (0 spout, 1 ground). Pure function of scroll. */
export function dropletU(i: number, n: number, p: number): number {
  const v = i / n + p * CYCLES;
  return v - Math.floor(v);
}

/** Whether a droplet at path position `u` is inside the stream at progress `p`. */
export function dropletVisible(u: number, p: number): boolean {
  const { front, tail } = flowWindow(p);
  return front > 0 && u <= front && u >= tail;
}

/**
 * Point on the droplet's parabola from `origin` (spout) to `target` (on the
 * ground): horizontal motion is linear in u, the fall is h*u^2, so u = 1 lands
 * exactly on the ground at the target. Writes into `out`.
 */
export function trajectory(
  u: number,
  origin: { x: number; y: number; z: number },
  target: { x: number; z: number },
  groundY: number,
  out: { x: number; y: number; z: number },
) {
  const h = origin.y - groundY;
  out.x = origin.x + (target.x - origin.x) * u;
  out.z = origin.z + (target.z - origin.z) * u;
  out.y = origin.y - h * u * u;
  return out;
}

/** Scale multiplier: droplets shrink to nothing as they land. */
export function landingScale(u: number): number {
  return 1 - smooth(clamp01((u - 0.9) / 0.1));
}
