import { describe, expect, it } from "vitest";
import { BEATS, adjacentBeat, beatLandingProgress } from "./timeline";

describe("J / K beat navigation", () => {
  it("moves strictly forward, visits every scene that has a beat, and ends at null", () => {
    let p = 0;
    let last = -1;
    const scenes = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const b = adjacentBeat(p, 1);
      if (!b) break;
      expect(b.at).toBeGreaterThan(last);
      last = b.at;
      scenes.add(b.scene);
      p = beatLandingProgress(b);
    }
    expect(adjacentBeat(p, 1)).toBeNull();
    expect(scenes.size).toBeGreaterThanOrEqual(7);
  });
  it("goes back to the previous beat, not the current one", () => {
    const sorted = [...BEATS].sort((a, b) => a.at - b.at);
    const cur = sorted[4];
    expect(adjacentBeat(beatLandingProgress(cur), -1)?.id).toBe(sorted[3].id);
    expect(adjacentBeat(0, -1)).toBeNull();
  });
});
