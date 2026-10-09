import type { Boundary, SceneName } from "@/scroll/script";

/** Which live 3D group draws each scene. Scenes with no group still show placeholder plates. */
export type SceneGroup = "world" | "studio" | "plate";

export const SCENE_GROUP: Record<SceneName, SceneGroup> = {
  opening: "world",
  watering: "world",
  growth: "world",
  ripening: "world",
  plucking: "world",
  floating: "studio",
  split: "studio",
  brand: "studio",
};

export const groupOf = (s: SceneName): SceneGroup => SCENE_GROUP[s];

/** Scenes drawn by the orchard world (kept for callers that only care about the world). */
export const WORLD_SCENES: readonly SceneName[] = (Object.keys(SCENE_GROUP) as SceneName[]).filter((s) => SCENE_GROUP[s] === "world");

/**
 * A dissolve out of a live scene is composited inside the scene canvas, because
 * its "from" frame is a 3D group rendered there. Plate-to-plate dissolves stay
 * in the separate transition canvas.
 */
export function isLiveDissolve(b: Boundary): boolean {
  return SCENE_GROUP[b.from] !== "plate";
}
