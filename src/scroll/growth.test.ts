import { describe, expect, it } from "vitest";
import { branchGrowth, ease, fruitSize, fruitStem, leafUnfold, secondaryGrowth, trunkHeight } from "./growth";
import { GROWTH } from "./script";

describe("tree growth windows", () => {
  it("grows the trunk first, subtly, then keeps rising", () => {
    expect(trunkHeight(0.22)).toBeCloseTo(1.55, 6);
    const afterTrunk = trunkHeight(GROWTH.trunk[1]);
    expect(afterTrunk).toBeGreaterThan(1.55);
    expect(trunkHeight(0.42)).toBeGreaterThan(afterTrunk);
    expect(trunkHeight(0.42)).toBeLessThan(3.5);
  });
  it("extends branches only after the trunk phase and finishes by the leaf phase", () => {
    expect(branchGrowth(GROWTH.branches[0], 0)).toBe(0);
    expect(branchGrowth(GROWTH.leaves[0] + 0.01, 7)).toBe(1);
  });
  it("adds secondary branches and fruit in order", () => {
    expect(secondaryGrowth(GROWTH.fuller[0] - 0.02, 0)).toBe(0);
    expect(secondaryGrowth(GROWTH.fruit[0] + 0.001, 15)).toBe(1);
    expect(fruitStem(GROWTH.fruit[0], 0)).toBe(0);
    expect(fruitSize(GROWTH.fruit[0], 0)).toBe(0);
    expect(fruitSize(GROWTH.fruit[1], 9)).toBe(1);
    // the stem leads the fruit
    expect(fruitStem(0.395, 0)).toBeGreaterThan(fruitSize(0.395, 0));
  });
  it("unfolds a leaf inside its window and treats a == b as always open", () => {
    expect(leafUnfold(0.31, 0.32, 0.34)).toBe(0);
    expect(leafUnfold(0.34, 0.32, 0.34)).toBe(1);
    expect(leafUnfold(0.1, 0, 0)).toBe(1);
  });
  it("is a pure function of progress", () => {
    const a = ease(0.3, 0.27, 0.32);
    ease(0.9, 0.27, 0.32);
    expect(ease(0.3, 0.27, 0.32)).toBe(a);
  });
});
