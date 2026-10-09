import { FLY_ANCHORS, FLY_PATH } from "./script";

export type FlyValues = { x: number; y: number; scale: number; rotate: number; opacity: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// the shared curve (0.22, 1, 0.36, 1), solved numerically so this module has no dependencies
function ease(t: number): number {
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * 0.22 + 3 * (1 - u) * u * u * 0.36 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u + 3 * (1 - u) * u * u + u * u * u;
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (bx(m) < t) lo = m; else hi = m;
  }
  return by((lo + hi) / 2);
}

const OUT: FlyValues = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0 };

/**
 * Fly element state at stage vh. Pure function of scroll (reversible). Writes
 * into `out` so per-frame calls do not allocate.
 */
export function flyAt(vh: number, out: FlyValues = OUT): FlyValues {
  const first = FLY_PATH[0];
  const last = FLY_PATH[FLY_PATH.length - 1];
  let a = first;
  let b = first;
  if (vh >= last.vh) {
    a = b = last;
  } else if (vh > first.vh) {
    for (let i = 1; i < FLY_PATH.length; i++) {
      if (vh <= FLY_PATH[i].vh) {
        a = FLY_PATH[i - 1];
        b = FLY_PATH[i];
        break;
      }
    }
  }
  const t = a === b ? 0 : ease(clamp01((vh - a.vh) / (b.vh - a.vh)));
  const A = FLY_ANCHORS[a.anchor];
  const B = FLY_ANCHORS[b.anchor];
  out.x = lerp(A.x, B.x, t);
  out.y = lerp(A.y, B.y, t);
  out.scale = lerp(A.scale, B.scale, t);
  out.rotate = lerp(A.rotate, B.rotate, t);
  out.opacity = lerp(a.opacity, b.opacity, t);
  return out;
}
