// The scroll script: data only. Every scene, beat and chapter reads from here.
// Prose version: SCROLL.md. All "vh" below are NOMINAL stage vh (progress x
// STAGE_VH). Real scroll travel is STAGE_VH - 100 viewport heights because the
// last screen is the sticky viewport itself.

/** Height of the scroll stage in viewport heights (svh). Tune freely. */
export const STAGE_VH = 2400;

/** Scene boundaries as fractions of the stage. The pacing budget derives from these. */
export const SCENES = {
  opening: [0, 0.08],
  watering: [0.08, 0.22],
  growth: [0.22, 0.42],
  ripening: [0.42, 0.56],
  plucking: [0.56, 0.68],
  floating: [0.68, 0.8],
  split: [0.8, 0.93],
  brand: [0.93, 1],
} as const satisfies Record<string, readonly [number, number]>;

export type SceneName = keyof typeof SCENES;
export const SCENE_NAMES = Object.keys(SCENES) as SceneName[];

// ---------------------------------------------------------------- pacing ---

/** Scene start (vh) on the whole stage. */
export const SCENE_START_VH = Object.fromEntries(
  SCENE_NAMES.map((n) => [n, Math.round(SCENES[n][0] * STAGE_VH)]),
) as Record<SceneName, number>;

/**
 * Pacing budget: vh per scene, derived from SCENES. At STAGE_VH = 2400 this is
 * opening 192, watering 336, growth 480, ripening 336, plucking 288,
 * floating 288, split 312, brand 168 (sums to STAGE_VH).
 */
export const PACING = Object.fromEntries(
  SCENE_NAMES.map((n) => [n, Math.round(SCENES[n][1] * STAGE_VH) - SCENE_START_VH[n]]),
) as Record<SceneName, number>;

// ----------------------------------------------------------------- rules ---

export const RULES = {
  dwellMin: 100,
  dwellMax: 130,
  gapMin: 25,
  gapMax: 40, // applies to consecutive beats of one slot inside one scene
  heroOutBy: 60,
  travelMin: 60, // every scene needs a beat-free stretch at least this long
} as const;

// ----------------------------------------------------------------- beats ---

export type Slot = "hero" | "left-line" | "right-card";
export type BeatSide = "left" | "right" | "center";

type BeatSpec = {
  id: string;
  slot: Slot;
  scene: SceneName;
  /** Offset inside the scene, in vh. */
  atVh: number;
  /** How long the beat holds, in vh. */
  dwellVh: number;
  side: BeatSide;
  kind: "headline" | "card";
  tag?: string;
  title: string;
  lead: string;
  /** Final beat: stays visible to the end of the stage. */
  holdToEnd?: boolean;
  /** Opening beat: reveals on load (progress 0) rather than from scroll. */
  intro?: boolean;
};

// TODO(copy): all text is placeholder.
const BEAT_SPECS: readonly BeatSpec[] = [
  { id: "hero", slot: "hero", scene: "opening", atVh: 2, dwellVh: 56, side: "left", kind: "headline", title: "Great things grow together.", lead: "TODO: hero lead line one. TODO: hero lead line two.", intro: true },
  { id: "plant", slot: "left-line", scene: "watering", atVh: 20, dwellVh: 100, side: "left", kind: "headline", title: "We plant.", lead: "TODO: one line about the seed." },
  { id: "tend", slot: "left-line", scene: "watering", atVh: 150, dwellVh: 100, side: "left", kind: "headline", title: "Every idea needs care.", lead: "TODO: one line about the water." },
  { id: "wait", slot: "left-line", scene: "growth", atVh: 25, dwellVh: 110, side: "left", kind: "headline", title: "We wait.", lead: "TODO: one line about patience." },
  { id: "grow", slot: "left-line", scene: "ripening", atVh: 30, dwellVh: 110, side: "left", kind: "headline", title: "We grow.", lead: "TODO: one line about ripening." },
  { id: "pick", slot: "left-line", scene: "plucking", atVh: 25, dwellVh: 100, side: "left", kind: "headline", title: "We pick.", lead: "TODO: one line about the harvest." },
  { id: "floating-card", slot: "right-card", scene: "floating", atVh: 40, dwellVh: 120, side: "right", kind: "card", tag: "TODO tag", title: "TODO card title", lead: "TODO: a short paragraph that sits in the right column over the art." },
  { id: "inside", slot: "left-line", scene: "split", atVh: 30, dwellVh: 120, side: "left", kind: "headline", title: "There is more inside.", lead: "TODO: one line about what is inside." },
  { id: "brand", slot: "hero", scene: "brand", atVh: 62, dwellVh: 106, side: "center", kind: "headline", title: "Orange.io", lead: "TODO: brand reveal line.", holdToEnd: true },
];

