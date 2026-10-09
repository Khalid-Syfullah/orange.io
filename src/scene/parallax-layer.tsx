"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, InstancedBufferAttribute, PlaneGeometry, ShaderMaterial } from "three";
import { progress, velocity } from "@/lib/progress";
import { CLOUD_FRAG, CLOUD_VERT } from "./glsl";
import { DPR, useInvalidateOn } from "./webgl";

const COUNT = 22;
/** Halftone dot pitch in CSS pixels. */
const DOT_CSS = 7;

// deterministic PRNG so the layout is stable between renders
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type CloudMaterial = ShaderMaterial & {
  uniforms: { uProgress: { value: number }; uVel: { value: number }; uAspect: { value: number }; uDot: { value: number } };
};

/** Per-frame step. Returns true while the smoothed velocity is still settling. */
function stepClouds(m: CloudMaterial, smooth: { v: number }, dt: number, p: number, vel: number, aspect: number, dpr: number): boolean {
  const u = m.uniforms;
  // velocity is smoothed so clouds ease back to rest
  const target = Math.max(-1, Math.min(1, vel / 40));
  smooth.v += (target - smooth.v) * Math.min(1, dt * 8);
  u.uProgress.value = p;
  u.uVel.value = smooth.v;
  u.uAspect.value = aspect;
  u.uDot.value = DOT_CSS * dpr;
  return Math.abs(smooth.v) > 0.002 || Math.abs(target) > 0.002;
}

function Clouds() {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    const rnd = mulberry32(7);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      const depth = 0.25 + rnd() * 0.75;
      seeds[i * 4] = rnd() * 3.2 - 1.6; // x0
      seeds[i * 4 + 1] = rnd() * 1.8 - 0.9; // y0
      seeds[i * 4 + 2] = 0.35 + depth * 0.5; // size (NDC height units)
      seeds[i * 4 + 3] = depth;
    }
    g.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 4));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        uniforms: {
          uProgress: { value: 0 },
          uVel: { value: 0 },
          uAspect: { value: 1 },
          uColor: { value: new Color("#181818") },
          uDot: { value: DOT_CSS },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }) as CloudMaterial,
    [],
  );
  const smooth = useRef({ v: 0 });
  useInvalidateOn(progress);

  useFrame((state, dt) => {
    const busy = stepClouds(material, smooth.current, dt, progress.get(), velocity.get(), size.width / size.height, state.viewport.dpr);
    if (busy) invalidate(); // keep rendering until the velocity settles
  });

  return (
    <instancedMesh args={[geometry, material, COUNT]} frustumCulled={false} />
  );
}

/**
 * Halftone-dot clouds at different depths. Scroll progress sets position
 * (deeper layers move faster), scroll velocity adds drift and stretch. One
 * instanced mesh, one draw call, renders on demand.
 */
export function ParallaxLayer() {
  return (
    <div className="pointer-events-none absolute inset-0" data-layer="parallax" aria-hidden="true">
      <Canvas frameloop="demand" dpr={DPR} flat gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}>
        <Clouds />
      </Canvas>
    </div>
  );
}
