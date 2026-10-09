import { describe, expect, it } from "vitest";
import { ORANGE_RADIUS, studioPose, studioScreen } from "./studio";
import { FLY_ANCHORS, SPLIT as P, STUDIO as S } from "./script";

describe("studio orange", () => {
  it("appears at 0.68 at the same size as the fly orange, centred and unrotated", () => {
    expect(studioPose(S.start - 0.001).visible).toBe(false);
    const a = studioPose(S.start);
    expect(a.visible).toBe(true);
    expect(a.y).toBeCloseTo(0, 9);
    expect(a.rotY).toBe(0);
    // diameter in vh must equal the fly orange's (scale x the 13.68vh the svg circle spans)
    const diameter = studioScreen(S.start).radiusVh * 2;
    expect(diameter).toBeCloseTo(FLY_ANCHORS.center.scale * 13.68, 6);
    expect(ORANGE_RADIUS).toBeGreaterThan(0);
  });
  it("settles back to exactly the centre", () => {
    expect(studioPose(S.settle[0]).y).toBeCloseTo(0, 9);
    expect(studioPose(S.settle[1]).y).toBeCloseTo(0, 9);
    expect(Math.abs(studioPose((S.settle[0] + S.settle[1]) / 2).y)).toBeGreaterThan(0);
  });
  it("rotates only inside the rotate window, tied to scroll and reversible", () => {
    expect(studioPose(S.rotate[0]).rotY).toBe(0);
    expect(studioPose(S.rotate[1]).rotY).toBeCloseTo(3.4, 9);
    let prev = 0;
    for (let p = S.rotate[0]; p <= S.rotate[1]; p += 0.0005) {
      const r = studioPose(p).rotY;
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
    const a = studioPose(0.755).rotY;
    studioPose(0.9);
    expect(studioPose(0.755).rotY).toBe(a);
    expect(studioPose(S.rotate[1]).rotX).toBeCloseTo(0, 6);
  });
  it("grows a little at the end and reveals the equator mark", () => {
    expect(studioPose(S.grow[0]).scale).toBe(1);
    expect(studioPose(S.grow[1]).scale).toBeCloseTo(1.12, 9);
    expect(studioScreen(S.mark[0]).mark).toBe(0);
    expect(studioScreen(S.mark[1]).mark).toBe(1);
    expect(studioScreen(S.grow[1]).radiusVh).toBeGreaterThan(studioScreen(S.start).radiusVh);
  });
});

describe("split scene", () => {
  it("swaps whole for halves at 0.80 in the identical pose", () => {
    const before = studioPose(P.stop[0] - 1e-6);
    const at = studioPose(P.stop[0]);
    expect(before.halves).toBe(false);
    expect(at.halves).toBe(true);
    expect(at.rotY).toBeCloseTo(before.rotY, 4);
    expect(at.scale).toBeCloseTo(before.scale, 9);
    expect(at.gap).toBe(0);
    expect(at.outward).toBe(0);
  });
  it("winds the spin down to a whole turn and turns the stem axis horizontal", () => {
    const end = studioPose(P.stop[1]);
    expect(end.rotY).toBeCloseTo(Math.PI * 2, 9);
    expect(end.orient).toBeCloseTo(Math.PI / 2, 9);
    expect(end.rotX).toBeCloseTo(0, 6);
  });
  it("stays closed (no gap) until the separation line, then opens monotonically", () => {
    expect(studioPose(P.line[0]).gap).toBe(0);
    let prev = 0;
    for (let p = P.line[0]; p <= P.faces[1]; p += 0.0005) {
      const g = studioPose(p).gap;
      expect(g).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = g;
    }
    expect(studioPose(P.line[1]).gap).toBeCloseTo(0.025, 9);
    expect(studioPose(P.faces[1]).outward).toBe(1);
  });
  it("deepens the backdrop to press and pulls the camera back at the end", () => {
    expect(studioPose(P.faces[0]).press).toBe(0);
    expect(studioPose(P.faces[1]).press).toBe(1);
    expect(studioPose(P.faces[1]).cameraZ).toBeGreaterThan(studioPose(P.faces[0]).cameraZ);
  });
  it("is reversible", () => {
    const a = { ...studioPose(0.87) };
    studioPose(0.5);
    expect(studioPose(0.87)).toEqual(a);
  });
});