export type BeatDef = BeatSpec & {
  /** Start and end in vh on the whole stage. */
  startVh: number;
  endVh: number;
  /** Progress range in / out. */
  at: number;
  out: number;
};

export const BEATS: readonly BeatDef[] = BEAT_SPECS.map((b) => {
  const startVh = SCENE_START_VH[b.scene] + b.atVh;
  const endVh = startVh + b.dwellVh;
  return {
    ...b,
    startVh,
    endVh,
    at: startVh / STAGE_VH,
    // the closing beat must not fade out at progress 1
    out: b.holdToEnd ? 1.001 : endVh / STAGE_VH,
  };
});

// ---------------------------------------------------------------- travel ---

/** What moves while no text is on screen, per scene, so nothing is dead. */
export const TRAVEL_MOVES: Record<SceneName, readonly string[]> = {
  opening: ["slow camera dolly toward the tree", "halftone clouds drift for parallax", "light warms from apricot"],
  watering: ["water arcs from the can into the soil", "soil darkens", "a sprout rises"],
  growth: ["trunk and canopy grow", "camera dollies up the trunk", "clouds drift behind"],
  ripening: ["blossoms turn to green fruit, then orange", "camera pushes toward one branch"],
  plucking: ["a hand reaches and plucks the fruit", "the fruit flies across the transition"],
  floating: ["the orange floats and rotates", "camera orbits slowly", "dither dissolve into the next scene"],
  split: ["the orange opens into two halves", "halves drift apart", "camera dollies into the interior"],
  brand: ["halves settle on the press-dark panel", "wordmark and mark resolve"],
};

export type TravelStretch = { scene: SceneName; fromVh: number; toVh: number; lengthVh: number; moves: readonly string[] };

/** Beat-free stretches inside each scene (any slot), in stage vh. */
export function travelStretches(beats: readonly BeatDef[] = BEATS): TravelStretch[] {
  const out: TravelStretch[] = [];
  for (const scene of SCENE_NAMES) {
    const s0 = SCENE_START_VH[scene];
    const s1 = s0 + PACING[scene];
    const spans = beats
      .filter((b) => b.scene === scene)
      .map((b) => [b.startVh, Math.min(b.endVh, s1)] as const)
      .sort((a, b) => a[0] - b[0]);
    let cursor = s0;
    for (const [a, b] of spans) {
      if (a > cursor) out.push({ scene, fromVh: cursor, toVh: a, lengthVh: a - cursor, moves: TRAVEL_MOVES[scene] });
      cursor = Math.max(cursor, b);
    }
    if (cursor < s1) out.push({ scene, fromVh: cursor, toVh: s1, lengthVh: s1 - cursor, moves: TRAVEL_MOVES[scene] });
  }
  return out;
}

export const TRAVEL = travelStretches();

// -------------------------------------------------------------- chapters ---

/**
 * `at` is the anchor used by the rail and by lenis.scrollTo. `range` is where
 * the chapter is active; the rail label switches exactly at range[0].
 */
export const CHAPTERS = [
  { id: "seed", label: "Ch. 1 The Seed", name: "The Seed", at: 0.012, range: [0, 0.22] },
  { id: "growth", label: "Ch. 2 The Growth", name: "The Growth", at: 0.22, range: [0.22, 0.56] },
  { id: "harvest", label: "Ch. 3 The Harvest", name: "The Harvest", at: 0.56, range: [0.56, 0.8] },
  { id: "inside", label: "Ch. 4 The Inside", name: "The Inside", at: 0.8, range: [0.8, 1] },
] as const satisfies readonly {
  id: string;
  label: string;
  name: string;
  at: number;
  range: readonly [number, number];
}[];

// ----------------------------------------------------------------- frame ---

/**
 * Hairline frame states. `hero`: lines in the grid with crosses at the
 * intersections. `open`: lines retract outward to the screen edges and the
 * crosses lock into the corners. `closed`: everything exits and hides.
 */
export type FrameState = "hero" | "open" | "closed";

/** Scroll length (vh) of a frame transition. Scrubbed by progress, so it reverses. */
export const FRAME_TRANSITION_VH = 40;

