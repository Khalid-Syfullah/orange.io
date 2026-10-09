import { describe, expect, it } from "vitest";
import { frameAt, pulseAt } from "./frame";
import { FRAME_TRANSITION_VH, PULSE_SCALE, SCENE_START_VH, BEATS } from "./script";

describe("frame states", () => {
  it("starts in the hero state and holds it through the first screen", () => {
    expect(frameAt(0)).toMatchObject({ o: 0, k: 0, c: 0 });
    expect(frameAt(99)).toMatchObject({ o: 0, k: 0, c: 0 });
  });

  it("opens after the first screen and is fully open by the next scene", () => {
    expect(frameAt(100 + FRAME_TRANSITION_VH / 2).o).toBeGreaterThan(0.5);
    expect(frameAt(SCENE_START_VH.watering).o).toBeCloseTo(1, 5);
    expect(frameAt(SCENE_START_VH.growth).o).toBe(1);
  });

  it("locks the vertical lines in the split scene and releases them nowhere else", () => {
    expect(frameAt(SCENE_START_VH.floating).k).toBe(0);
    expect(frameAt(SCENE_START_VH.split + FRAME_TRANSITION_VH).k).toBeCloseTo(1, 5);
    expect(frameAt(SCENE_START_VH.split + FRAME_TRANSITION_VH).lockL).toBe(32);
  });

  it("closes in the brand scene", () => {
    expect(frameAt(SCENE_START_VH.brand - 1).c).toBe(0);
    expect(frameAt(SCENE_START_VH.brand + FRAME_TRANSITION_VH).c).toBeCloseTo(1, 5);
  });

  it("is a pure function of scroll (reversible)", () => {
    const a = frameAt(130);
    frameAt(2000);
    expect(frameAt(130)).toEqual(a);
  });
});

describe("registration pulse", () => {
  it("peaks at a beat change and is 1 in between", () => {
    const plant = BEATS.find((b) => b.id === "plant")!;
    expect(pulseAt(plant.startVh)).toBeCloseTo(PULSE_SCALE, 5);
    expect(pulseAt(plant.startVh + 50)).toBe(1);
  });
});
