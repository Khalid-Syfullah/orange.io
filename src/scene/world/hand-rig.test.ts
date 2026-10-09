import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { FINGERS, distToSegment, solveCurls } from "./hand-rig";

const mk = (f: { lengths: number[] }) => Array.from({ length: f.lengths.length + 1 }, () => new Vector3());

describe("hand rig", () => {
  const fruit = new Vector3(0, 0.02, 0.108); // resting on the palm side, as in a grasp
  const r = 0.07;

  it("never lets a bone pass through the fruit at any grasp", () => {
    for (const f of FINGERS) {
      for (const g of [0.2, 0.5, 0.8, 1]) {
        const curls = f.lengths.map(() => 0);
        const pts = mk(f);
        solveCurls(f, g, fruit, r, 1, curls, pts);
        for (let k = 0; k < f.lengths.length; k++) {
          expect(distToSegment(fruit, pts[k], pts[k + 1])).toBeGreaterThanOrEqual(r + f.radii[k] - 1e-6);
        }
      }
    }
  });

  it("curls further as the grasp increases", () => {
    const f = FINGERS[1];
    const total = (g: number) => {
      const curls = f.lengths.map(() => 0);
      solveCurls(f, g, fruit, r, 1, curls, mk(f));
      return curls.reduce((a, b) => a + b, 0);
    };
    expect(total(0)).toBe(0);
    expect(total(0.5)).toBeGreaterThan(0);
    expect(total(1)).toBeGreaterThanOrEqual(total(0.5) - 0.25);
  });

  it("curls fully when nothing is in the way", () => {
    const f = FINGERS[0];
    const curls = f.lengths.map(() => 0);
    solveCurls(f, 1, new Vector3(0, 0, 5), 0.07, 1, curls, mk(f));
    expect(curls[0]).toBeCloseTo(f.maxCurl[0], 6);
  });

  it("is deterministic (same input, same pose)", () => {
    const f = FINGERS[2];
    const a = f.lengths.map(() => 0);
    const b = f.lengths.map(() => 0);
    solveCurls(f, 0.7, fruit, r, 1, a, mk(f));
    solveCurls(f, 0.7, fruit, r, 1, b, mk(f));
    expect(a).toEqual(b);
  });
});
