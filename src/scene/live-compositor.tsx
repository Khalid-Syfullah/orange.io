"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from "three";
import { progress } from "@/lib/progress";
import { STAGE_VH } from "@/lib/timeline";
import type { SceneName } from "@/scroll/script";
import { DITHER_FRAG, FULLSCREEN_VERT } from "./glsl";
import { isLiveDissolve } from "./live";
import { createPlateUniforms, usePlateUniformUpdater, type PlateUniforms } from "./plate-uniforms";
import { activeBoundary, transitionMix } from "./transition";
import { usePlateTextures } from "./plates";

type CompMaterial = ShaderMaterial & {
  uniforms: {
    uTexA: { value: Texture | null };
    uTexB: { value: Texture | null };
    uMix: { value: number };
    uDirection: { value: number };
    uPixelSize: { value: number };
    uAScreen: { value: number };
    uBScreen: { value: number };
  } & PlateUniforms;
};

type Comp = { rt: WebGLRenderTarget; scene: Scene; camera: OrthographicCamera; material: CompMaterial };
const buf = new Vector2();

/**
 * Renders one frame. Normally that is just the scene. During a dissolve out of
 * a live scene it renders the world into a target (frame A), then composites A
 * and the next scene's plate (frame B) through the ordered-dither shader on
 * screen. Plain function: GL state is mutated by design.
 */
function renderFrame(gl: WebGLRenderer, scene: Scene, camera: Parameters<WebGLRenderer["render"]>[1], comp: Comp, textures: Record<SceneName, Texture>, p: number, apply: (p: number) => void) {
  const vh = p * STAGE_VH;
  const b = activeBoundary(vh);
  if (!b || !isLiveDissolve(b)) {
    gl.render(scene, camera);
    return;
  }
  gl.getDrawingBufferSize(buf);
  if (comp.rt.width !== buf.x || comp.rt.height !== buf.y) comp.rt.setSize(buf.x, buf.y);
  gl.setRenderTarget(comp.rt);
  gl.render(scene, camera);
  gl.setRenderTarget(null);

  const u = comp.material.uniforms;
  u.uTexA.value = comp.rt.texture;
  u.uAScreen.value = 1;
  u.uTexB.value = textures[b.to];
  u.uBScreen.value = 0;
  u.uMix.value = transitionMix(vh, b);
  u.uPixelSize.value = 3 * gl.getPixelRatio();
  apply(p);
  gl.render(comp.scene, comp.camera);
}

/**
 * Takes over rendering for the scene canvas (priority 1) so a live scene can
 * dissolve into the next one on the same canvas: no mismatch at the cut.
 */
export function LiveCompositor() {
  const textures = usePlateTextures();
  const comp = useMemo<Comp>(() => {
    const material = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: DITHER_FRAG,
      uniforms: {
        uTexA: { value: null as Texture | null },
        uTexB: { value: null as Texture | null },
        uMix: { value: 0 },
        uDirection: { value: 1 },
        uPixelSize: { value: 3 },
        uAScreen: { value: 1 },
        uBScreen: { value: 0 },
        ...createPlateUniforms(),
      },
      depthTest: false,
      depthWrite: false,
    }) as CompMaterial;
    const scene = new Scene();
    const quad = new Mesh(new PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    scene.add(quad);
    return { rt: new WebGLRenderTarget(1, 1), scene, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1), material };
  }, []);
  useEffect(() => () => {
    comp.rt.dispose();
    comp.material.dispose();
  }, [comp]);
  const apply = usePlateUniformUpdater(comp.material.uniforms);

  useFrame((state) => renderFrame(state.gl, state.scene, state.camera, comp, textures, progress.get(), apply), 1);
  return null;
}
