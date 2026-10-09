import { describe, expect, it } from "vitest";
import { CHAPTERS } from "./script";
import { MIN_SEGMENT_SPAN, railSegments } from "./segments";

describe("rail segments", () => {
  const segs = railSegments();

  it("tile 0 to 1 without gaps or overlaps", () => {
    expect(segs[0].a).toBe(0);
    expect(segs[segs.length - 1].b).toBe(1);
    for (let i = 1; i < segs.length; i++) expect(segs[i].a).toBe(segs[i - 1].b);
  });

  it("have no slivers", () => {
    for (const s of segs) expect(s.b - s.a).toBeGreaterThanOrEqual(MIN_SEGMENT_SPAN - 1e-9);
  });

  it("break at every chapter start", () => {
    for (const c of CHAPTERS) expect(segs.some((s) => Math.abs(s.a - c.range[0]) < 1e-9)).toBe(true);
  });
});
