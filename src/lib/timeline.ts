// Helpers over the scroll script. All numbers live in src/scroll/script.ts.
import {
  BEATS,
  CHAPTERS,
  SCENES,
  SCENE_NAMES,
  STAGE_VH,
  type SceneName,
} from "@/scroll/script";

export * from "@/scroll/script";
export type Chapter = (typeof CHAPTERS)[number];

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

/** Progress to stage viewport heights (nominal; matches the script's vh). */
export function vh(p: number): number {
  return p * STAGE_VH;
}

/** Beats visible at progress `p`. */
export function activeBeats(p: number) {
  return BEATS.filter((b) => p >= b.at && p <= b.out);
}
