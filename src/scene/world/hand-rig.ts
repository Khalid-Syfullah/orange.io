import { Vector3 } from "three";

// A skeletal hand in its own local space (units: metres at scale 1; the group scales it up).
// +y along the open fingers, +z is the palm normal (fingers curl toward +z), +x across the palm.

export type FingerSpec = {
  name: string;
  root: [number, number, number];
  /** Rotation of the finger plane about z, radians (spread / thumb abduction). */
  yaw: number;
  lengths: number[];
  radii: number[];
  /** Maximum curl per joint, radians. */
  maxCurl: number[];
};

export const PALM = { width: 0.085, length: 0.095, thickness: 0.026 };

export const FINGERS: FingerSpec[] = [
  { name: "index", root: [-0.03, 0.047, 0], yaw: 0.04, lengths: [0.042, 0.025, 0.02], radii: [0.0095, 0.0085, 0.0075], maxCurl: [1.45, 1.6, 1.15] },
  { name: "middle", root: [-0.01, 0.049, 0], yaw: 0.0, lengths: [0.046, 0.028, 0.021], radii: [0.01, 0.009, 0.008], maxCurl: [1.5, 1.65, 1.15] },
  { name: "ring", root: [0.01, 0.047, 0], yaw: -0.03, lengths: [0.043, 0.026, 0.02], radii: [0.0095, 0.0085, 0.0075], maxCurl: [1.5, 1.65, 1.15] },
  { name: "pinky", root: [0.029, 0.042, 0], yaw: -0.09, lengths: [0.034, 0.02, 0.018], radii: [0.0085, 0.0075, 0.007], maxCurl: [1.5, 1.7, 1.2] },
  { name: "thumb", root: [-0.043, -0.02, 0.004], yaw: 0.85, lengths: [0.036, 0.029], radii: [0.012, 0.0105], maxCurl: [0.95, 1.2] },
];

const tmp = { a: new Vector3(), b: new Vector3(), d: new Vector3(), axis: new Vector3(), u: new Vector3(), v: new Vector3() };

/** Rotates `dir` about unit `axis` by `ang` in place (Rodrigues). */
function rotate(dir: Vector3, axis: Vector3, ang: number) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  tmp.u.copy(axis).cross(dir); // axis x dir
  const dot = axis.dot(dir);
  dir.multiplyScalar(c).addScaledVector(tmp.u, s).addScaledVector(axis, dot * (1 - c));
}

/** Distance from point `c` to the segment a-b. */
export function distToSegment(c: Vector3, a: Vector3, b: Vector3): number {
  tmp.d.subVectors(b, a);
  const len2 = tmp.d.lengthSq();
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, tmp.v.subVectors(c, a).dot(tmp.d) / len2));
  tmp.v.copy(a).addScaledVector(tmp.d, t);
  return tmp.v.distanceTo(c);
}

/**
 * Joint positions of one finger for the given curls. `points` must have
 * lengths.length + 1 vectors; `mirror` flips the hand (x and yaw).
 */
export function fingerPoints(f: FingerSpec, curls: number[], mirror: 1 | -1, points: Vector3[]) {
  const yaw = f.yaw * mirror;
  tmp.axis.set(Math.cos(yaw), Math.sin(yaw), 0);
  const dir = tmp.b.set(-Math.sin(yaw), Math.cos(yaw), 0);
  points[0].set(f.root[0] * mirror, f.root[1], f.root[2]);
  for (let k = 0; k < f.lengths.length; k++) {
    rotate(dir, tmp.axis, curls[k]);
    points[k + 1].copy(points[k]).addScaledVector(dir, f.lengths[k]);
  }
}

const CLEARANCE = 0.0015;
const STEPS = 16;

function allClear(f: FingerSpec, c: Vector3, r: number, points: Vector3[]): boolean {
  for (let k = 0; k < f.lengths.length; k++) {
    if (distToSegment(c, points[k], points[k + 1]) < r + f.radii[k] + CLEARANCE) return false;
  }
  return true;
}

/**
 * Contact-limited curl. The joints close together (each toward `grasp * maxCurl`)
 * until the first bone would touch the fruit (sphere centre `c`, radius `r`, in
 * hand-local space); then the outer joints keep curling for as long as every bone
 * stays clear, so the finger wraps the fruit. Every pose it returns was checked
 * bone by bone, so a finger never passes through the fruit. Writes `curls`.
 */
export function solveCurls(f: FingerSpec, grasp: number, c: Vector3, r: number, mirror: 1 | -1, curls: number[], points: Vector3[]) {
  const n = f.lengths.length;
  const setAll = (t: number) => {
    for (let k = 0; k < n; k++) curls[k] = t * grasp * f.maxCurl[k];
    fingerPoints(f, curls, mirror, points);
  };
  setAll(0);
  if (grasp <= 0 || !allClear(f, c, r, points)) return; // open hand, or a pose problem upstream: stay straight

  // 1. all joints together, up to the first contact
  let lo = 0;
  let hi = 1;
  let blocked = false;
  for (let s = 1; s <= STEPS; s++) {
    setAll(s / STEPS);
    if (!allClear(f, c, r, points)) {
      hi = s / STEPS;
      blocked = true;
      break;
    }
    lo = s / STEPS;
  }
  if (blocked) {
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      setAll(mid);
      if (allClear(f, c, r, points)) lo = mid;
      else hi = mid;
    }
  }
  setAll(blocked ? lo : 1);

  // 2. keep curling the outer joints while everything stays clear
  for (let k = n - 1; k >= 0 && blocked; k--) {
    const max = grasp * f.maxCurl[k];
    for (let step = 0; step < 24 && curls[k] < max; step++) {
      const prev = curls[k];
      curls[k] = Math.min(max, prev + 0.05);
      fingerPoints(f, curls, mirror, points);
      if (!allClear(f, c, r, points)) {
        curls[k] = prev;
        break;
      }
    }
  }
  fingerPoints(f, curls, mirror, points);
}
