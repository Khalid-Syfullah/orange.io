"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useTransform } from "motion/react";
import { useMemo } from "react";
import { ShaderMaterial, type Texture } from "three";
import { progress } from "@/lib/progress";
import { STAGE_VH } from "@/lib/timeline";
import type { SceneName } from "@/scroll/script";
import { DITHER_FRAG, FULLSCREEN_VERT } from "./glsl";
import { usePlateTextures } from "./plates";
import { createPlateUniforms, usePlateUniformUpdater, type PlateUniforms } from "./plate-uniforms";
import { activeBoundary, transitionMix } from "./transition";
import { DPR, useInvalidateOn } from "./webgl";

/** Dither cell size in CSS pixels (1 to 4). */
const PIXEL_SIZE_CSS = 3;

type DissolveMaterial = ShaderMaterial & {
  uniforms: { uTexA: { value: Texture | null }; uTexB: { value: Texture | null }; uMix: { value: number }; uPixelSize: { value: number } } & PlateUniforms;
};

/** Per-frame step; returns early (does no work) while no dissolve window is running. */
function stepDissolve(m: DissolveMaterial, textures: Record<SceneName, Texture>, p: number, dpr: number, apply: (p: number) => void) {
  const vh = p * STAGE_VH;
  const b = activeBoundary(vh);
  if (!b) return;
  const u = m.uniforms;
  u.uTexA.value = textures[b.from];
  u.uTexB.value = textures[b.to];
  u.uMix.value = transitionMix(vh, b);
  u.uPixelSize.value = PIXEL_SIZE_CSS * dpr;
  apply(p);
}

function Dissolve({ direction }: { direction: 1 | -1 }) {
  const textures = usePlateTextures();
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: DITHER_FRAG,
        uniforms: {
          uTexA: { value: null as Texture | null },
          uTexB: { value: null as Texture | null },
          uMix: { value: 0 },
          uDirection: { value: direction },
          uPixelSize: { value: PIXEL_SIZE_CSS },
          ...createPlateUniforms(),
        },
        depthTest: false,
        depthWrite: false,
      }) as DissolveMaterial,
    [direction],
  );
  const apply = usePlateUniformUpdater(material.uniforms);
  useInvalidateOn(progress);

  useFrame((state) => stepDissolve(material, textures, progress.get(), state.viewport.dpr, apply));

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Full-viewport dither dissolve between scene frames. Visible only while a
 * boundary's dissolve window is running (`visible`), and renders on demand.
 * Textures are the placeholder plates; real scenes will pass render targets.
 */
export function SceneTransition({ direction = 1 }: { direction?: 1 | -1 }) {
  const visible = useTransform(progress, (p) => (activeBoundary(p * STAGE_VH) ? "visible" : "hidden"));
  return (
    <motion.div className="pointer-events-none absolute inset-0" data-layer="transition" style={{ visibility: visible }} aria-hidden="true">
      <Canvas frameloop="demand" dpr={DPR} flat gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}>
        <Dissolve direction={direction} />
      </Canvas>
    </motion.div>
  );
}
