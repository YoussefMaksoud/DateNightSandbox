"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface PlaceholderBuilding3DProps {
  position: [number, number, number];
  color: string;
  emoji: string;
  label: string;
}

export default function PlaceholderBuilding3D({ position, color, emoji, label }: PlaceholderBuilding3DProps) {
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const mat = glowRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 1.5 + position[0]) * 0.15;
  });

  return (
    <group position={position}>
      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.12} />
      </mesh>

      {/* Foundation */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.16, 2.4]} />
        <meshStandardMaterial color="#3d3225" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2.0, 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.75} />
      </mesh>

      {/* Roof — eaves */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <boxGeometry args={[2.4, 0.12, 2.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Roof — peak */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <boxGeometry args={[1.8, 0.25, 1.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.72, 0]} castShadow>
        <boxGeometry args={[1.0, 0.12, 1.0]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.55, 1.02]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#1a1510" />
      </mesh>

      {/* Window — front */}
      <group position={[0.55, 1.4, 1.02]}>
        <mesh>
          <boxGeometry args={[0.32, 0.32, 0.04]} />
          <meshStandardMaterial color="#2a2520" />
        </mesh>
        <mesh ref={glowRef}>
          <boxGeometry args={[0.28, 0.28, 0.06]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Window — side */}
      <group position={[1.02, 1.4, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.32, 0.32, 0.04]} />
          <meshStandardMaterial color="#2a2520" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.28, 0.28, 0.06]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Sign */}
      <Html center position={[0, 3.3, 0]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#a1a1aa",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            marginTop: 2,
          }}>
            {label}
          </span>
        </div>
      </Html>
    </group>
  );
}
