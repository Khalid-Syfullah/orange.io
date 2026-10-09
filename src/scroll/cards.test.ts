import { describe, expect, it } from "vitest";
import { BEATS, CARD_GROUPS, STUDIO } from "./script";
import { studioScreen } from "./studio";
import { SPLIT } from "./script";

describe("card groups", () => {
  const card = BEATS.filter((b) => b.kind === "cards");
  it("has Plant (3), Tend (3) and Harvest (2), each used by one right-card beat", () => {
    expect(CARD_GROUPS.map((g) => [g.name, g.cards.length])).toEqual([["Plant", 3], ["Tend", 3], ["Harvest", 2]]);
    expect(card).toHaveLength(3);
    card.forEach((b) => expect(b.slot).toBe("right-card"));
  });
  it("puts Plant and Tend in the growth chapter and Harvest in the harvest chapter", () => {
    const [plant, tend, harvest] = card;
    expect(plant.at).toBeGreaterThanOrEqual(0.22);
    expect(tend.out).toBeLessThanOrEqual(0.56);
    expect(harvest.at).toBeGreaterThanOrEqual(0.56);
    expect(harvest.out).toBeLessThanOrEqual(0.8);
  });
  it("never overlap in time", () => {
    for (let i = 1; i < card.length; i++) expect(card[i].at).toBeGreaterThan(card[i - 1].out);
  });
  it("keeps the harvest cards clear of the studio orange (right column starts at 68%)", () => {
    const mid = (card[2].at + card[2].out) / 2;
    // the orange is centred; at 16:10 its right edge (in % of width) is 50 + radiusVh * (100/160)
    const edgePct = 50 + studioScreen(mid).radiusVh * (100 / 160);
    expect(edgePct).toBeLessThan(68);
    expect(STUDIO.start).toBeLessThan(card[2].at);
    expect(SPLIT.stop[0]).toBeGreaterThan(card[2].out);
  });
});
