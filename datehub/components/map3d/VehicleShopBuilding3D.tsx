"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface VehicleShopBuilding3DProps {
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

function SpinningWrench({ offset }: { offset: number }) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset;
    ref.current.rotation.z = t * 1.5;
    ref.current.position.y = 2.5 + Math.sin(t * 2) * 0.15;
  });

  return (
    <group ref={ref} position={[0, 2.5, 0]}>
      {/* Wrench handle */}
      <mesh>
        <boxGeometry args={[0.06, 0.5, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Wrench head */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.18, 0.1, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function FloatingGear({ offset, color }: { offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset;
    ref.current.position.x = Math.cos(t * 0.8) * 1.4;
    ref.current.position.z = Math.sin(t * 0.8) * 1.4;
    ref.current.position.y = 2.8 + Math.sin(t * 1.5) * 0.2;
    ref.current.rotation.z = t * 2;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.1, 0.03, 8, 16]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

export default function VehicleShopBuilding3D({ position, isNearby }: VehicleShopBuilding3DProps) {
  const garageDoorRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const color = "#E67E22";

  useFrame(({ clock }, delta) => {
    // Animate garage door — slides up when nearby
    if (garageDoorRef.current) {
      const targetY = isNearby ? 1.8 : 0.7;
      garageDoorRef.current.position.y = THREE.MathUtils.lerp(
        garageDoorRef.current.position.y, targetY, 3 * delta
      );
    }

    // Animate light
    if (lightRef.current) {
      lightRef.current.intensity = isNearby
        ? 2.0 + Math.sin(clock.elapsedTime * 3) * 0.5
        : 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Glow ring when nearby */}
      {isNearby && <GlowRing color={color} />}

      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2, 24]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {/* Foundation */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.2, 2.8]} />
        <meshStandardMaterial color="#3d3225" />
      </mesh>

      {/* Main building body — wider, shorter (garage style) */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.0, 2.4]} />
        <meshStandardMaterial color="#4a4a55" roughness={0.7} />
      </mesh>

      {/* Orange accent stripe */}
      <mesh position={[0, 2.1, 1.21]}>
        <boxGeometry args={[2.4, 0.2, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 2.1, -1.21]}>
        <boxGeometry args={[2.4, 0.2, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Flat roof */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[2.8, 0.15, 2.8]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.6} />
      </mesh>

      {/* Garage door opening (dark recess) */}
      <mesh position={[0, 0.7, 1.21]}>
        <boxGeometry args={[1.4, 1.2, 0.05]} />
        <meshStandardMaterial color="#111118" />
      </mesh>

      {/* Animated garage door (slides up when nearby) */}
      <mesh ref={garageDoorRef} position={[0, 0.7, 1.24]} castShadow>
        <boxGeometry args={[1.4, 1.2, 0.04]} />
        <meshStandardMaterial color="#666670" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Door horizontal lines (ridges) */}
      {[-0.35, -0.1, 0.15, 0.4].map((ly, i) => (
        <mesh key={i} position={[0, 0.7 + ly * 0.8, 1.26]}>
          <boxGeometry args={[1.35, 0.02, 0.01]} />
          <meshStandardMaterial color="#555560" metalness={0.3} />
        </mesh>
      ))}

      {/* Side window */}
      <group position={[1.22, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.4, 0.04]} />
          <meshStandardMaterial color="#2a2520" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.45, 0.35, 0.06]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Other side window */}
      <group position={[-1.22, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.4, 0.04]} />
          <meshStandardMaterial color="#2a2520" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.45, 0.35, 0.06]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Roof sign — "GARAGE" look: metal sign on top */}
      <mesh position={[0, 2.55, 0.8]} castShadow>
        <boxGeometry args={[1.6, 0.4, 0.06]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.55, 0.83]}>
        <boxGeometry args={[1.4, 0.3, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      {/* Tool rack on side wall */}
      <mesh position={[-1.23, 0.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.04]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>

      {/* Oil barrel outside */}
      <mesh position={[1.5, 0.3, 1.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.5, 16]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
      </mesh>

      {/* Tire stack outside */}
      {[0, 0.15, 0.3].map((ty, i) => (
        <mesh key={i} position={[-1.5, 0.25 + ty, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.06, 12, 16]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}

      {/* Spinning wrench when nearby */}
      {isNearby && <SpinningWrench offset={0} />}

      {/* Floating gears when nearby */}
      {isNearby && (
        <>
          <FloatingGear offset={0} color="#E67E22" />
          <FloatingGear offset={2.1} color="#DAA520" />
          <FloatingGear offset={4.2} color="#E67E22" />
        </>
      )}

      {/* Point light */}
      <pointLight ref={lightRef} position={[0, 2.5, 1.5]} color={color} intensity={0.8} distance={7} decay={2} />

      {/* Interior light glow (visible through open door) */}
      <pointLight position={[0, 1.0, 0.5]} color="#ffe4b5" intensity={0.4} distance={3} decay={2} />

      {/* Label */}
      <Html center position={[0, 3.3, 0]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{
            fontSize: isNearby ? 32 : 26,
            filter: isNearby ? `drop-shadow(0 0 8px ${color})` : "none",
            transition: "all 0.3s ease",
          }}>
            🔧
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
            Speed Shop
          </span>
        </div>
      </Html>
    </group>
  );
}
