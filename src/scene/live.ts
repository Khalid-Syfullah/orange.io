import type { Boundary, SceneName } from "@/scroll/script";

/** Scenes drawn by the live 3D world. Later scenes still show placeholder plates. */
export const WORLD_SCENES: readonly SceneName[] = ["opening", "watering", "growth", "ripening", "plucking"];

/**
 * A dissolve out of a live scene is composited inside the scene canvas, because
 * its "from" frame is the 3D world (rendered to a target there). Plate-to-plate
 * dissolves stay in the separate transition canvas.
 */
export function isLiveDissolve(b: Boundary): boolean {
  return WORLD_SCENES.includes(b.from);
}
