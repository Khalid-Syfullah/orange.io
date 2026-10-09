import { describe, expect, it } from "vitest";
import { cloudPhase, cloudSpeed } from "./clouds";
import { CLOUD_SLOWDOWN as C } from "./script";

describe("cloud slowdown", () => {
  it("is continuous at both ends of the ramp", () => {
    const e = 1e-7;
    expect(Math.abs(cloudPhase(C.from + e) - cloudPhase(C.from - e))).toBeLessThan(1e-6);
    expect(Math.abs(cloudPhase(C.to + e) - cloudPhase(C.to - e))).toBeLessThan(1e-6);
  });
  it("runs at full speed before and the slow speed after", () => {
    expect(cloudSpeed(0.1)).toBe(1);
    expect(cloudSpeed(0.9)).toBe(C.speed);
    expect(cloudPhase(0.3)).toBe(0.3);
  });
  it("never moves backward and slows down", () => {
    let prev = cloudPhase(0);
    for (let p = 0.001; p <= 1; p += 0.001) {
      const v = cloudPhase(p);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(cloudPhase(0.6) - cloudPhase(0.5)).toBeLessThan(0.1 * 0.5);
  });
});
