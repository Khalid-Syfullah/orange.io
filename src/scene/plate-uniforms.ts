"use client";

import { useThree } from "@react-three/fiber";
import { Vector2, Vector3 } from "three";
import { DOLLY_PUSH } from "@/scroll/script";
import { velocityNorm } from "@/lib/progress";
import { REACTIONS, sheen, sheenX, sheenY } from "@/lib/reactions";
import { dollyAt, zoomOf } from "./dolly";
import { PLATE_ASPECT } from "./plates";

export type PlateUniforms = {
  uZoom: { value: number };
  uPan: { value: Vector2 };
  uCover: { value: Vector2 };
  uSmear: { value: number };
  uSheen: { value: Vector3 };
  uAspect: { value: number };
};

export const createPlateUniforms = (): PlateUniforms => ({
  uZoom: { value: 1 },
  uPan: { value: new Vector2(0, 0) },
  uCover: { value: new Vector2(1, 1) },
  uSmear: { value: 0 },
  uSheen: { value: new Vector3(0.5, 0.5, 0) },
  uAspect: { value: 1 },
});

/** Writes the dolly camera at progress `p` into the plate uniforms. Plain function: no allocation. */
export function writePlateUniforms(u: PlateUniforms, width: number, height: number, p: number) {
  const pose = dollyAt(p);
  const vel = Math.abs(velocityNorm.get());
  // a 1 to 3% scale breath on the subject, exactly 1 at rest
  u.uZoom.value = zoomOf(pose) * (1 + REACTIONS.breath * vel);
  u.uSmear.value = REACTIONS.smear * vel;
  u.uSheen.value.set(sheenX.get(), sheenY.get(), sheen.get());
  const aspect = width / height;
  u.uAspect.value = aspect;
  const baseH = Math.tan((DOLLY_PUSH.fov[0] * Math.PI) / 360) * DOLLY_PUSH.z[0] * 2;
  u.uPan.value.set(pose.pos[0] / (baseH * aspect), pose.pos[1] / baseH);
  if (aspect > PLATE_ASPECT) u.uCover.value.set(1, PLATE_ASPECT / aspect);
  else u.uCover.value.set(aspect / PLATE_ASPECT, 1);
}

/**
 * Returns a function that updates the plate uniforms for the current canvas
 * size. The scene canvas and the transition canvas both use it, so the dissolve
 * begins and ends on exactly the pixels the scene canvas shows.
 */
export function usePlateUniformUpdater(u: PlateUniforms) {
  const size = useThree((s) => s.size);
  return (p: number) => writePlateUniforms(u, size.width, size.height, p);
}
