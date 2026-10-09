import { BEATS, FRAME, FRAME_TRANSITION_VH, PULSE_SCALE, PULSE_VH, SCENE_NAMES, SCENE_START_VH } from "./script";

/** Interpolated frame values for one scroll position. */
export type FrameValues = {
  /** 0 = hero grid positions, 1 = lines at the screen edges (open). */
  o: number;
  /** 0 = open at the edges, 1 = vertical lines locked at `lockL` / `lockR`. */
  k: number;
  /** 0 = visible, 1 = exited and hidden (closed). */
  c: number;
  lockL: number;
  lockR: number;
};

type Key = { startVh: number; v: FrameValues };

const HERO: FrameValues = { o: 0, k: 0, c: 0, lockL: 32, lockR: 68 };

/** Keyframes derived from the script's per-scene frame states. */
function buildKeys(): Key[] {
  const keys: Key[] = [{ startVh: 0, v: HERO }];
  let prev = HERO;
  for (const n of SCENE_NAMES) {
    const f = FRAME[n];
    const v: FrameValues =
      f.state === "hero"
        ? HERO
        : f.state === "open"
          ? { o: 1, k: f.lock ? 1 : 0, c: 0, lockL: f.lock?.l ?? prev.lockL, lockR: f.lock?.r ?? prev.lockR }
          : { ...prev, c: 1 };
    const same = (Object.keys(v) as (keyof FrameValues)[]).every((k) => v[k] === prev[k]);
    if (!same) keys.push({ startVh: f.fromVh ?? SCENE_START_VH[n], v });
    prev = v;
  }
  return keys;
}

const KEYS = buildKeys();

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// same curve as EASE (0.22, 1, 0.36, 1), solved numerically so this module stays dependency-free
function easeOutSoft(t: number): number {
  const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid; else hi = mid;
  }
  return by((lo + hi) / 2);
}

/** Frame values at stage vh `vh`. A pure function of scroll, so it reverses exactly. */
export function frameAt(vh: number): FrameValues {
  let i = 0;
  for (let j = KEYS.length - 1; j >= 0; j--) {
    if (vh >= KEYS[j].startVh) {
      i = j;
      break;
    }
  }
  if (i === 0) return KEYS[0].v;
  const from = KEYS[i - 1].v;
  const to = KEYS[i].v;
  const t = easeOutSoft(clamp01((vh - KEYS[i].startVh) / FRAME_TRANSITION_VH));
  return {
    o: lerp(from.o, to.o, t),
    k: lerp(from.k, to.k, t),
    c: lerp(from.c, to.c, t),
    // a lock position only matters once k > 0, so take the target's
    lockL: to.lockL,
    lockR: to.lockR,
  };
}

const BOUNDARIES_VH = BEATS.flatMap((b) => (b.out > 1 ? [b.startVh] : [b.startVh, b.endVh]));

/** Registration mark scale at stage vh: 1 to 1.4 to 1 around each beat change. */
export function pulseAt(vh: number): number {
  let bump = 0;
  for (const b of BOUNDARIES_VH) {
    const d = Math.abs(vh - b) / PULSE_VH;
    if (d < 1) bump = Math.max(bump, Math.sin((1 - d) * Math.PI * 0.5) ** 2);
  }
  return 1 + (PULSE_SCALE - 1) * bump;
}
