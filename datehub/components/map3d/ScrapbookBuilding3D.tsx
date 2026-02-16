"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface ScrapbookBuilding3DProps {
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

export default function ScrapbookBuilding3D({ position, isNearby }: ScrapbookBuilding3DProps) {
  const coverRef = useRef<THREE.Group>(null!);
  const bookGroupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const color = "#8B2252";

  useFrame(({ clock }, delta) => {
    // Float the book up when nearby, gentle bob, slow spin
    if (bookGroupRef.current) {
      const targetY = isNearby ? 0.35 : 0;
      bookGroupRef.current.position.y = THREE.MathUtils.lerp(bookGroupRef.current.position.y, targetY, 2 * delta);

      if (isNearby) {
        // Gentle hover bob
        bookGroupRef.current.position.y += Math.sin(clock.elapsedTime * 1.8) * 0.025;
        // Slow rotation
        bookGroupRef.current.rotation.y = THREE.MathUtils.lerp(bookGroupRef.current.rotation.y, Math.sin(clock.elapsedTime * 0.4) * 0.3, 2 * delta);
      } else {
        bookGroupRef.current.rotation.y = THREE.MathUtils.lerp(bookGroupRef.current.rotation.y, 0, 2 * delta);
      }
    }

    // Animate book cover open/close
    if (coverRef.current) {
      const target = isNearby ? Math.PI : 0;
      coverRef.current.rotation.z = THREE.MathUtils.lerp(coverRef.current.rotation.z, target, 3 * delta);
    }

    // Animate light
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

      {/* Pedestal — 3 stacked discs, decreasing in size going up */}
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

      {/* Book group — floats up when nearby */}
      <group ref={bookGroupRef}>
        {/* Pages (visible when open) */}
        <mesh position={[0, 1.10, 0]} castShadow>
          <boxGeometry args={[1.15, 0.1, 0.75]} />
          <meshStandardMaterial color="#F5F0E0" />
        </mesh>

        {/* Book bottom cover */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[1.2, 0.04, 0.8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        {/* Book top cover (animated — pivots from left edge) */}
        <group position={[-0.6, 1.18, 0]} ref={coverRef}>
          <mesh position={[0.6, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 0.04, 0.8]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          {/* Gold trim on cover */}
          <mesh position={[0.6, 0.025, 0]}>
            <boxGeometry args={[0.8, 0.005, 0.5]} />
            <meshStandardMaterial color="#DAA520" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Book spine */}
        <mesh position={[-0.6, 0.74, 0]} castShadow>
          <boxGeometry args={[0.06, 0.15, 0.8]} />
          <meshStandardMaterial color="#6B1242" roughness={0.6} />
        </mesh>

        {/* Golden clasp on front */}
        <mesh position={[0.55, 0.74, 0.42]}>
          <boxGeometry args={[0.15, 0.08, 0.04]} />
          <meshStandardMaterial color="#DAA520" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Floating orbs when nearby */}
      {isNearby && (
        <>
          <FloatingOrb offset={0} color="#FF69B4" />
          <FloatingOrb offset={2.1} color="#DAA520" />
          <FloatingOrb offset={4.2} color="#FF69B4" />
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
            📔
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
            Scrapbook Station
          </span>
        </div>
      </Html>
    </group>
  );
}