export type FrameSpec = {
  state: FrameState;
  /** Open frame only: pull the vertical lines in to these x positions (percent of width). */
  lock?: { l: number; r: number };
  /** Start of the transition into this state, in stage vh. Defaults to the scene start. */
  fromVh?: number;
};

export const FRAME: Record<SceneName, FrameSpec> = {
  opening: { state: "hero" },
  // the hero frame leaves after the first screen of scrolling
  watering: { state: "open", fromVh: 100 },
  growth: { state: "open" },
  ripening: { state: "open" },
  plucking: { state: "open" },
  floating: { state: "open" },
  // the split scene frames the two halves between the vertical lines
  split: { state: "open", lock: { l: 32, r: 68 } },
  brand: { state: "closed" },
};

/** Registration marks pulse (scale 1 to 1.4 to 1) within this many vh of a beat boundary. */
export const PULSE_VH = 18;
export const PULSE_SCALE = 1.4;

// ------------------------------------------------- transitions, fly, dolly ---

/**
 * Dither dissolve between scenes. The window for the boundary that starts a
 * scene runs from (sceneStart - TRANSITION_VH) to sceneStart, so the new scene
 * is fully resolved exactly when its scene begins. Windows sit inside travel
 * stretches (validated), never over a beat.
 */
export const TRANSITION_VH = 45;

export type Boundary = { index: number; from: SceneName; to: SceneName; atVh: number; startVh: number };

/** Scenes entered by a slow camera dolly instead of a dissolve (the world simply continues). */
export const NO_DISSOLVE: readonly SceneName[] = ["watering"];

/** One boundary per dissolved scene change: watering->growth, growth->ripening, ... */
export const BOUNDARIES: readonly Boundary[] = SCENE_NAMES.slice(1)
  .map((to, i) => ({ to, from: SCENE_NAMES[i] }))
  .filter((b) => !NO_DISSOLVE.includes(b.to))
  .map((b, index) => ({
    index,
    from: b.from,
    to: b.to,
    atVh: SCENE_START_VH[b.to],
    startVh: SCENE_START_VH[b.to] - TRANSITION_VH,
  }));

/** Named positions the fly element (the orange) travels between. x/y are viewport percent. */
export const FLY_ANCHORS = {
  treeFruit: { x: 70, y: 36, scale: 0.55, rotate: 0 },
  hand: { x: 63, y: 52, scale: 0.7, rotate: -24 },
  center: { x: 64, y: 50, scale: 1.3, rotate: 200 },
} as const;
export type FlyAnchor = keyof typeof FLY_ANCHORS;

/**
 * The fly element's path, in stage vh. Between two keys it interpolates
 * position, scale, rotation and opacity. The hand -> center move happens in the
 * plucking -> floating dissolve window so the eye follows it across the cut.
 */
export const FLY_PATH: readonly { vh: number; anchor: FlyAnchor; opacity: number }[] = [
  { vh: 1008, anchor: "treeFruit", opacity: 0 },
  { vh: 1060, anchor: "treeFruit", opacity: 1 },
  { vh: 1420, anchor: "treeFruit", opacity: 1 },
  { vh: 1500, anchor: "hand", opacity: 1 },
  { vh: 1587, anchor: "hand", opacity: 1 },
  { vh: 1632, anchor: "center", opacity: 1 },
  { vh: 1875, anchor: "center", opacity: 1 },
  { vh: 1940, anchor: "center", opacity: 0 },
];

/** Slow push-in over the whole stage; each scene gets an eased segment of it (continuous at boundaries). */
export const DOLLY_PUSH = { z: [10, 7], fov: [40, 34] } as const;

// -------------------------------------------------------------- watering ---

/** Scene 02 milestones, as progress. The rig, the water and the soil all read these. */
export const WATERING = {
  liftAt: 0.08, // both people begin lifting their cans
  tiltAt: 0.12, // both cans tilt
  flowAt: 0.15, // water leaves the spouts
  groundAt: 0.17, // water reaches the ground
  stopAt: 0.2, // the flow gradually stops
  relaxAt: 0.22, // relaxed posture again
} as const;

// ------------------------------------------------------------ validation ---

const EPS = 1e-6;

