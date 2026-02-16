"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface RaceFlag3DProps {
  position: [number, number, number];
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
      <ringGeometry args={[2.0, 2.4, 32]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function FloatingOrb({ offset, color }: { offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset;
    ref.current.position.x = Math.cos(t * 1.5) * 1.0;
    ref.current.position.z = Math.sin(t * 1.5) * 1.0;
    ref.current.position.y = 3.5 + Math.sin(t * 2) * 0.2;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 16, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
}

export default function RaceFlag3D({ position, isNearby }: RaceFlag3DProps) {
  const flagRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const color = "#22C55E";

  useFrame(({ clock }, delta) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 2.5) * 0.2;
      if (isNearby) {
        const targetScale = 1.1 + Math.sin(clock.elapsedTime * 3) * 0.05;
        flagRef.current.scale.x = THREE.MathUtils.lerp(flagRef.current.scale.x, targetScale, 3 * delta);
        flagRef.current.scale.y = THREE.MathUtils.lerp(flagRef.current.scale.y, targetScale, 3 * delta);
      } else {
        flagRef.current.scale.x = THREE.MathUtils.lerp(flagRef.current.scale.x, 1, 3 * delta);
        flagRef.current.scale.y = THREE.MathUtils.lerp(flagRef.current.scale.y, 1, 3 * delta);
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = isNearby
        ? 2.0 + Math.sin(clock.elapsedTime * 3) * 0.8
        : 0.6;
    }
  });

  // Checkered pattern squares
  const squares: [number, number, number][] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      if ((row + col) % 2 === 0) {
        squares.push([
          -0.375 + col * 0.15,
          0.225 - row * 0.15,
          0.012,
        ]);
      }
    }
  }

  return (
    <group position={position}>
      {isNearby && <GlowRing color={color} />}

      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.5, 24]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Pole base — concrete pad */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.12, 16]} />
        <meshStandardMaterial color="#555555" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Main pole */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 3, 12]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Pole top ball */}
      <mesh position={[0, 3.15, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color="#DAA520" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Flag (animated) */}
      <group position={[0.5, 2.7, 0]} ref={flagRef}>
        {/* Flag background — black */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.6, 0.02]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* White checkered squares */}
        {squares.map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <boxGeometry args={[0.14, 0.14, 0.005]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* Floating orbs when nearby */}
      {isNearby && (
        <>
          <FloatingOrb offset={0} color="#22C55E" />
          <FloatingOrb offset={2.1} color="#ffffff" />
          <FloatingOrb offset={4.2} color="#22C55E" />
        </>
      )}

      {/* Point light */}
      <pointLight ref={lightRef} position={[0, 3.5, 1]} color={color} intensity={0.6} distance={6} decay={2} />

      {/* Label */}
      <Html center position={[0, 3.8, 0]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{
            fontSize: isNearby ? 32 : 26,
            filter: isNearby ? `drop-shadow(0 0 8px ${color})` : "none",
            transition: "all 0.3s ease",
          }}>
            🏁
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
            Start Race
          </span>
        </div>
      </Html>
    </group>
  );
}
