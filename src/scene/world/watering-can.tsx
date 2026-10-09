"use client";

import { ModelSlot } from "./model-slot";

/** A simple elegant watering can: body, spout with rose, handle. Hangs from its handle at the origin. */
export function WateringCan() {
  return (
    <ModelSlot name="wateringCan">
      <group position={[0, -0.14, 0]} scale={0.9}>
        <mesh position={[0, -0.02, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.1, 0.2, 20]} />
          <meshStandardMaterial color="#c9b898" roughness={0.45} metalness={0.35} />
        </mesh>
        {/* spout */}
        <mesh position={[0.15, 0.0, 0]} rotation={[0, 0, -0.85]} castShadow>
          <cylinderGeometry args={[0.012, 0.022, 0.26, 10]} />
          <meshStandardMaterial color="#c9b898" roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0.255, 0.1, 0]} rotation={[0, 0, -0.85]} castShadow>
          <cylinderGeometry args={[0.035, 0.02, 0.04, 14]} />
          <meshStandardMaterial color="#a8946f" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* handle */}
        <mesh position={[-0.02, 0.15, 0]} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.09, 0.011, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#a8946f" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>
    </ModelSlot>
  );
}
