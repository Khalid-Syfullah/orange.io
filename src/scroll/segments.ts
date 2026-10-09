import { BEATS, CHAPTERS, SCENES, SCENE_NAMES } from "./script";

export type Segment = {
  /** Progress range the segment represents. */
  a: number;
  b: number;
  /** "beat" while a text beat is on screen, otherwise "travel". */
  kind: "beat" | "travel";
};

/** Boundaries closer than this (progress) to an existing one are merged away. */
export const MIN_SEGMENT_SPAN = 0.004;

/**
 * Progress boundaries of the rail: stage ends, chapter starts, scene starts,
 * then beat in/out points (a beat boundary is dropped when it would create a
 * sliver). Sorted ascending, always starting at 0 and ending at 1.
 */
export function railBoundaries(): number[] {
  const kept: number[] = [0, 1];
  const tryAdd = (p: number, force: boolean) => {
    if (p <= 0 || p >= 1) return;
    if (!force && kept.some((k) => Math.abs(k - p) < MIN_SEGMENT_SPAN)) return;
    if (!kept.some((k) => Math.abs(k - p) < 1e-9)) kept.push(p);
  };
  for (const c of CHAPTERS) tryAdd(c.range[0], true);
  for (const n of SCENE_NAMES) tryAdd(SCENES[n][0], true);
  for (const b of BEATS) {
    tryAdd(b.at, false);
    tryAdd(b.out, false);
  }
  return kept.sort((x, y) => x - y);
}

/** Segments of the rail line; their spans are proportional to scroll distance. */
export function railSegments(): Segment[] {
  const bounds = railBoundaries();
  const out: Segment[] = [];
  for (let i = 1; i < bounds.length; i++) {
    const a = bounds[i - 1];
    const b = bounds[i];
    const mid = (a + b) / 2;
    out.push({ a, b, kind: BEATS.some((x) => mid >= x.at && mid <= x.out) ? "beat" : "travel" });
  }
  return out;
}
