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
  Color,
  Vector3,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Texture,
  type WebGLRenderer,
} from "three";
import { progress } from "@/lib/progress";
import { STAGE_VH } from "@/lib/timeline";
import { dofStrength } from "@/scroll/ripening";
import { studioMix } from "@/scroll/pluck";
import type { SceneName } from "@/scroll/script";
import { DITHER_FRAG, DOF_FRAG, FULLSCREEN_VERT } from "./glsl";
import { groupOf, isLiveDissolve } from "./live";
import { registry, showGroup } from "./registry";
import { createPlateUniforms, usePlateUniformUpdater, type PlateUniforms } from "./plate-uniforms";
import { activeBoundary, transitionMix } from "./transition";
import { usePlateTextures } from "./plates";
import { WORLD_OFFSET } from "./world/opening-world";
import { heroLive } from "./world/growing-tree";
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
    uStudio: { value: number };
    uCream: { value: Color };
  };
};

type Comp = {
  rtScene: WebGLRenderTarget | null; // world colour + depth
  rtDof: WebGLRenderTarget | null; // world after depth of field (used when dissolving)
  rtB: WebGLRenderTarget | null; // the incoming live scene during a dissolve
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
  comp.rtB?.dispose();
  comp.rtScene = new WebGLRenderTarget(w, h, { depthTexture: new DepthTexture(w, h) });
  comp.rtDof = new WebGLRenderTarget(w, h);
  comp.rtB = new WebGLRenderTarget(w, h);
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
  const cur = groupOf(currentScene(p));
  const camFor = (g: ReturnType<typeof groupOf>) => (g === "studio" ? registry.studioCamera : camera);
  const dof = cur === "world" ? dofStrength(p) : 0;
  if (!live && dof <= 0) {
    showGroup(scene, cur);
    gl.render(scene, camFor(cur));
    return;
  }
  gl.getDrawingBufferSize(buf);
  ensureTargets(comp, buf.x, buf.y);
  const rtScene = comp.rtScene!;
  const rtDof = comp.rtDof!;
  const rtB = comp.rtB!;

  // frame A: the current live scene (the world, softened by depth of field when it is active)
  showGroup(scene, cur);
  gl.setRenderTarget(rtScene);
  gl.render(scene, camFor(cur));
  let a: Texture = rtScene.texture;
  if (dof > 0) {
    camera.getWorldDirection(fwd);
    // the focus plane follows the held fruit
    toFocus.set(heroLive.x + WORLD_OFFSET[0], heroLive.y + WORLD_OFFSET[1], heroLive.z + WORLD_OFFSET[2]).sub(camera.position);
    const u = comp.dof.material.uniforms;
    u.uColor.value = rtScene.texture;
    u.uDepth.value = rtScene.depthTexture;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uFocus.value = toFocus.dot(fwd); // distance of the selected fruit along the view axis
    u.uStrength.value = dof;
    const studio = studioMix(p);
    u.uStudio.value = studio;
    u.uRadius.value = (6 + 4 * studio) * gl.getPixelRatio();
    u.uTexel.value.set(1 / buf.x, 1 / buf.y);
    gl.setRenderTarget(live ? rtDof : null);
    gl.render(comp.dof.scene, comp.dither.camera);
    a = rtDof.texture;
  }
  if (!live) {
    gl.setRenderTarget(null);
    return;
  }

  // frame B: the next scene, live (rendered with its own camera) or a placeholder plate
  const toGroup = groupOf(b!.to);
  let bTex: Texture = textures[b!.to];
  if (toGroup !== "plate") {
    showGroup(scene, toGroup);
    gl.setRenderTarget(rtB);
    gl.render(scene, camFor(toGroup));
    bTex = rtB.texture;
  }
  gl.setRenderTarget(null);
  const d = comp.dither.material.uniforms;
  d.uTexA.value = a;
  d.uAScreen.value = 1;
  d.uTexB.value = bTex;
  d.uBScreen.value = toGroup !== "plate" ? 1 : 0;
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
        uStudio: { value: 0 },
        uCream: { value: new Color("#f7f3ea") },
      },
      depthTest: false,
      depthWrite: false,
    }) as DofMaterial;
    return {
      rtScene: null,
      rtDof: null,
      rtB: null,
      dither: { scene: quadScene(ditherMat), camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1), material: ditherMat },
      dof: { scene: quadScene(dofMat), material: dofMat },
      size: new Vector2(0, 0),
    };
  }, []);
  useEffect(
    () => () => {
      comp.rtScene?.dispose();
      comp.rtDof?.dispose();
      comp.rtB?.dispose();
      comp.dither.material.dispose();
      comp.dof.material.dispose();
    },
    [comp],
  );
  const apply = usePlateUniformUpdater(comp.dither.material.uniforms);

  useFrame((state) => renderFrame(state.gl, state.scene, state.camera as PerspectiveCamera, comp, textures, progress.get(), apply), 1);
  return null;
}
