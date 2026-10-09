"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DepthTexture,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Texture,
  type WebGLRenderer,
} from "three";
import { progress } from "@/lib/progress";
import { STAGE_VH } from "@/lib/timeline";
import { dofStrength } from "@/scroll/ripening";
import type { SceneName } from "@/scroll/script";
import { DITHER_FRAG, DOF_FRAG, FULLSCREEN_VERT } from "./glsl";
import { isLiveDissolve, WORLD_SCENES } from "./live";
import { createPlateUniforms, usePlateUniformUpdater, type PlateUniforms } from "./plate-uniforms";
import { activeBoundary, transitionMix } from "./transition";
import { usePlateTextures } from "./plates";
import { focusTarget } from "./world/opening-world";
import { currentScene } from "@/lib/timeline";

type DitherMaterial = ShaderMaterial & {
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
type DofMaterial = ShaderMaterial & {
  uniforms: {
    uColor: { value: Texture | null };
    uDepth: { value: Texture | null };
    uNear: { value: number };
    uFar: { value: number };
    uFocus: { value: number };
    uDead: { value: number };
    uRange: { value: number };
    uStrength: { value: number };
    uRadius: { value: number };
    uTexel: { value: Vector2 };
  };
};

type Comp = {
  rtScene: WebGLRenderTarget | null; // world colour + depth
  rtDof: WebGLRenderTarget | null; // world after depth of field (used when dissolving)
  dither: { scene: Scene; camera: OrthographicCamera; material: DitherMaterial };
  dof: { scene: Scene; material: DofMaterial };
  size: Vector2;
};

const buf = new Vector2();
const fwd = new Vector3();
const toFocus = new Vector3();

function quadScene(material: ShaderMaterial) {
  const scene = new Scene();
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  return scene;
}

/** (Re)creates the render targets when the drawing buffer changes size. */
function ensureTargets(comp: Comp, w: number, h: number) {
  if (comp.rtScene && comp.size.x === w && comp.size.y === h) return;
  comp.rtScene?.dispose();
  comp.rtDof?.dispose();
  comp.rtScene = new WebGLRenderTarget(w, h, { depthTexture: new DepthTexture(w, h) });
  comp.rtDof = new WebGLRenderTarget(w, h);
  comp.size.set(w, h);
}

/**
 * Renders one frame. Plain rendering when nothing special is going on. When
 * depth of field is active, or a live scene is dissolving into the next one,
 * the world is rendered into a target first, then softened (DOF) and/or dithered
 * into the next frame. Plain function: GL state is mutated by design.
 */
function renderFrame(gl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, comp: Comp, textures: Record<SceneName, Texture>, p: number, apply: (p: number) => void) {
  const vh = p * STAGE_VH;
  const b = activeBoundary(vh);
  const live = !!b && isLiveDissolve(b);
  const dof = WORLD_SCENES.includes(currentScene(p)) ? dofStrength(p) : 0;
  if (!live && dof <= 0) {
    gl.render(scene, camera);
    return;
  }
  gl.getDrawingBufferSize(buf);
  ensureTargets(comp, buf.x, buf.y);
  const rtScene = comp.rtScene!;
  const rtDof = comp.rtDof!;
  gl.setRenderTarget(rtScene);
  gl.render(scene, camera);

  let a: Texture = rtScene.texture;
  if (dof > 0) {
    camera.getWorldDirection(fwd);
    toFocus.set(focusTarget.x, focusTarget.y, focusTarget.z).sub(camera.position);
    const u = comp.dof.material.uniforms;
    u.uColor.value = rtScene.texture;
    u.uDepth.value = rtScene.depthTexture;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uFocus.value = toFocus.dot(fwd); // distance of the selected fruit along the view axis
    u.uStrength.value = dof;
    u.uRadius.value = 6 * gl.getPixelRatio();
    u.uTexel.value.set(1 / buf.x, 1 / buf.y);
    gl.setRenderTarget(live ? rtDof : null);
    gl.render(comp.dof.scene, comp.dither.camera);
    a = rtDof.texture;
  }
  if (!live) {
    gl.setRenderTarget(null);
    if (dof <= 0) gl.render(comp.dither.scene, comp.dither.camera); // not reached: plain path above
    return;
  }
  gl.setRenderTarget(null);
  const d = comp.dither.material.uniforms;
  d.uTexA.value = a;
  d.uAScreen.value = 1;
  d.uTexB.value = textures[b!.to];
  d.uBScreen.value = 0;
  d.uMix.value = transitionMix(vh, b!);
  d.uPixelSize.value = 3 * gl.getPixelRatio();
  apply(p);
  gl.render(comp.dither.scene, comp.dither.camera);
}

/**
 * Takes over rendering for the scene canvas (priority 1) so the live world can
 * be softened by depth of field and dissolve into the next scene on one canvas.
 */
export function LiveCompositor() {
  const textures = usePlateTextures();
  const comp = useMemo<Comp>(() => {
    const ditherMat = new ShaderMaterial({
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
    }) as DitherMaterial;
    const dofMat = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: DOF_FRAG,
      uniforms: {
        uColor: { value: null as Texture | null },
        uDepth: { value: null as Texture | null },
        uNear: { value: 0.1 },
        uFar: { value: 100 },
        uFocus: { value: 2 },
        uDead: { value: 0.18 },
        uRange: { value: 0.9 },
        uStrength: { value: 0 },
        uRadius: { value: 6 },
        uTexel: { value: new Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
    }) as DofMaterial;
    return {
      rtScene: null,
      rtDof: null,
      dither: { scene: quadScene(ditherMat), camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1), material: ditherMat },
      dof: { scene: quadScene(dofMat), material: dofMat },
      size: new Vector2(0, 0),
    };
  }, []);
  useEffect(
    () => () => {
      comp.rtScene?.dispose();
      comp.rtDof?.dispose();
      comp.dither.material.dispose();
      comp.dof.material.dispose();
    },
    [comp],
  );
  const apply = usePlateUniformUpdater(comp.dither.material.uniforms);

  useFrame((state) => renderFrame(state.gl, state.scene, state.camera as PerspectiveCamera, comp, textures, progress.get(), apply), 1);
  return null;
}
