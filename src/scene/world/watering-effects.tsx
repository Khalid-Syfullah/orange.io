"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Color, InstancedMesh, Object3D, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { progress } from "@/lib/progress";
import { CYCLES, dropletU, dropletVisible, landingScale, trajectory, wetness } from "@/scroll/watering";

/** Droplets per stream. Two streams, one instanced mesh, one draw call. */
const N = 44;
const STREAMS = 2;
const R = 0.013;

/** Where each stream lands, in the world group's space (the tree is at the origin). */
const TARGETS = [
  { x: -0.34, z: 0.06 },
  { x: 0.34, z: -0.06 },
] as const;

const WATER = "#dff0f4";
const dummy = new Object3D();
const tmp = new Vector3();
const origin = { x: 0, y: 0, z: 0 };
const pt = { x: 0, y: 0, z: 0 };

export type WaterRefs = { roses: (Object3D | null)[]; group: Group | null };

/**
 * Per-frame step. Every droplet position is a pure function of scroll progress
 * (a parabola from the spout to the tree base), so scrolling backward replays the
 * stream in reverse. No simulation state exists.
 */
function stepWater(mesh: InstancedMesh, rings: (Mesh | null)[], refs: WaterRefs, p: number) {
  let any = false;
  for (let s = 0; s < STREAMS; s++) {
    const rose = refs.roses[s];
    const base = s * N;
    if (!rose || !refs.group) {
      for (let i = 0; i < N; i++) hide(mesh, base + i);
      continue;
    }
    rose.updateWorldMatrix(true, false);
    rose.getWorldPosition(tmp);
    refs.group.worldToLocal(tmp);
    origin.x = tmp.x;
    origin.y = tmp.y;
    origin.z = tmp.z;
    for (let i = 0; i < N; i++) {
      const u = dropletU(i, N, p);
      if (!dropletVisible(u, p)) {
        hide(mesh, base + i);
        continue;
      }
      any = true;
      trajectory(u, origin, TARGETS[s], 0.01, pt);
      const sc = landingScale(u) * (0.7 + 0.5 * ((i * 7) % 5) / 4);
      dummy.position.set(pt.x, pt.y, pt.z);
      // streched along the fall near the spout, rounder as it breaks into drops
      dummy.scale.set(R * sc, R * sc * (1 + (1 - u) * 2.2), R * sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(base + i, dummy.matrix);
    }
    // splash ring where the stream lands: grows and fades, driven by scroll
    const ring = rings[s];
    if (ring) {
      const live = dropletVisible(0.97, p);
      ring.visible = live;
      if (live) {
        const ph = (p * CYCLES * 0.5) % 1;
        ring.scale.setScalar(0.05 + ph * 0.16);
        (ring.material as MeshBasicMaterial).opacity = (1 - ph) * 0.5;
      }
    }
  }
  mesh.visible = any;
  mesh.instanceMatrix.needsUpdate = true;
}

function hide(mesh: InstancedMesh, i: number) {
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

/** Water streams from both spouts plus splash rings. Driven by progress only. */
export function WaterStreams({ refs }: { refs: WaterRefs }) {
  const mesh = useRef<InstancedMesh>(null);
  const rings = useRef<(Mesh | null)[]>([null, null]);
  useFrame(() => {
    if (mesh.current) stepWater(mesh.current, rings.current, refs, progress.get());
  });
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, N * STREAMS]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color={WATER} roughness={0.15} transparent opacity={0.82} emissive={new Color(WATER)} emissiveIntensity={0.25} />
      </instancedMesh>
      {TARGETS.map((t, s) => (
        <mesh key={s} ref={(m) => void (rings.current[s] = m)} position={[t.x, 0.012, t.z]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.8, 1, 24]} />
          <meshBasicMaterial color={WATER} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Applies wetness to the soil decal. Plain function. */
function stepWet(mesh: Mesh, p: number) {
  const w = wetness(p);
  mesh.visible = w > 0;
  mesh.scale.set(0.5 + 1.3 * w, 0.5 + 1.3 * w, 1);
  (mesh.material as MeshBasicMaterial).opacity = 0.4 * w;
}

/** The soil darkens as it absorbs water; it stays dark afterwards. */
export function WetSoil() {
  const mesh = useRef<Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(107,82,56,1)");
    grad.addColorStop(0.55, "rgba(107,82,56,0.7)");
    grad.addColorStop(1, "rgba(107,82,56,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(() => {
    if (mesh.current) stepWet(mesh.current, progress.get());
  });
  return (
    <mesh ref={mesh} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0} visible={false}>
      <planeGeometry args={[3.6, 2.4]} />
      <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
