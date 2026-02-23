"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface LeaderboardPedestal3DProps {
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
    ref.current.position.y = 2.2 + Math.sin(t * 2) * 0.3;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 16, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
}

export default function LeaderboardPedestal3D({ position, isNearby }: LeaderboardPedestal3DProps) {
  const medalRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const pedestalRef = useRef<THREE.Group>(null!);
  const color = "#DAA520";

  useFrame(({ clock }, delta) => {
    // Slowly rotate the medal
    if (medalRef.current) {
      medalRef.current.rotation.y = clock.elapsedTime * 0.8;
    }

    // Lerp scale when nearby
    if (pedestalRef.current) {
      if (isNearby) {
        const targetScale = 1.1 + Math.sin(clock.elapsedTime * 3) * 0.05;
        pedestalRef.current.scale.x = THREE.MathUtils.lerp(pedestalRef.current.scale.x, targetScale, 3 * delta);
        pedestalRef.current.scale.y = THREE.MathUtils.lerp(pedestalRef.current.scale.y, targetScale, 3 * delta);
      } else {
        pedestalRef.current.scale.x = THREE.MathUtils.lerp(pedestalRef.current.scale.x, 1, 3 * delta);
        pedestalRef.current.scale.y = THREE.MathUtils.lerp(pedestalRef.current.scale.y, 1, 3 * delta);
      }
    }

    // Light intensity changes
    if (lightRef.current) {
      lightRef.current.intensity = isNearby
        ? 2.0 + Math.sin(clock.elapsedTime * 3) * 0.8
        : 0.6;
    }
  });

  return (
    <group position={position}>
      {isNearby && <GlowRing color={color} />}

      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.5, 24]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      <group ref={pedestalRef}>
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

        {/* Floating gold medal */}
        <group ref={medalRef} position={[0, 1.0, 0]}>
          {/* Medal disc */}
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />
            <meshStandardMaterial color="#DAA520" metalness={0.8} roughness={0.2} emissive="#DAA520" emissiveIntensity={0.3} />
          </mesh>

          {/* Star emboss on front face */}
          <mesh position={[0, 0, 0.035]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Star emboss on back face */}
          <mesh position={[0, 0, -0.035]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Ribbon — left strip */}
          <mesh position={[-0.06, 0.35, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.02]} />
            <meshStandardMaterial color="#DC2626" />
          </mesh>

          {/* Ribbon — right strip */}
          <mesh position={[0.06, 0.35, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.02]} />
            <meshStandardMaterial color="#DC2626" />
          </mesh>

          {/* Ribbon — top connecting piece */}
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.22, 0.06, 0.02]} />
            <meshStandardMaterial color="#DC2626" />
          </mesh>
        </group>
      </group>

      {/* Floating orbs when nearby */}
      {isNearby && (
        <>
          <FloatingOrb offset={0} color="#DAA520" />
          <FloatingOrb offset={2.1} color="#ffffff" />
          <FloatingOrb offset={4.2} color="#DAA520" />
        </>
      )}

      {/* Point light */}
      <pointLight ref={lightRef} position={[0, 2.5, 1]} color={color} intensity={0.6} distance={6} decay={2} />

      {/* Label */}
      <Html center position={[0, 2.2, 0]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{
            fontSize: isNearby ? 32 : 26,
            filter: isNearby ? `drop-shadow(0 0 8px ${color})` : "none",
            transition: "all 0.3s ease",
          }}>
            🏆
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
            Leaderboard
          </span>
        </div>
      </Html>
    </group>
  );
}
