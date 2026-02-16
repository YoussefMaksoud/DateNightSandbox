"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface PaintingBuilding3DProps {
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

export default function PaintingBuilding3D({ position, isNearby }: PaintingBuilding3DProps) {
  const easelGroupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const color = "#9C27B0";

  useFrame(({ clock }, delta) => {
    if (easelGroupRef.current) {
      const targetY = isNearby ? 0.35 : 0;
      easelGroupRef.current.position.y = THREE.MathUtils.lerp(easelGroupRef.current.position.y, targetY, 2 * delta);

      if (isNearby) {
        easelGroupRef.current.position.y += Math.sin(clock.elapsedTime * 1.8) * 0.025;
        easelGroupRef.current.rotation.y = THREE.MathUtils.lerp(easelGroupRef.current.rotation.y, Math.sin(clock.elapsedTime * 0.4) * 0.3, 2 * delta);
      } else {
        easelGroupRef.current.rotation.y = THREE.MathUtils.lerp(easelGroupRef.current.rotation.y, 0, 2 * delta);
      }
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

      {/* Easel group — floats up when nearby */}
      <group ref={easelGroupRef}>
        {/* Left leg */}
        <mesh position={[-0.2, 0.75, 0.08]} rotation={[0.15, 0, 0.12]} castShadow>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#8B6914" roughness={0.7} />
        </mesh>

        {/* Right leg */}
        <mesh position={[0.2, 0.75, 0.08]} rotation={[0.15, 0, -0.12]} castShadow>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#8B6914" roughness={0.7} />
        </mesh>

        {/* Back leg */}
        <mesh position={[0, 0.65, -0.2]} rotation={[-0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color="#8B6914" roughness={0.7} />
        </mesh>

        {/* Support bar (horizontal) */}
        <mesh position={[0, 0.55, 0.06]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
          <meshStandardMaterial color="#A0782C" roughness={0.6} />
        </mesh>

        {/* Canvas */}
        <mesh position={[0, 0.85, 0.04]} castShadow>
          <boxGeometry args={[0.55, 0.45, 0.03]} />
          <meshStandardMaterial color="#FFF8E7" roughness={0.9} />
        </mesh>

        {/* Canvas frame */}
        <mesh position={[0, 0.85, 0.055]}>
          <boxGeometry args={[0.58, 0.48, 0.005]} />
          <meshStandardMaterial color="#6B4E2A" roughness={0.6} />
        </mesh>

        {/* Paint palette (floating near base) */}
        <group position={[0.35, 0.45, 0.15]} rotation={[-0.3, 0.2, 0]}>
          {/* Palette base */}
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
            <meshStandardMaterial color="#D2B48C" roughness={0.5} />
          </mesh>
          {/* Paint blobs */}
          <mesh position={[-0.06, 0.015, -0.04]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#FF0000" />
          </mesh>
          <mesh position={[0.05, 0.015, -0.06]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#0000FF" />
          </mesh>
          <mesh position={[0.08, 0.015, 0.02]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#FFFF00" />
          </mesh>
          <mesh position={[-0.04, 0.015, 0.06]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#00FF00" />
          </mesh>
          <mesh position={[0.02, 0.015, 0.04]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#FF69B4" />
          </mesh>
        </group>
      </group>

      {/* Floating orbs when nearby */}
      {isNearby && (
        <>
          <FloatingOrb offset={0} color="#E040FB" />
          <FloatingOrb offset={2.1} color="#7C4DFF" />
          <FloatingOrb offset={4.2} color="#E040FB" />
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
            🎨
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
            Paint Studio
          </span>
        </div>
      </Html>
    </group>
  );
}
