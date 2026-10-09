import { describe, expect, it } from "vitest";
import { dofStrength, focusMove, ripenCss, ripenGrowth, ripenRgb } from "./ripening";
import { RIPENING as R } from "./script";

const hex = (c: [number, number, number]) => "#" + c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

describe("ripening colour", () => {
  it("hits the three colours in the brief at the window ends", () => {
    expect(hex(ripenRgb(R.size[0]))).toBe("#568c43");
    expect(hex(ripenRgb(R.toYellow[1]))).toBe("#b4a83b");
    expect(hex(ripenRgb(R.ripe[1]))).toBe("#ff8500");
  });
  it("holds green through the growth window and ripe afterwards", () => {
    expect(hex(ripenRgb(0.44))).toBe("#568c43");
    expect(hex(ripenRgb(0.9))).toBe("#ff8500");
  });
  it("moves smoothly (no jumps) and reddens: red channel never decreases", () => {
    let prev = ripenRgb(0.42)[0];
    let last = ripenRgb(0.42);
    for (let p = 0.42; p <= 0.56; p += 0.0005) {
      const c = ripenRgb(p);
      expect(c[0]).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(Math.abs(c[0] - last[0]) + Math.abs(c[1] - last[1]) + Math.abs(c[2] - last[2])).toBeLessThan(0.05);
      prev = c[0];
      last = [...c];
    }
    expect(ripenCss(0.9)).toBe("rgb(255 133 0)");
  });
});

describe("ripening size, focus and depth of field", () => {
  it("grows the fruit only inside the size window", () => {
    expect(ripenGrowth(R.size[0])).toBe(1);
    expect(ripenGrowth(R.size[1])).toBeCloseTo(1.7, 9);
    expect(ripenGrowth(0.9)).toBeCloseTo(1.7, 9);
  });
  it("builds depth of field toward the end and holds it", () => {
    expect(dofStrength(0.4)).toBe(0);
    expect(dofStrength(R.focus[1])).toBe(1);
    expect(dofStrength(0.7)).toBe(1);
  });
  it("finishes the camera move exactly at the end of the scene", () => {
    expect(focusMove(R.size[0])).toBe(0);
    expect(focusMove(R.focus[1])).toBe(1);
  });
});
