import { Color, PerspectiveCamera, type Fog, type Group, type Mesh, type Scene, type Texture } from "three";
import type { SceneGroup } from "./live";
import { STUDIO_FOV } from "@/scroll/studio";

/**
 * What the scene canvas can draw, registered by the components that own it.
 * `showGroup` switches the whole canvas to one group (visibility, background,
 * fog, environment), so the compositor can render any group on demand: for
 * the plain frame, for either side of a dissolve, or into a target.
 */
export const registry = {
  world: null as Group | null,
  studio: null as Group | null,
  quad: null as Mesh | null,
  worldBackground: null as Texture | null,
  worldFog: null as Fog | null,
  studioEnvironment: null as Texture | null,
  studioBackground: new Color("#f7f3ea"),
  /** The product-shot camera. The orchard uses the R3F camera. */
  studioCamera: new PerspectiveCamera(STUDIO_FOV, 1, 0.1, 50),
};

export function showGroup(scene: Scene, g: SceneGroup) {
  const r = registry;
  if (r.world) r.world.visible = g === "world";
  if (r.studio) r.studio.visible = g === "studio";
  if (r.quad) r.quad.visible = g === "plate";
  scene.background = g === "world" ? r.worldBackground : g === "studio" ? r.studioBackground : null;
  scene.fog = g === "world" ? r.worldFog : null;
  scene.environment = g === "studio" ? r.studioEnvironment : null;
}
