import { describe, expect, it } from "vitest";
import { CYCLES, dropletU, dropletVisible, flowWindow, landingScale, trajectory, wetness } from "./watering";
import { WATERING as W } from "./script";

describe("watering flow", () => {
  it("has no stream before flowAt and a full-reach front by groundAt", () => {
    expect(flowWindow(W.flowAt - 0.001).front).toBe(0);
    expect(flowWindow(W.flowAt + (W.groundAt - W.flowAt) / 2).front).toBeCloseTo(0.5, 6);
    expect(flowWindow(W.groundAt).front).toBe(1);
  });
  it("thins from the spout and is gone by relaxAt", () => {
    expect(flowWindow(W.stopAt - 0.01).tail).toBe(0);
    expect(flowWindow(W.relaxAt).tail).toBe(1);
    expect(dropletVisible(0.5, W.relaxAt)).toBe(false);
    expect(dropletVisible(0.5, 0.18)).toBe(true);
  });
  it("darkens the soil after water lands and keeps it dark", () => {
    expect(wetness(W.groundAt)).toBe(0);
    expect(wetness(W.relaxAt)).toBe(1);
    expect(wetness(0.9)).toBe(1);
  });
  it("is a pure function of scroll (reverses exactly)", () => {
    const a = dropletU(3, 40, 0.1734);
    dropletU(3, 40, 0.5);
    expect(dropletU(3, 40, 0.1734)).toBe(a);
    expect(CYCLES).toBeGreaterThan(0);
  });
});

describe("droplet trajectory", () => {
  const o = { x: 1, y: 1.2, z: 0.3 };
  const t = { x: 2.2, z: 0 };
  const out = { x: 0, y: 0, z: 0 };
  it("starts at the spout and lands on the ground at the target", () => {
    expect(trajectory(0, o, t, 0, out)).toMatchObject({ x: 1, y: 1.2, z: 0.3 });
    const end = trajectory(1, o, t, 0, out);
    expect(end.y).toBeCloseTo(0, 9);
    expect(end.x).toBeCloseTo(2.2, 9);
  });
  it("curves: falls slowly at first, faster near the ground", () => {
    const y1 = trajectory(0.25, o, t, 0, { x: 0, y: 0, z: 0 }).y;
    const y2 = trajectory(0.75, o, t, 0, { x: 0, y: 0, z: 0 }).y;
    expect(o.y - y1).toBeLessThan(y1 - y2);
  });
  it("shrinks droplets to nothing on contact", () => {
    expect(landingScale(0.5)).toBe(1);
    expect(landingScale(1)).toBe(0);
  });
});
