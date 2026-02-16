"use client";

import { Html } from "@react-three/drei";
import Avatar3D from "./Avatar3D";

interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
  expression: string;
  background: string;
  vehicle?: string;
}

interface AvatarSprite3DProps {
  position: [number, number, number];
  config: AvatarConfig;
  label: string;
  isCurrentUser?: boolean;
  isMoving?: boolean;
}

export default function AvatarSprite3D({ position, config, label, isCurrentUser, isMoving }: AvatarSprite3DProps) {
  return (
    <group position={position}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.2} />
      </mesh>

      {/* 3D Avatar */}
      <Avatar3D config={config} isMoving={isMoving} />

      {/* Name label above head */}
      <Html center position={[0, 1.1, 0]} distanceFactor={10} style={{ pointerEvents: "none" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: isCurrentUser ? 700 : 500,
            color: isCurrentUser ? "#e11d48" : "#9ca3af",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}
