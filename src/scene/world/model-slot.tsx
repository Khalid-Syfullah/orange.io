"use client";

import { Gltf } from "@react-three/drei";
import { models, type ModelName } from "@/scene/models";

/** Renders the GLB for a slot when one is configured, otherwise the procedural children. */
export function ModelSlot({ name, children }: { name: ModelName; children: React.ReactNode }) {
  const url = models[name].url;
  return url ? <Gltf src={url} castShadow receiveShadow /> : <>{children}</>;
}
