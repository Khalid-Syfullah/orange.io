"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, Color, Fog, InstancedMesh, Object3D, SRGBColorSpace } from "three";
import { registry } from "@/scene/registry";
import { useRef } from "react";
import { mulberry32 } from "./rng";

const CREAM = "#f7f3ea";
const APRICOT = "#ffd9a8";

/** Registers the sky and fog with the scene registry (the compositor installs them when the world is drawn). */
function registerBackdrop(tex: CanvasTexture) {
  registry.worldBackground = tex;
  registry.worldFog = new Fog(new Color(CREAM), 13, 30);
  return () => {
    registry.worldBackground = null;
    registry.worldFog = null;
    tex.dispose();
  };
}

/** Sky + fog: warm apricot at the top easing into a clean cream horizon at eye level. */
export function Sky() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#ffd0a0");
    grad.addColorStop(0.28, APRICOT);
    grad.addColorStop(0.5, CREAM);
    grad.addColorStop(1, CREAM);
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 512);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => registerBackdrop(tex), [tex]);
  return null;
}

/** Golden-hour light: warm low sun with soft shadows, apricot sky and clay ground bounce. */
export function Lights() {
  return (
    <>
      <hemisphereLight args={["#ffe6c4", "#d8ccb0", 1.25]} />
      <directionalLight
        position={[-6, 3.6, 5]}
        color="#ffcf94"
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
    </>
  );
}

const dummy = new Object3D();

/** Natural ground with soft grass clumps gathered around the clearing. */
export function Ground() {
  const grass = useRef<InstancedMesh>(null);
  const COUNT = 1400;
  useEffect(() => {
    const m = grass.current;
    if (!m) return;
    const rnd = mulberry32(5);
    const c = new Color();
    const palette = ["#5c8040", "#6a9048", "#7ba055", "#8fb068"];
    for (let i = 0; i < COUNT; i++) {
      // denser near the middle, thinning out toward the edges of the clearing
      const r = Math.pow(rnd(), 0.7) * 5.2;
      const a = rnd() * Math.PI * 2;
      dummy.position.set(Math.cos(a) * r * 1.2, 0, Math.sin(a) * r * 0.8);
      dummy.rotation.set((rnd() - 0.5) * 0.4, rnd() * Math.PI, (rnd() - 0.5) * 0.4);
      const s = 0.6 + rnd() * 0.9;
      dummy.scale.set(1, s, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, c.set(palette[i % palette.length]));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#e3dfbc" roughness={1} />
      </mesh>
      <instancedMesh ref={grass} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <coneGeometry args={[0.012, 0.2, 3]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

/** Soft contact shadow under an object: a radial-falloff decal on the ground. */
export function ContactShadow({ position, radius, opacity = 0.35 }: { position: [number, number, number]; radius: number; opacity?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(24,24,24,1)");
    grad.addColorStop(0.5, "rgba(24,24,24,0.45)");
    grad.addColorStop(1, "rgba(24,24,24,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[position[0], position[1] + 0.004, position[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
