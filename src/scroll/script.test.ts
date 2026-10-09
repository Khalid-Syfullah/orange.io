import { describe, expect, it } from "vitest";
import {
  BEATS,
  CHAPTERS,
  PACING,
  RULES,
  SCENES,
  SCENE_NAMES,
  STAGE_VH,
  TRAVEL,
  validateScript,
  type BeatDef,
} from "./script";

const withBeat = (patch: Partial<BeatDef> & { id: string }): BeatDef[] => {
  const base = BEATS.find((b) => b.id === "plant")!;
  return [...BEATS, { ...base, ...patch }];
};

describe("scroll script", () => {
  it("passes its own validation", () => {
    expect(() => validateScript()).not.toThrow();
  });

  it("derives the pacing budget from SCENES and tiles the stage", () => {
    expect(SCENE_NAMES.reduce((s, n) => s + PACING[n], 0)).toBe(STAGE_VH);
    expect(PACING.opening).toBe(Math.round(SCENES.opening[1] * STAGE_VH));
  });

  it("keeps chapter anchors in order", () => {
    expect(CHAPTERS.map((c) => c.at)).toEqual([0.012, 0.22, 0.56, 0.8]);
  });

  it("gives every scene a long travel stretch", () => {
    for (const n of SCENE_NAMES) {
      const longest = Math.max(...TRAVEL.filter((t) => t.scene === n).map((t) => t.lengthVh));
      expect(longest).toBeGreaterThanOrEqual(RULES.travelMin);
    }
  });

  it("rejects overlapping beats in a slot", () => {
    const plant = BEATS.find((b) => b.id === "plant")!;
    const beats = withBeat({ id: "dup", startVh: plant.startVh + 10, endVh: plant.endVh + 10 });
    expect(() => validateScript(beats)).toThrow(/overlap/);
  });

  it("rejects gaps that are too short", () => {
    const plant = BEATS.find((b) => b.id === "plant")!;
    const beats = withBeat({ id: "tight", startVh: plant.endVh + 5, endVh: plant.endVh + 105 });
    expect(() => validateScript(beats)).toThrow(/gap/);
  });

  it("rejects a hero beat that leaves late", () => {
    const beats = BEATS.map((b) => (b.id === "hero" ? { ...b, endVh: 90 } : b));
    expect(() => validateScript(beats)).toThrow(/hero/);
  });

  it("rejects a scene with no long travel stretch", () => {
    const hero = BEATS.find((b) => b.id === "hero")!;
    // a card from 60vh to 160vh leaves only short gaps in the 192vh opening scene
    const filler: BeatDef = { ...hero, id: "filler", slot: "right-card", startVh: 60, endVh: 160 };
    expect(() => validateScript([...BEATS, filler])).toThrow(/travel/);
  });
});
