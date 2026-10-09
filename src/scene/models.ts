// Model slots. Everything is procedural today. To use real files, set a `url`
// (a GLB in /public/models) and the slot renders it with drei's <Gltf> instead.
export const models = {
  tree: { url: null as string | null },
  man: { url: null as string | null },
  woman: { url: null as string | null },
  wateringCan: { url: null as string | null },
} as const;

export type ModelName = keyof typeof models;
