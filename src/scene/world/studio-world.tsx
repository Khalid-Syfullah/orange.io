"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, PMREMGenerator, SphereGeometry, SRGBColorSpace, Vector3, type MeshPhysicalMaterial } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { progress } from "@/lib/progress";
import { ripenRgb } from "@/scroll/ripening";
import { ORANGE_RADIUS, studioPose, type StudioPose } from "@/scroll/studio";
import { registry } from "@/scene/registry";
import { peelTexture } from "./peel";
import { mulberry32 } from "./rng";

/**
 * An orange with natural asymmetry: a slightly flattened, lumpy sphere with a
 * navel dimple at each pole, displaced once from smooth low-frequency waves.
 */
function buildOrangeGeometry() {
  const g = new SphereGeometry(1, 128, 96);
  const pos = g.attributes.position;
  const v = new Vector3();
  const rnd = mulberry32(8);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r0 = v.length();
    const theta = Math.atan2(v.z, v.x);
    const phi = Math.acos(Math.min(1, Math.max(-1, v.y / r0))); // 0 at the top pole
    let r = 1;
    r += 0.013 * Math.sin(2 * theta + ph[0]) * Math.sin(phi * 2 + ph[1]);
    r += 0.008 * Math.sin(3 * theta + ph[2]) * Math.sin(phi * 3);
    r += 0.006 * Math.sin(5 * phi + ph[3]);
    r -= 0.07 * Math.exp(-Math.pow(phi / 0.2, 2)); // stem dimple
    r -= 0.035 * Math.exp(-Math.pow((Math.PI - phi) / 0.16, 2)); // navel
    v.multiplyScalar(r / r0);
    v.y *= 0.975; // slightly oblate
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Soft contact shadow under the floating fruit. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(24,24,24,0.8)");
  grad.addColorStop(0.6, "rgba(24,24,24,0.25)");
  grad.addColorStop(1, "rgba(24,24,24,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const pose: StudioPose = { visible: false, y: 0, rotY: 0, rotX: 0, scale: 1, cameraZ: 4.3 };
const rgb: [number, number, number] = [0, 0, 0];
const tint = new Color();

/** Per-frame step: pose the orange and the product-shot camera from scroll. Plain function. */
function stepStudio(orange: Mesh, shadow: Mesh, calyx: Group, aspect: number, p: number) {
  studioPose(p, pose);
  orange.visible = pose.visible;
  shadow.visible = pose.visible;
  calyx.visible = pose.visible;
  orange.position.y = pose.y;
  orange.rotation.set(pose.rotX, pose.rotY, 0);
  orange.scale.setScalar(ORANGE_RADIUS * pose.scale);
  calyx.position.copy(orange.position);
  calyx.rotation.copy(orange.rotation);
  calyx.scale.setScalar(ORANGE_RADIUS * pose.scale);
  // the shadow stays on the floor and breathes with the fruit's height
  const lift = pose.y;
  shadow.scale.setScalar(ORANGE_RADIUS * pose.scale * (1.7 - lift * 3));
  (shadow.material as MeshBasicMaterial).opacity = 0.2 - lift * 1.2;
  ripenRgb(1, rgb);
  (orange.material as MeshPhysicalMaterial).color.copy(tint.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace));

  const cam = registry.studioCamera;
  cam.aspect = aspect;
  cam.position.set(0, 0, pose.cameraZ);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}

/**
 * Scene 06, "The Reveal": a premium product shot. One ripe orange floats in a
 * clean cream studio under a soft key, a subtle rim and gentle ambient light.
 * Rotation, settle and scale are pure functions of scroll progress.
 */
export function StudioWorld({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const orange = useRef<Mesh>(null);
  const shadow = useRef<Mesh>(null);
  const calyx = useRef<Group>(null);
  const geometry = useMemo(() => buildOrangeGeometry(), []);
  const peel = useMemo(() => peelTexture([3, 2]), []);
  const shade = useMemo(() => shadowTexture(), []);
  useEffect(() => () => void (geometry.dispose(), peel.dispose(), shade.dispose()), [geometry, peel, shade]);

  // an offline "room" environment gives the peel believable highlights without any network fetch
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const rt = pmrem.fromScene(env, 0.04);
    registry.studioEnvironment = rt.texture;
    return () => {
      registry.studioEnvironment = null;
      rt.dispose();
      pmrem.dispose();
      env.dispose();
    };
  }, [gl]);

  useFrame(() => {
    if (orange.current && shadow.current && calyx.current) stepStudio(orange.current, shadow.current, calyx.current, size.width / size.height, progress.get());
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* soft key from the upper left, a subtle warm rim from behind, gentle ambient fill */}
      <hemisphereLight args={["#fff7ea", "#efe3cf", 0.45]} />
      <directionalLight position={[-2.5, 3, 4]} color="#fff3e0" intensity={1.5} />
      <directionalLight position={[3, 1.5, -3]} color="#ffd9a8" intensity={1.1} />
      <mesh ref={orange} geometry={geometry} visible={false}>
        <meshPhysicalMaterial map={peel} bumpMap={peel} bumpScale={2.4} roughness={0.5} clearcoat={0.3} clearcoatRoughness={0.45} envMapIntensity={0.45} />
      </mesh>
      {/* calyx button and stem nub at the top, so the rotation reads */}
      <group ref={calyx} visible={false}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.05, 12]} />
          <meshStandardMaterial color="#476b35" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.96, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.09, 8]} />
          <meshStandardMaterial color="#5c4a30" roughness={0.9} />
        </mesh>
      </group>
      <mesh ref={shadow} position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={shade} transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
}
