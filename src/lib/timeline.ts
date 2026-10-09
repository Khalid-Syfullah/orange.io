// Single source of truth for scroll ranges (normalized 0-1). Scene components
// must read ranges from here, never hardcode them. Ranges are refined in the
// pacing phase; they are contiguous and cover [0, 1].
export const SCENES = {
  opening: [0, 0.08],
  watering: [0.08, 0.22],
  growing: [0.22, 0.4],
  fruiting: [0.4, 0.55],
  plucking: [0.55, 0.68],
  floating: [0.68, 0.8],
  splitting: [0.8, 0.9],
  reveal: [0.9, 1],
} as const satisfies Record<string, readonly [number, number]>;

export type SceneName = keyof typeof SCENES;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Local 0-1 progress of `scene` for global progress `p`. */
export function sceneProgress(scene: SceneName, p: number): number {
  const [a, b] = SCENES[scene];
  return clamp01((p - a) / (b - a));
}

/** The scene that owns global progress `p`. */
export function activeScene(p: number): SceneName {
  const names = Object.keys(SCENES) as SceneName[];
  return names.find((n) => p < SCENES[n][1]) ?? names[names.length - 1];
}

// Chapters group scenes. Ranges are derived from SCENES so there is one source.
export const CHAPTERS = [
  { id: "seed", label: "Ch. 1 The Seed", range: [SCENES.opening[0], SCENES.watering[1]] },
  { id: "growth", label: "Ch. 2 The Growth", range: [SCENES.growing[0], SCENES.fruiting[1]] },
  { id: "harvest", label: "Ch. 3 The Harvest", range: [SCENES.plucking[0], SCENES.floating[1]] },
  { id: "inside", label: "Ch. 4 The Inside", range: [SCENES.splitting[0], SCENES.reveal[1]] },
] as const satisfies readonly { id: string; label: string; range: readonly [number, number] }[];

/** Index of the chapter that owns global progress `p`. */
export function chapterIndex(p: number): number {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (p >= CHAPTERS[i].range[0]) return i;
  }
  return 0;
}
