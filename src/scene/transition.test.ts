import { describe, expect, it } from "vitest";
import { activeBoundary, transitionMix } from "./transition";
import { BOUNDARIES, TRANSITION_VH } from "@/scroll/script";

describe("transition mix", () => {
  const b = BOUNDARIES[1];
  it("is exactly 0 before and 1 after the window", () => {
    expect(transitionMix(b.startVh - 10, b)).toBe(0);
    expect(transitionMix(b.startVh, b)).toBe(0);
    expect(transitionMix(b.atVh, b)).toBe(1);
    expect(transitionMix(b.atVh + 10, b)).toBe(1);
  });
  it("is linear inside and reverses", () => {
    expect(transitionMix(b.startVh + TRANSITION_VH / 2, b)).toBeCloseTo(0.5, 6);
    expect(transitionMix(b.startVh + 10, b)).toBe(transitionMix(b.startVh + 10, b));
  });
  it("finds the active boundary only inside a window", () => {
    expect(activeBoundary(b.startVh + 1)?.index).toBe(1);
    expect(activeBoundary(b.startVh - 1)).toBeNull();
    expect(activeBoundary(b.atVh)).toBeNull();
  });
});
