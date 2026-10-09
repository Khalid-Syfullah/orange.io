import { describe, expect, it } from "vitest";
import { flyAt } from "./fly";
import { BOUNDARIES, FLY_ANCHORS, FLY_PATH, SCENE_START_VH, TRANSITION_VH, validateScript } from "./script";

describe("fly path", () => {
  it("is hidden before the fruit appears and after it leaves", () => {
    expect(flyAt(0).opacity).toBe(0);
    expect(flyAt(2300).opacity).toBe(0);
  });

  it("sits exactly on the named anchors at its keys", () => {
    const hand = flyAt(1587);
    expect(hand.x).toBeCloseTo(FLY_ANCHORS.hand.x, 5);
    expect(flyAt(1632)).toMatchObject({ x: FLY_ANCHORS.center.x, y: FLY_ANCHORS.center.y });
  });

  it("travels from hand to center inside the plucking to floating dissolve", () => {
    const b = BOUNDARIES.find((t) => t.to === "floating")!;
    expect(FLY_PATH.some((k) => k.anchor === "hand" && k.vh === b.startVh)).toBe(true);
    expect(FLY_PATH.some((k) => k.anchor === "center" && k.vh === b.atVh)).toBe(true);
    const mid = flyAt(b.startVh + TRANSITION_VH / 2);
    expect(mid.x).toBeGreaterThan(FLY_ANCHORS.hand.x - 1e-9);
    expect(mid.opacity).toBe(1);
  });

  it("is reversible", () => {
    const a = { ...flyAt(1540) };
    flyAt(100);
    expect(flyAt(1540)).toEqual(a);
  });
});

describe("transitions", () => {
  it("dissolves every scene change except into the live world scenes, ending at the scene start", () => {
    expect(BOUNDARIES).toHaveLength(3);
    expect(BOUNDARIES.some((t) => ["watering", "growth", "ripening", "plucking"].includes(t.to))).toBe(false);
    expect(BOUNDARIES[0].atVh).toBe(SCENE_START_VH.floating);
  });

  it("keeps dissolve windows off beats (validateScript)", () => {
    expect(() => validateScript()).not.toThrow();
  });
});
