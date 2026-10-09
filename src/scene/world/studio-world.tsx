"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PMREMGenerator, SRGBColorSpace } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { progress } from "@/lib/progress";
import { ripenRgb } from "@/scroll/ripening";
import { ORANGE_RADIUS, studioPose, type StudioPose } from "@/scroll/studio";
import { registry } from "@/scene/registry";
import { cutTexture } from "./cut-texture";
import { buildCutFace, buildOrange } from "./orange-geometry";
import { peelTexture } from "./peel";

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

const pose: StudioPose = { visible: false, y: 0, rotY: 0, rotX: 0, scale: 1, cameraZ: 4.3, halves: false, orient: 0, gap: 0, outward: 0, press: 0, shadow: 1 };
const rgb: [number, number, number] = [0, 0, 0];
const tint = new Color();
const CREAM = new Color("#f7f3ea");
const PRESS = new Color("#0f0d0a");

type Parts = {
  whole: Mesh;
  calyx: Group;
  halves: Group;
  pivotTop: Group;
  pivotBottom: Group;
  rigTop: Group;
  rigBottom: Group;
  shadow: Mesh;
  peel: MeshPhysicalMaterial;
};

/** Per-frame step: pose the orange (whole, then halves) and the product-shot camera from scroll. Plain function. */
function stepStudio(parts: Parts, aspect: number, p: number) {
  studioPose(p, pose);
  const R = ORANGE_RADIUS * pose.scale;
  const showWhole = pose.visible && !pose.halves;
  parts.whole.visible = showWhole;
  parts.calyx.visible = showWhole;
  parts.halves.visible = pose.halves;

  parts.whole.position.y = pose.y;
  parts.whole.rotation.set(pose.rotX, pose.rotY, 0);
  parts.whole.scale.setScalar(R);
  parts.calyx.position.copy(parts.whole.position);
  parts.calyx.rotation.copy(parts.whole.rotation);
  parts.calyx.scale.setScalar(R);

  // halves: both share the orientation; the pivots (at the cut centre) part along x and turn outward
  for (const rig of [parts.rigTop, parts.rigBottom]) {
    rig.rotation.order = "YZX";
    rig.rotation.set(pose.rotX, pose.rotY, pose.orient);
    rig.scale.setScalar(R);
  }
  const gap = pose.gap * R;
  parts.pivotTop.position.x = -gap;
  parts.pivotBottom.position.x = gap;
  parts.pivotTop.rotation.y = (-Math.PI / 2) * pose.outward;
  parts.pivotBottom.rotation.y = (Math.PI / 2) * pose.outward;

  // the shadow stays on the floor and breathes with the fruit's height
  parts.shadow.visible = pose.visible && pose.shadow > 0.001;
  parts.shadow.scale.setScalar(R * (1.7 - pose.y * 3));
  (parts.shadow.material as MeshBasicMaterial).opacity = Math.max(0, 0.2 - pose.y * 1.2) * pose.shadow;

  ripenRgb(1, rgb);
  parts.peel.color.copy(tint.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace));
  registry.studioBackground.lerpColors(CREAM, PRESS, pose.press);

  const cam = registry.studioCamera;
  cam.aspect = aspect;
  cam.position.set(0, 0, pose.cameraZ);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}

/**
 * Scenes 06 and 07: a premium product shot. One ripe orange floats in a clean
 * cream studio, rotates with scroll, then (as two hemispheres built from the
 * same vertex buffers, so closed they are seamless) turns and parts to show its
 * juicy cross-sections. Everything is a pure function of progress; no geometry
 * is built or cut while scrolling.
 */
export function StudioWorld({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const whole = useRef<Mesh>(null);
  const calyx = useRef<Group>(null);
  const halves = useRef<Group>(null);
  const pivotTop = useRef<Group>(null);
  const pivotBottom = useRef<Group>(null);
  const rigTop = useRef<Group>(null);
  const rigBottom = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);

  const orange = useMemo(() => buildOrange(), []);
  const cut = useMemo(() => buildCutFace(orange.rim), [orange]);
  const peelMap = useMemo(() => peelTexture([3, 2]), []);
  const cutMap = useMemo(() => cutTexture(), []);
  const shade = useMemo(() => shadowTexture(), []);
  const peel = useMemo(() => new MeshPhysicalMaterial({ map: peelMap, bumpMap: peelMap, bumpScale: 2.4, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.45, envMapIntensity: 0.45 }), [peelMap]);
  const peelBoth = useMemo(() => {
    const m = peel.clone();
    m.side = 2; // double sided, so the inside of the peel shows through the first thin gap
    return m;
  }, [peel]);
  // juicy but not neon: a damped tint keeps the flat face from clipping under the key light
  const flesh = useMemo(
    () => new MeshPhysicalMaterial({ color: "#ffffff", map: cutMap, bumpMap: cutMap, bumpScale: 1.4, roughness: 0.55, clearcoat: 0.05, clearcoatRoughness: 0.4, emissive: new Color("#ff6a00"), emissiveIntensity: 0.1, envMapIntensity: 0.12, side: 2 }),
    [cutMap],
  );
  useEffect(
    () => () => {
      [orange.whole, orange.top, orange.bottom, cut].forEach((g) => g.dispose());
      [peelMap, cutMap, shade].forEach((t) => t.dispose());
      [peel, peelBoth, flesh].forEach((m) => m.dispose());
    },
    [orange, cut, peelMap, cutMap, shade, peel, peelBoth, flesh],
  );

  // an offline "room" environment gives the surfaces believable highlights without any network fetch
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
    const r = { whole, calyx, halves, pivotTop, pivotBottom, rigTop, rigBottom, shadow };
    if (Object.values(r).some((x) => !x.current)) return;
    stepStudio(
      {
        whole: whole.current!, calyx: calyx.current!, halves: halves.current!, pivotTop: pivotTop.current!, pivotBottom: pivotBottom.current!,
        rigTop: rigTop.current!, rigBottom: rigBottom.current!, shadow: shadow.current!, peel,
      },
      size.width / size.height,
      progress.get(),
    );
    peelBoth.color.copy(peel.color);
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* soft key from the upper left, a subtle warm rim from behind, gentle ambient fill */}
      <hemisphereLight args={["#fff7ea", "#efe3cf", 0.45]} />
      <directionalLight position={[-2.5, 3, 4]} color="#fff3e0" intensity={1.5} />
      <directionalLight position={[3, 1.5, -3]} color="#ffd9a8" intensity={1.1} />

      {/* the whole orange (scene 06) */}
      <mesh ref={whole} geometry={orange.whole} material={peel} visible={false} />
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

      {/* the two halves (scene 07): same vertices as the whole, so closed they match it exactly */}
      <group ref={halves} visible={false}>
        <group ref={pivotTop}>
          <group ref={rigTop}>
            <mesh geometry={orange.top} material={peelBoth} />
            <mesh geometry={cut} material={flesh} rotation={[Math.PI, 0, 0]} />
            <mesh position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.07, 0.09, 0.05, 12]} />
              <meshStandardMaterial color="#476b35" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.96, 0]}>
              <cylinderGeometry args={[0.018, 0.022, 0.09, 8]} />
              <meshStandardMaterial color="#5c4a30" roughness={0.9} />
            </mesh>
          </group>
        </group>
        <group ref={pivotBottom}>
          <group ref={rigBottom}>
            <mesh geometry={orange.bottom} material={peelBoth} />
            <mesh geometry={cut} material={flesh} />
          </group>
        </group>
      </group>

      <mesh ref={shadow} position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={shade} transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
}
