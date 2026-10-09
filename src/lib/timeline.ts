// Single source of truth for scroll ranges (normalized 0-1) and the beat table.
// Scene components must read ranges from here, never hardcode them.

/** Height of the scroll stage in viewport heights. Tune freely. */
export const STAGE_VH = 2400;

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

export const CHAPTERS = [
  { id: "seed", label: "Ch. 1 The Seed", name: "The Seed", range: [0, 0.22] },
  { id: "growth", label: "Ch. 2 The Growth", name: "The Growth", range: [0.22, 0.56] },
  { id: "harvest", label: "Ch. 3 The Harvest", name: "The Harvest", range: [0.56, 0.8] },
  { id: "inside", label: "Ch. 4 The Inside", name: "The Inside", range: [0.8, 1] },
] as const satisfies readonly {
  id: string;
  label: string;
  name: string;
  range: readonly [number, number];
}[];

export type Chapter = (typeof CHAPTERS)[number];

export type BeatSide = "left" | "right" | "center";

export type BeatDef = {
  id: string;
  scene: SceneName;
  /** Progress range in/out. */
  at: number;
  out: number;
  side: BeatSide;
  /** "headline": big line + lead. "card": Tag + title + paragraph (right column). */
  kind: "headline" | "card";
  tag?: string;
  title: string;
  lead: string;
};

// TODO(copy): all text below is placeholder. Gaps between beats are deliberate
// travel stretches (about 25 to 40% of each scene) where the scene does the talking.
export const BEATS: readonly BeatDef[] = [
  { id: "hero", scene: "opening", at: 0.004, out: 0.07, side: "left", kind: "headline", title: "Grown slowly, on purpose.", lead: "TODO: hero lead line one. TODO: hero lead line two." },
  { id: "plant", scene: "watering", at: 0.09, out: 0.14, side: "left", kind: "headline", title: "We plant.", lead: "TODO: one line about the seed." },
  { id: "tend", scene: "watering", at: 0.15, out: 0.2, side: "left", kind: "headline", title: "We tend.", lead: "TODO: one line about the water." },
  { id: "wait", scene: "growth", at: 0.24, out: 0.31, side: "left", kind: "headline", title: "We wait.", lead: "TODO: one line about patience." },
  { id: "grow", scene: "ripening", at: 0.43, out: 0.51, side: "left", kind: "headline", title: "We grow.", lead: "TODO: one line about ripening." },
  { id: "pick", scene: "plucking", at: 0.575, out: 0.65, side: "left", kind: "headline", title: "We pick.", lead: "TODO: one line about the harvest." },
  { id: "floating-card", scene: "floating", at: 0.7, out: 0.77, side: "right", kind: "card", tag: "TODO tag", title: "TODO card title", lead: "TODO: a short paragraph that sits in the right column over the art." },
  { id: "inside", scene: "split", at: 0.815, out: 0.9, side: "left", kind: "headline", title: "There is more inside.", lead: "TODO: one line about what is inside." },
  { id: "brand", scene: "brand", at: 0.945, out: 1.001, side: "center", kind: "headline", title: "Orange.io", lead: "TODO: brand reveal line." },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Local 0-1 progress of `scene` for global progress `p`. */
export function sceneProgress(scene: SceneName, p: number): number {
  const [a, b] = SCENES[scene];
  return clamp01((p - a) / (b - a));
}

/** The scene that owns global progress `p`. */
export function currentScene(p: number): SceneName {
  return SCENE_NAMES.find((n) => p < SCENES[n][1]) ?? SCENE_NAMES[SCENE_NAMES.length - 1];
}

/** Index of the chapter that owns global progress `p`. */
export function chapterIndex(p: number): number {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (p >= CHAPTERS[i].range[0]) return i;
  }
  return 0;
}

export function currentChapter(p: number): Chapter {
  return CHAPTERS[chapterIndex(p)];
}

/** Progress to scrolled viewport heights from the top of the stage. */
export function vh(p: number): number {
  return p * (STAGE_VH - 100);
}

/** Beats visible at progress `p`. */
export function activeBeats(p: number): BeatDef[] {
  return BEATS.filter((b) => p >= b.at && p <= b.out);
}
