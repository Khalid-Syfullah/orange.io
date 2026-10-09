import { describe, expect, it } from "vitest";
import { branchRecoil, grasp, handDistance, handPresence, pull, stemAttached, stemStretch, studioMix, toCamera, twist } from "./pluck";
import { FLY_HANDOVER, PLUCK as P } from "./script";

describe("pluck timeline", () => {
  it("keeps the hand out of frame until it enters at 0.58", () => {
    expect(handPresence(P.handEnters - 0.001)).toBe(0);
    expect(handPresence(P.fingersApproach)).toBe(1);
    expect(handDistance(P.handEnters)).toBe(1);
  });
  it("approaches, hovers, then closes to contact as the fingers wrap", () => {
    expect(handDistance(P.fingersApproach)).toBeCloseTo(0.3, 6);
    expect(handDistance(P.wraps)).toBeCloseTo(0, 6);
    expect(grasp(P.fingersApproach)).toBe(0);
    expect(grasp(P.wraps)).toBe(1);
  });
  it("twists the fruit around 0.64 and stretches then releases the stem at 0.65", () => {
    expect(twist(P.wraps)).toBe(0);
    expect(twist(P.rotates + 0.005)).toBeCloseTo(0.6, 6);
    expect(stemStretch(P.stemDetaches)).toBe(1);
    expect(stemAttached(P.stemDetaches - 0.0001)).toBe(true);
    expect(stemAttached(P.stemDetaches)).toBe(false);
    expect(branchRecoil(P.stemDetaches - 0.001)).toBe(0);
    expect(Math.abs(branchRecoil(P.stemDetaches + 0.0005))).toBeGreaterThan(0.1);
    expect(Math.abs(branchRecoil(P.stemDetaches + 0.03))).toBeLessThan(0.01);
  });
  it("pulls free by 0.66 and moves toward the camera by 0.68", () => {
    expect(pull(P.separates)).toBe(1);
    expect(toCamera(P.separates)).toBe(0);
    expect(toCamera(P.towardCamera)).toBe(1);
  });
  it("opens the hand and withdraws after the hand-over, gone by 0.68", () => {
    expect(grasp(FLY_HANDOVER)).toBe(1);
    expect(handPresence(P.towardCamera)).toBe(0);
    expect(handDistance(P.towardCamera)).toBeGreaterThan(0.99);
    expect(studioMix(P.towardCamera)).toBe(1);
  });
  it("is a pure function of progress (reverses exactly)", () => {
    const a = [grasp(0.61), handDistance(0.61), twist(0.63)];
    handDistance(0.9);
    expect([grasp(0.61), handDistance(0.61), twist(0.63)]).toEqual(a);
  });
});
