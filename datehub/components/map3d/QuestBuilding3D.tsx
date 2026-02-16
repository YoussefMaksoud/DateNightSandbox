"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface QuestBuilding3DProps {
  position: [number, number, number];
  color: string;
  emoji: string;
  label: string;
  isNearby: boolean;
}

function GlowRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.08;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshStandardMaterial).opacity =
      0.3 + Math.sin(clock.elapsedTime * 2) * 0.15;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[2.4, 2.9, 32]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function WindowGlow({ position, color, rotY = 0 }: { position: [number, number, number]; color: string; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[0.35, 0.35, 0.06]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.8} />
      </mesh>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[0.4, 0.4, 0.04]} />
        <meshStandardMaterial color="#2a2520" />
      </mesh>
    </group>
  );
}

export default function QuestBuilding3D({ position, color, emoji, label, isNearby }: QuestBuilding3DProps) {
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = isNearby
        ? 1.5 + Math.sin(clock.elapsedTime * 3) * 0.5
        : 0.6;
    }
  });

  return (
    <group position={position}>
      {/* Glow ring when nearby */}
      {isNearby && <GlowRing color={color} />}

      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.8, 24]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Foundation / base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.2, 2.6]} />
        <meshStandardMaterial color="#3d3225" />
      </mesh>

      {/* Building body — walls */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 2.3, 2.2]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Darker edge accents (thin strips on sides) */}
      <mesh position={[-1.11, 1.35, 0]} castShadow>
        <boxGeometry args={[0.02, 2.3, 2.2]} />
        <meshStandardMaterial color="#00000033" transparent opacity={0.2} />
      </mesh>
      <mesh position={[1.11, 1.35, 0]} castShadow>
        <boxGeometry args={[0.02, 2.3, 2.2]} />
        <meshStandardMaterial color="#00000033" transparent opacity={0.2} />
      </mesh>

      {/* Roof — peaked look */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <boxGeometry args={[2.6, 0.15, 2.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.85, 0]} castShadow>
        <boxGeometry args={[2.0, 0.25, 2.0]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <boxGeometry args={[1.2, 0.15, 1.2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.65, 1.12]}>
        <boxGeometry args={[0.6, 1.1, 0.05]} />
        <meshStandardMaterial color="#1a1510" />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.18, 0.65, 1.15]}>
        <sphereGeometry args={[0.04, 12, 8]} />
        <meshStandardMaterial color="#FBBF24" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Windows — front */}
      <WindowGlow position={[-0.6, 1.6, 1.12]} color={color} />
      <WindowGlow position={[0.6, 1.6, 1.12]} color={color} />
      {/* Windows — sides */}
      <WindowGlow position={[1.12, 1.6, -0.3]} color={color} rotY={Math.PI / 2} />
      <WindowGlow position={[-1.12, 1.6, -0.3]} color={color} rotY={Math.PI / 2} />

      {/* Point light at building */}
      <pointLight ref={lightRef} position={[0, 2, 1.5]} color={color} intensity={0.6} distance={6} decay={2} />

      {/* Emoji + label sign */}
      <Html center position={[0, 3.8, 0]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{
            fontSize: isNearby ? 32 : 26,
            filter: isNearby ? `drop-shadow(0 0 8px ${color})` : "none",
            transition: "all 0.3s ease",
          }}>
            {emoji}
          </span>
          <span style={{
            fontSize: isNearby ? 14 : 11,
            fontWeight: 700,
            color: isNearby ? "white" : "#d4d4d8",
            textShadow: isNearby
              ? `0 0 12px ${color}, 0 1px 4px rgba(0,0,0,0.9)`
              : "0 1px 4px rgba(0,0,0,0.8)",
            marginTop: 3,
            transition: "all 0.3s ease",
            letterSpacing: "0.02em",
          }}>
            {label}
          </span>
        </div>
      </Html>
    </group>
  );
}
