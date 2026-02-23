"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface TriviaTowerBuilding3DProps {
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
      <ringGeometry args={[2.4, 2.9, 32]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function FloatingOrb({ offset, color }: { offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset;
    ref.current.position.x = Math.cos(t * 1.2) * 1.2;
    ref.current.position.z = Math.sin(t * 1.2) * 1.2;
    ref.current.position.y = 2.2 + Math.sin(t * 2) * 0.3;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
}

export default function TriviaTowerBuilding3D({ position, isNearby }: TriviaTowerBuilding3DProps) {
  const towerGroupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const orbRef = useRef<THREE.Mesh>(null!);
  const color = "#F97316";

  useFrame(({ clock }, delta) => {
    if (towerGroupRef.current) {
      const targetY = isNearby ? 0.35 : 0;
      towerGroupRef.current.position.y = THREE.MathUtils.lerp(towerGroupRef.current.position.y, targetY, 2 * delta);

      if (isNearby) {
        towerGroupRef.current.position.y += Math.sin(clock.elapsedTime * 1.8) * 0.025;
        towerGroupRef.current.rotation.y = THREE.MathUtils.lerp(towerGroupRef.current.rotation.y, Math.sin(clock.elapsedTime * 0.4) * 0.3, 2 * delta);
      } else {
        towerGroupRef.current.rotation.y = THREE.MathUtils.lerp(towerGroupRef.current.rotation.y, 0, 2 * delta);
      }
    }

    if (orbRef.current) {
      orbRef.current.position.y = 1.15 + Math.sin(clock.elapsedTime * 2.5) * 0.06;
      orbRef.current.rotation.y += delta * 1.5;
    }

    if (lightRef.current) {
      lightRef.current.intensity = isNearby
        ? 1.5 + Math.sin(clock.elapsedTime * 3) * 0.5
        : 0.6;
    }
  });

  return (
    <group position={position}>
      {isNearby && <GlowRing color={color} />}

      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.8, 24]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Pedestal — 3 stacked discs */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.12, 24]} />
        <meshStandardMaterial color="#7A6548" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.12, 24]} />
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.30, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
        <meshStandardMaterial color="#9B8365" roughness={0.7} />
      </mesh>

      {/* Tower group — floats up when nearby */}
      <group ref={towerGroupRef}>
        {/* Stacked books */}
        {/* Book 1 (red, bottom) */}
        <mesh position={[0, 0.48, 0]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.45, 0.1, 0.35]} />
          <meshStandardMaterial color="#E74C3C" roughness={0.6} />
        </mesh>
        {/* Book 2 (blue, middle) */}
        <mesh position={[0, 0.58, 0]} rotation={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.3]} />
          <meshStandardMaterial color="#3498DB" roughness={0.6} />
        </mesh>
        {/* Book 3 (green, top) */}
        <mesh position={[0, 0.68, 0]} rotation={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.35, 0.1, 0.28]} />
          <meshStandardMaterial color="#2ECC71" roughness={0.6} />
        </mesh>

        {/* Book spines (thin colored edges) */}
        <mesh position={[-0.2, 0.48, 0]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.02, 0.1, 0.35]} />
          <meshStandardMaterial color="#C0392B" roughness={0.5} />
        </mesh>
        <mesh position={[-0.18, 0.58, 0]} rotation={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.02, 0.1, 0.3]} />
          <meshStandardMaterial color="#2980B9" roughness={0.5} />
        </mesh>
        <mesh position={[-0.15, 0.68, 0]} rotation={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.02, 0.1, 0.28]} />
          <meshStandardMaterial color="#27AE60" roughness={0.5} />
        </mesh>

        {/* Golden question mark orb */}
        <mesh ref={orbRef} position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.18, 20, 16]} />
          <meshStandardMaterial
            color="#F97316"
            emissive="#F97316"
            emissiveIntensity={isNearby ? 1.2 : 0.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Small decorative stars around the orb */}
        <mesh position={[0.12, 1.0, 0.1]}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
        </mesh>
        <mesh position={[-0.1, 1.05, -0.08]}>
          <octahedronGeometry args={[0.03]} />
          <meshStandardMaterial color="#FFA500" emissive="#FFA500" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.05, 0.95, -0.12]}>
          <octahedronGeometry args={[0.035]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Floating orbs when nearby */}
      {isNearby && (
        <>
          <FloatingOrb offset={0} color="#F97316" />
          <FloatingOrb offset={2.1} color="#FF9800" />
          <FloatingOrb offset={4.2} color="#FFB74D" />
        </>
      )}

      {/* Point light */}
      <pointLight ref={lightRef} position={[0, 2.5, 1]} color={color} intensity={0.6} distance={6} decay={2} />

      {/* Label */}
      <Html center position={[0, 1.8, 0]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{
            fontSize: isNearby ? 32 : 26,
            filter: isNearby ? `drop-shadow(0 0 8px ${color})` : "none",
            transition: "all 0.3s ease",
          }}>
            🧩
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
            Trivia Tower
          </span>
        </div>
      </Html>
    </group>
  );
}
