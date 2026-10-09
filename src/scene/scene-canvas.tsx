"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ShaderMaterial, type Texture } from "three";
import { progress, velocityNorm } from "@/lib/progress";
import { sheen, sheenX, sheenY } from "@/lib/reactions";
import { currentScene } from "@/lib/timeline";
import { DOLLY_PUSH, type SceneName } from "@/scroll/script";
import { DEFAULT_DOLLY, useDollyTrack } from "./dolly";
import { OpeningWorld } from "./world/opening-world";
import { LiveCompositor } from "./live-compositor";
import { WORLD_SCENES } from "./live";
import type { Group, Mesh } from "three";
import { FULLSCREEN_VERT, PLATE_FRAG } from "./glsl";
import { usePlateTextures } from "./plates";
import { createPlateUniforms, usePlateUniformUpdater, type PlateUniforms } from "./plate-uniforms";
import { DPR, useInvalidateOn } from "./webgl";

type PlateMaterial = ShaderMaterial & { uniforms: { uTex: { value: Texture | null } } & PlateUniforms };

/** Per-frame step (plain function so the render-purity lint does not apply). */
function stepPlate(m: PlateMaterial, shown: { scene: SceneName | null }, textures: Record<SceneName, Texture>, p: number, apply: (p: number) => void, quad: Mesh | null, world: Group | null) {
  const scene = currentScene(p);
  const live = WORLD_SCENES.includes(scene);
  if (quad) quad.visible = !live;
  if (world) world.visible = live;
  if (shown.scene !== scene) {
    shown.scene = scene;
    m.uniforms.uTex.value = textures[scene];
  }
  apply(p);
}

function PlateQuad({ world }: { world: React.RefObject<Group | null> }) {
  const quad = useRef<Mesh>(null);
  const textures = usePlateTextures();
  const shown = useRef<{ scene: SceneName | null }>({ scene: null });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: PLATE_FRAG,
        uniforms: { uTex: { value: null as Texture | null }, ...createPlateUniforms() },
        depthTest: false,
        depthWrite: false,
      }) as PlateMaterial,
    [],
  );
  const apply = usePlateUniformUpdater(material.uniforms);
  // velocity and sheen reactions request frames too (they ease back to exactly 0)
  useInvalidateOn(velocityNorm);
  useInvalidateOn(sheen);
  useInvalidateOn(sheenX, () => sheen.get() > 0);
  useInvalidateOn(sheenY, () => sheen.get() > 0);

  useFrame(() => stepPlate(material, shown.current, textures, progress.get(), apply, quad.current, world.current));

  return (
    <mesh ref={quad} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function World() {
  const world = useRef<Group>(null);
  return (
    <>
      <PlateQuad world={world} />
      <OpeningWorld groupRef={world} />
    </>
  );
}

function Rig() {
  useDollyTrack(DEFAULT_DOLLY, undefined, -2); // first: the camera pose is set before anything reads it
  return null;
}

/**
 * The persistent scene canvas. For now it shows the current scene's placeholder
 * plate, dollying with the shared camera track; real scenes replace PlateQuad.
 */
export function SceneCanvas() {
  return (
    <div className="absolute inset-0" data-layer="scene">
      <Canvas
        frameloop="demand"
        dpr={DPR}
        flat
        shadows
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, DOLLY_PUSH.z[0]], fov: DOLLY_PUSH.fov[0], near: 0.1, far: 100 }}
      >
        <Rig />
        <World />
        <LiveCompositor />
      </Canvas>
    </div>
  );
}