/** Throws a single Error listing every problem found. */
export function validateScript(beats: readonly BeatDef[] = BEATS): void {
  const problems: string[] = [];

  // ranges tile the stage
  let cursor = 0;
  for (const n of SCENE_NAMES) {
    const [a, b] = SCENES[n];
    if (Math.abs(a - cursor) > EPS) problems.push(`scene ${n} starts at ${a}, expected ${cursor} (ranges must tile 0..1)`);
    if (b <= a) problems.push(`scene ${n} has a non-positive range`);
    cursor = b;
  }
  if (Math.abs(cursor - 1) > EPS) problems.push(`scenes end at ${cursor}, expected 1`);
  const total = SCENE_NAMES.reduce((s, n) => s + PACING[n], 0);
  if (total !== STAGE_VH) problems.push(`pacing sums to ${total}vh, expected STAGE_VH ${STAGE_VH}`);

  // chapters
  CHAPTERS.forEach((c, i) => {
    if (i > 0 && c.range[0] < CHAPTERS[i - 1].range[0]) problems.push(`chapter ${c.id} is out of order`);
    if (c.at < c.range[0] - EPS || c.at > c.range[1]) problems.push(`chapter ${c.id} anchor ${c.at} is outside its range`);
  });

  // beats
  for (const b of beats) {
    const s0 = SCENE_START_VH[b.scene];
    const s1 = s0 + PACING[b.scene];
    if (b.startVh < s0 - EPS || b.endVh > s1 + EPS) problems.push(`beat ${b.id} (${b.startVh}-${b.endVh}vh) leaves scene ${b.scene} (${s0}-${s1}vh)`);
    const dwell = b.endVh - b.startVh;
    if (b.slot === "hero" && b.scene === "opening") {
      if (b.endVh > RULES.heroOutBy) problems.push(`hero beat ends at ${b.endVh}vh, must be out by ${RULES.heroOutBy}vh`);
    } else if (dwell < RULES.dwellMin - EPS || dwell > RULES.dwellMax + EPS) {
      problems.push(`beat ${b.id} dwells ${dwell}vh, must be ${RULES.dwellMin}-${RULES.dwellMax}vh`);
    }
  }

  const slots = new Set(beats.map((b) => b.slot));
  for (const slot of slots) {
    const inSlot = beats.filter((b) => b.slot === slot).sort((a, b) => a.startVh - b.startVh);
    for (let i = 1; i < inSlot.length; i++) {
      const prev = inSlot[i - 1];
      const cur = inSlot[i];
      const gap = cur.startVh - prev.endVh;
      if (gap < 0) problems.push(`beats ${prev.id} and ${cur.id} overlap in slot ${slot}`);
      else if (gap < RULES.gapMin - EPS) problems.push(`gap between ${prev.id} and ${cur.id} is ${gap}vh, minimum ${RULES.gapMin}vh`);
      else if (prev.scene === cur.scene && gap > RULES.gapMax + EPS) problems.push(`gap between ${prev.id} and ${cur.id} is ${gap}vh, maximum ${RULES.gapMax}vh inside a scene`);
    }
  }

  // every scene has a long travel stretch with something moving
  const stretches = travelStretches(beats);
  for (const n of SCENE_NAMES) {
    const longest = Math.max(0, ...stretches.filter((t) => t.scene === n).map((t) => t.lengthVh));
    if (longest < RULES.travelMin - EPS) problems.push(`scene ${n} has no travel stretch of ${RULES.travelMin}vh (longest ${longest}vh)`);
    if (TRAVEL_MOVES[n].length === 0) problems.push(`scene ${n} lists nothing that moves during travel`);
  }

  // transition windows must sit in travel, not over a beat
  for (const t of BOUNDARIES) {
    for (const b of beats) {
      if (b.startVh < t.atVh && b.endVh > t.startVh) problems.push(`beat ${b.id} overlaps the ${t.from} to ${t.to} dissolve (${t.startVh}-${t.atVh}vh)`);
    }
    if (t.startVh < SCENE_START_VH[t.from]) problems.push(`dissolve into ${t.to} starts before scene ${t.from}`);
  }

  // frame
  for (const n of SCENE_NAMES) {
    const f = FRAME[n];
    if (!f) problems.push(`scene ${n} has no frame state`);
    else if (f.fromVh !== undefined && f.fromVh > SCENE_START_VH[n]) problems.push(`frame for ${n} starts after the scene does`);
  }

  if (problems.length) throw new Error(`Invalid scroll script:\n - ${problems.join("\n - ")}`);
}

// Fail fast while developing; production builds skip this (the unit test covers CI).
if (process.env.NODE_ENV === "development") validateScript();
