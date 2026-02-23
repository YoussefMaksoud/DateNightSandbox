"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- Color maps ---

const BODY_COLORS: Record<string, string> = {
  coral: "#FF6B6B", mint: "#4ECDC4", lavender: "#B8A9E8",
  sky: "#74B9FF", peach: "#FFD093", lemon: "#F9E547",
  blush: "#FD79A8", sage: "#00B894", lilac: "#A29BFE",
  ocean: "#0984E3", cloud: "#DFE6E9",
};

const OUTFITS: Record<string, string> = {
  rose: "#e11d48", blue: "#3B82F6", purple: "#8B5CF6", green: "#10B981",
  orange: "#F97316", red: "#DC2626", black: "#27272A", white: "#E4E4E7",
  pink: "#EC4899", teal: "#14B8A6",
};

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

function c(map: Record<string, string>, key: string): string {
  return map[key] ?? Object.values(map)[0];
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// --- Eye styles ---

function EyesMesh({ eyeStyle, expression }: { eyeStyle: string; expression: string }) {
  if (expression === "love-eyes") {
    return (
      <group position={[0, 0.04, 0.17]}>
        <mesh position={[-0.06, 0, 0.02]}>
          <sphereGeometry args={[0.028, 12, 8]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
        <mesh position={[0.06, 0, 0.02]}>
          <sphereGeometry args={[0.028, 12, 8]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
      </group>
    );
  }

  const yPos = 0.04;
  const zPos = 0.17;

  switch (eyeStyle) {
    case "anime":
      return (
        <group position={[0, yPos, zPos]}>
          {[-0.06, 0.06].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0, 0.02]}>
                <sphereGeometry args={[0.032, 16, 12]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <sphereGeometry args={[0.022, 16, 12]} />
                <meshStandardMaterial color="#2E86C1" />
              </mesh>
              <mesh position={[0, 0, 0.048]}>
                <sphereGeometry args={[0.01, 12, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              {/* Sparkle highlights */}
              <mesh position={[0.01, 0.012, 0.052]}>
                <sphereGeometry args={[0.006, 8, 6]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[-0.006, -0.005, 0.052]}>
                <sphereGeometry args={[0.004, 8, 6]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "sleepy":
      return (
        <group position={[0, yPos, zPos]}>
          {[-0.06, 0.06].map((x) => (
            <mesh key={x} position={[x, 0, 0.02]}>
              <boxGeometry args={[0.04, 0.008, 0.01]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          ))}
        </group>
      );
    case "cyclops":
      return (
        <group position={[0, yPos, zPos]}>
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.04, 16, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <sphereGeometry args={[0.025, 16, 12]} />
            <meshStandardMaterial color="#2E86C1" />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.012, 12, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      );
    case "button":
      return (
        <group position={[0, yPos, zPos]}>
          <mesh position={[-0.06, 0, 0.02]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.06, 0, 0.02]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      );
    case "sparkle":
      return (
        <group position={[0, yPos, zPos]}>
          {[-0.06, 0.06].map((x) => (
            <mesh key={x} position={[x, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.025, 0.025, 0.01]} />
              <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      );
    case "angry":
      return (
        <group position={[0, yPos, zPos]}>
          {[-0.06, 0.06].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0, 0.02]}>
                <sphereGeometry args={[0.025, 16, 12]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, 0.035]}>
                <sphereGeometry args={[0.016, 16, 12]} />
                <meshStandardMaterial color="#DC2626" />
              </mesh>
              <mesh position={[0, 0, 0.042]}>
                <sphereGeometry args={[0.008, 12, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              {/* Angry brow */}
              <mesh position={[0, 0.03, 0.02]} rotation={[0, 0, x < 0 ? -0.4 : 0.4]}>
                <boxGeometry args={[0.035, 0.008, 0.01]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            </group>
          ))}
        </group>
      );
    default: // "round"
      return (
        <group position={[0, yPos, zPos]}>
          {[-0.06, 0.06].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0, 0.02]}>
                <sphereGeometry args={[0.025, 16, 12]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, 0.035]}>
                <sphereGeometry args={[0.016, 16, 12]} />
                <meshStandardMaterial color="#2E86C1" />
              </mesh>
              <mesh position={[0, 0, 0.042]}>
                <sphereGeometry args={[0.008, 12, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          ))}
        </group>
      );
  }
}

// --- Mouth / expression ---

function MouthMesh({ expression }: { expression: string }) {
  switch (expression) {
    case "smile":
    case "love-eyes":
      return (
        <mesh position={[0, -0.04, 0.19]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.03, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      );
    case "laugh":
      return (
        <mesh position={[0, -0.05, 0.18]}>
          <sphereGeometry args={[0.025, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      );
    case "wink":
      return (
        <mesh position={[0.01, -0.04, 0.19]} rotation={[0.1, 0, 0.1]}>
          <torusGeometry args={[0.025, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      );
    case "surprised":
      return (
        <mesh position={[0, -0.05, 0.19]}>
          <sphereGeometry args={[0.018, 16, 12]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      );
    case "cool":
      return (
        <mesh position={[0, -0.04, 0.18]}>
          <boxGeometry args={[0.04, 0.008, 0.008]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      );
    default:
      return (
        <mesh position={[0, -0.04, 0.19]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.03, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      );
  }
}

// --- Creature head features ---

function CreatureHead({ creature, bodyColor, eyeStyle, expression }: {
  creature: string; bodyColor: string; eyeStyle: string; expression: string;
}) {
  const col = c(BODY_COLORS, bodyColor);
  const dark = darken(col, 40);

  switch (creature) {
    case "cat":
      return (
        <group position={[0, 0.58, 0]}>
          {/* Head */}
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Pointy ears */}
          <mesh position={[-0.12, 0.16, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color={col} />
          </mesh>
          <mesh position={[0.12, 0.16, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Inner ears */}
          <mesh position={[-0.12, 0.16, 0.01]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.03, 0.08, 4]} />
            <meshStandardMaterial color="#FFB6C1" />
          </mesh>
          <mesh position={[0.12, 0.16, 0.01]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.03, 0.08, 4]} />
            <meshStandardMaterial color="#FFB6C1" />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.02, 0.18]}>
            <coneGeometry args={[0.015, 0.02, 3]} />
            <meshStandardMaterial color="#FFB6C1" />
          </mesh>
          {/* Whiskers */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.08, -0.01, 0.16]} rotation={[0, 0, side * 0.1]}>
                <boxGeometry args={[0.08, 0.003, 0.003]} />
                <meshStandardMaterial color={dark} />
              </mesh>
              <mesh position={[side * 0.08, -0.03, 0.16]} rotation={[0, 0, side * 0.2]}>
                <boxGeometry args={[0.07, 0.003, 0.003]} />
                <meshStandardMaterial color={dark} />
              </mesh>
            </group>
          ))}
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
          <MouthMesh expression={expression} />
        </group>
      );

    case "dog":
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Floppy ears */}
          <mesh position={[-0.16, 0.02, 0]} rotation={[0.2, 0, -0.5]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[0.16, 0.02, 0]} rotation={[0.2, 0, 0.5]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          {/* Snout */}
          <mesh position={[0, -0.03, 0.16]}>
            <sphereGeometry args={[0.06, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.01, 0.22]}>
            <sphereGeometry args={[0.02, 12, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Tongue */}
          <mesh position={[0.01, -0.07, 0.18]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="#FF6B81" />
          </mesh>
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
          <MouthMesh expression={expression} />
        </group>
      );

    case "bunny":
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Tall ears */}
          {[-0.07, 0.07].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.28, -0.02]} castShadow>
                <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
                <meshStandardMaterial color={col} />
              </mesh>
              <mesh position={[x, 0.28, 0]}>
                <capsuleGeometry args={[0.02, 0.14, 8, 16]} />
                <meshStandardMaterial color="#FFB6C1" />
              </mesh>
            </group>
          ))}
          {/* Nose */}
          <mesh position={[0, -0.02, 0.17]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="#FFB6C1" />
          </mesh>
          {/* Buck teeth */}
          <mesh position={[-0.012, -0.06, 0.16]}>
            <boxGeometry args={[0.018, 0.025, 0.01]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.012, -0.06, 0.16]}>
            <boxGeometry args={[0.018, 0.025, 0.01]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
          <MouthMesh expression={expression} />
        </group>
      );

    case "bear":
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Round ears */}
          <mesh position={[-0.14, 0.14, 0]}>
            <sphereGeometry args={[0.06, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          <mesh position={[0.14, 0.14, 0]}>
            <sphereGeometry args={[0.06, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          <mesh position={[-0.14, 0.14, 0.01]}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[0.14, 0.14, 0.01]}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.02, 0.19]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Rosy cheeks */}
          <mesh position={[-0.1, -0.04, 0.14]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color="#FFB6C1" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.1, -0.04, 0.14]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color="#FFB6C1" transparent opacity={0.5} />
          </mesh>
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
          <MouthMesh expression={expression} />
        </group>
      );

    case "frog":
      return (
        <group position={[0, 0.56, 0]}>
          {/* Wide flat head */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 12, 8]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Bulging eyes on top */}
          {[-0.1, 0.1].map((x) => (
            <group key={x} position={[x, 0.14, 0.06]}>
              <mesh>
                <sphereGeometry args={[0.055, 16, 12]} />
                <meshStandardMaterial color={col} />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <sphereGeometry args={[0.03, 16, 12]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, 0.055]}>
                <sphereGeometry args={[0.015, 12, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          ))}
          {/* Wide mouth */}
          <mesh position={[0, -0.06, 0.18]}>
            <boxGeometry args={[0.14, 0.006, 0.01]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          {/* No standard eyes/mouth for frog — they're custom above */}
        </group>
      );

    case "fox":
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Pointy ears */}
          <mesh position={[-0.11, 0.16, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.05, 0.14, 4]} />
            <meshStandardMaterial color={col} />
          </mesh>
          <mesh position={[0.11, 0.16, 0]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.05, 0.14, 4]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* White inner ears */}
          <mesh position={[-0.11, 0.16, 0.01]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.025, 0.09, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.11, 0.16, 0.01]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.025, 0.09, 4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* White muzzle area */}
          <mesh position={[0, -0.04, 0.14]}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* Pointed snout/nose */}
          <mesh position={[0, -0.03, 0.21]}>
            <sphereGeometry args={[0.018, 12, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
          <MouthMesh expression={expression} />
        </group>
      );

    case "owl":
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Ear tufts */}
          <mesh position={[-0.12, 0.18, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.03, 0.08, 3]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[0.12, 0.18, 0]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.03, 0.08, 3]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          {/* Large eye circles (facial disc) */}
          {[-0.065, 0.065].map((x) => (
            <group key={x} position={[x, 0.03, 0.15]}>
              <mesh>
                <sphereGeometry args={[0.05, 16, 12]} />
                <meshStandardMaterial color={dark} />
              </mesh>
              <mesh position={[0, 0, 0.02]}>
                <sphereGeometry args={[0.035, 16, 12]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <sphereGeometry args={[0.02, 16, 12]} />
                <meshStandardMaterial color="#D68910" />
              </mesh>
              <mesh position={[0, 0, 0.05]}>
                <sphereGeometry args={[0.01, 12, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          ))}
          {/* Beak */}
          <mesh position={[0, -0.03, 0.19]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.02, 0.04, 3]} />
            <meshStandardMaterial color="#F9A825" />
          </mesh>
          {/* Owl has its own eyes, skip EyesMesh */}
          <MouthMesh expression={expression} />
        </group>
      );

    case "penguin":
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* White face patch */}
          <mesh position={[0, -0.02, 0.1]}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* Beak */}
          <mesh position={[0, -0.03, 0.19]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.025, 0.04, 3]} />
            <meshStandardMaterial color="#F97316" />
          </mesh>
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
        </group>
      );

    case "alien":
      return (
        <group position={[0, 0.58, 0]}>
          {/* Large egg head */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          {/* Antennae */}
          {[-0.06, 0.06].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.22, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.1, 8]} />
                <meshStandardMaterial color={dark} />
              </mesh>
              <mesh position={[x, 0.28, 0]}>
                <sphereGeometry args={[0.02, 12, 8]} />
                <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.6} />
              </mesh>
            </group>
          ))}
          {/* Large almond eyes */}
          {[-0.07, 0.07].map((x) => (
            <group key={x} position={[x, 0.03, 0.16]}>
              <mesh>
                <sphereGeometry args={[0.035, 16, 12]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              <mesh position={[x > 0 ? -0.008 : 0.008, 0.008, 0.01]}>
                <sphereGeometry args={[0.01, 12, 8]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
          <MouthMesh expression={expression} />
        </group>
      );

    case "robot":
      return (
        <group position={[0, 0.58, 0]}>
          {/* Boxy head */}
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.28, 0.26]} />
            <meshStandardMaterial color={col} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Antenna */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <sphereGeometry args={[0.02, 12, 8]} />
            <meshStandardMaterial color="#FF6B6B" emissive="#FF6B6B" emissiveIntensity={0.5} />
          </mesh>
          {/* Visor eyes */}
          <mesh position={[0, 0.03, 0.131]}>
            <boxGeometry args={[0.2, 0.06, 0.01]} />
            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.3} transparent opacity={0.8} />
          </mesh>
          {/* Eye dots on visor */}
          <mesh position={[-0.05, 0.03, 0.138]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.05, 0.03, 0.138]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
          </mesh>
          {/* Bolts */}
          {[-0.155, 0.155].map((x) => (
            <mesh key={x} position={[x, 0.03, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          {/* Mouth speaker grille */}
          <mesh position={[0, -0.06, 0.131]}>
            <boxGeometry args={[0.08, 0.03, 0.01]} />
            <meshStandardMaterial color={dark} />
          </mesh>
        </group>
      );

    case "ghost":
      return (
        <group position={[0, 0.55, 0]}>
          {/* Ghost head/body blend — teardrop shape */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={col} transparent opacity={0.85} />
          </mesh>
          {/* Body extension downward */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.15, 0.2, 12]} />
            <meshStandardMaterial color={col} transparent opacity={0.8} />
          </mesh>
          {/* Wavy bottom */}
          {[-0.1, -0.03, 0.04, 0.11].map((x, i) => (
            <mesh key={i} position={[x, -0.28, 0]}>
              <sphereGeometry args={[0.04, 12, 8]} />
              <meshStandardMaterial color={col} transparent opacity={0.7} />
            </mesh>
          ))}
          {/* Simple dot eyes */}
          <mesh position={[-0.06, 0.04, 0.19]}>
            <sphereGeometry args={[0.025, 16, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.06, 0.04, 0.19]}>
            <sphereGeometry args={[0.025, 16, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Small mouth */}
          <mesh position={[0, -0.04, 0.19]}>
            <sphereGeometry args={[0.015, 16, 12]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      );

    default: // fallback to cat
      return (
        <group position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 12]} />
            <meshStandardMaterial color={col} />
          </mesh>
          <EyesMesh eyeStyle={eyeStyle} expression={expression} />
          <MouthMesh expression={expression} />
        </group>
      );
  }
}

// --- Pattern overlay on body ---

function PatternOverlay({ pattern, bodyColor }: { pattern: string; bodyColor: string }) {
  const dark = darken(c(BODY_COLORS, bodyColor), 50);

  switch (pattern) {
    case "spots":
      return (
        <group>
          <mesh position={[-0.06, 0.35, 0.09]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[0.07, 0.28, 0.08]}>
            <sphereGeometry args={[0.02, 12, 8]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[0.02, 0.38, -0.07]}>
            <sphereGeometry args={[0.022, 12, 8]} />
            <meshStandardMaterial color={dark} />
          </mesh>
        </group>
      );
    case "stripes":
      return (
        <group>
          {[0.28, 0.33, 0.38].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.115, 0.006, 8, 16]} />
              <meshStandardMaterial color={dark} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

// --- Accessory meshes (adapted for creature heads) ---

function AccessoryMesh({ accessory }: { accessory: string }) {
  switch (accessory) {
    case "glasses":
      return (
        <group position={[0, 0.62, 0.17]}>
          <mesh position={[-0.06, 0, 0]}>
            <torusGeometry args={[0.035, 0.006, 8, 16]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0.06, 0, 0]}>
            <torusGeometry args={[0.035, 0.006, 8, 16]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0, 0, -0.005]}>
            <boxGeometry args={[0.05, 0.006, 0.006]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      );
    case "sunglasses":
      return (
        <group position={[0, 0.62, 0.18]}>
          <mesh position={[-0.06, 0, 0]}>
            <boxGeometry args={[0.07, 0.035, 0.015]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0.06, 0, 0]}>
            <boxGeometry args={[0.07, 0.035, 0.015]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0, 0, -0.005]}>
            <boxGeometry args={[0.05, 0.008, 0.008]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
        </group>
      );
    case "hat":
      return (
        <group position={[0, 0.78, 0]}>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.14, 16]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.165, 0.165, 0.02, 16]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
        </group>
      );
    case "beanie":
      return (
        <group position={[0, 0.74, 0]}>
          <mesh>
            <sphereGeometry args={[0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
        </group>
      );
    case "headband":
      return (
        <mesh position={[0, 0.68, 0]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.18, 0.012, 8, 16]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
      );
    case "bow":
      return (
        <group position={[-0.16, 0.7, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.02, 12, 8]} />
            <meshStandardMaterial color="#be123c" />
          </mesh>
          <mesh position={[-0.025, 0.01, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.04, 0.025, 0.015]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
          <mesh position={[0.025, 0.01, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.04, 0.025, 0.015]} />
            <meshStandardMaterial color="#FB7185" />
          </mesh>
        </group>
      );
    case "earrings":
      return (
        <group>
          <mesh position={[-0.18, 0.54, 0.04]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="#FBBF24" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.18, 0.54, 0.04]}>
            <sphereGeometry args={[0.015, 12, 8]} />
            <meshStandardMaterial color="#FBBF24" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      );
    case "necklace":
      return (
        <mesh position={[0, 0.44, 0.1]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.6} roughness={0.3} />
        </mesh>
      );
    default:
      return null;
  }
}

// --- Vehicle meshes (kept from original) ---

function VehicleMesh({ vehicle, outfitColor }: { vehicle: string; outfitColor: string }) {
  const color = c(OUTFITS, outfitColor);

  switch (vehicle) {
    case "bike":
      return (
        <group position={[0, -0.05, 0]}>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.22, -0.08]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.04, 0.22, 0.04]} />
            <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.32, 0.06]}>
            <boxGeometry args={[0.24, 0.02, 0.02]} />
            <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.28, -0.06]}>
            <boxGeometry args={[0.1, 0.03, 0.08]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0, 0.09, 0.14]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.09, 0.02, 8, 16]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0.09, -0.16]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.09, 0.02, 8, 16]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.06, 0.12, -0.02]}>
            <boxGeometry args={[0.06, 0.015, 0.03]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[-0.06, 0.12, -0.02]}>
            <boxGeometry args={[0.06, 0.015, 0.03]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      );
    case "car":
      return (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.4, 0.14, 0.7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.24, -0.04]} castShadow>
            <boxGeometry args={[0.34, 0.12, 0.36]} />
            <meshStandardMaterial color={color} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.24, 0.15]}>
            <boxGeometry args={[0.3, 0.1, 0.02]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0.24, -0.23]}>
            <boxGeometry args={[0.3, 0.1, 0.02]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
          </mesh>
          <mesh position={[-0.15, 0.14, 0.36]}>
            <sphereGeometry args={[0.03, 12, 8]} />
            <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.15, 0.14, 0.36]}>
            <sphereGeometry args={[0.03, 12, 8]} />
            <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-0.15, 0.14, -0.36]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.15, 0.14, -0.36]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.6} />
          </mesh>
          {[[-0.2, 0.06, 0.2], [0.2, 0.06, 0.2], [-0.2, 0.06, -0.22], [0.2, 0.06, -0.22]].map(([wx, wy, wz], i) => (
            <mesh key={i} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
              <meshStandardMaterial color="#27272A" />
            </mesh>
          ))}
        </group>
      );
    case "airplane":
      return (
        <group position={[0, 0.3, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.06, 0.7, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.38, 0]} castShadow>
            <coneGeometry args={[0.08, 0.12, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.28, 0.06]}>
            <sphereGeometry args={[0.04, 12, 8]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.03, 0.6, 0.15]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, -0.3, -0.05]} castShadow>
            <boxGeometry args={[0.02, 0.15, 0.1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, -0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.02, 0.2, 0.08]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.44, 0]}>
            <boxGeometry args={[0.25, 0.02, 0.02]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

// --- Main 3D Avatar ---

interface Avatar3DProps {
  config: AvatarConfig;
  isMoving?: boolean;
}

export default function Avatar3D({ config, isMoving }: Avatar3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Mesh>(null!);
  const rightArmRef = useRef<THREE.Mesh>(null!);
  const bodyRef = useRef<THREE.Group>(null!);

  const bodyColor = c(BODY_COLORS, config.hairColor);
  const outfitColor = c(OUTFITS, config.outfitColor);
  const isGhost = config.skinTone === "ghost";

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;

    if (isGhost) {
      const t = clock.elapsedTime * 2;
      bodyRef.current.position.y = Math.sin(t) * 0.04;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      return;
    }

    if (!leftLegRef.current || !rightLegRef.current || !leftArmRef.current || !rightArmRef.current) return;

    if (isMoving) {
      const t = clock.elapsedTime * 8;
      const swing = Math.sin(t) * 0.4;
      leftLegRef.current.rotation.x = swing;
      rightLegRef.current.rotation.x = -swing;
      leftArmRef.current.rotation.x = -swing * 0.6;
      rightArmRef.current.rotation.x = swing * 0.6;
      bodyRef.current.position.y = Math.abs(Math.sin(t)) * 0.02;
    } else {
      const t = clock.elapsedTime * 1.5;
      leftLegRef.current.rotation.x = 0;
      rightLegRef.current.rotation.x = 0;
      leftArmRef.current.rotation.x = 0;
      rightArmRef.current.rotation.x = 0;
      bodyRef.current.position.y = Math.sin(t) * 0.008;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Legs — hidden for ghost */}
      <group position={[-0.055, 0.12, 0]} visible={!isGhost}>
        <mesh ref={leftLegRef} position={[0, -0.06, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.06, 8, 16]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      </group>
      <group position={[0.055, 0.12, 0]} visible={!isGhost}>
        <mesh ref={rightLegRef} position={[0, -0.06, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.06, 8, 16]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      </group>

      {/* Shoes — hidden for ghost */}
      {!isGhost && (
        <>
          <mesh position={[-0.055, 0.025, 0.01]} castShadow>
            <sphereGeometry args={[0.04, 16, 12]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
          <mesh position={[0.055, 0.025, 0.01]} castShadow>
            <sphereGeometry args={[0.04, 16, 12]} />
            <meshStandardMaterial color="#27272A" />
          </mesh>
        </>
      )}

      {/* Invisible refs for ghost (to avoid null ref errors) */}
      {isGhost && (
        <>
          <mesh ref={leftLegRef} visible={false}><boxGeometry args={[0.01,0.01,0.01]} /></mesh>
          <mesh ref={rightLegRef} visible={false}><boxGeometry args={[0.01,0.01,0.01]} /></mesh>
        </>
      )}

      <group ref={bodyRef}>
        {/* Body — rounded bean shape */}
        <mesh position={[0, 0.33, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color={outfitColor} />
        </mesh>
        {/* Belly area (body color showing above outfit) */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Pattern overlay */}
        <PatternOverlay pattern={config.hairStyle} bodyColor={config.hairColor} />

        {/* Penguin white belly */}
        {config.skinTone === "penguin" && (
          <mesh position={[0, 0.33, 0.06]}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshStandardMaterial color="white" />
          </mesh>
        )}

        {/* Arms — rounded, pivot from shoulder */}
        <group position={[-0.14, 0.36, 0]}>
          <mesh ref={leftArmRef} position={[0, -0.06, 0]} castShadow>
            <capsuleGeometry args={[0.03, 0.08, 8, 16]} />
            <meshStandardMaterial color={outfitColor} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
        </group>
        <group position={[0.14, 0.36, 0]}>
          <mesh ref={rightArmRef} position={[0, -0.06, 0]} castShadow>
            <capsuleGeometry args={[0.03, 0.08, 8, 16]} />
            <meshStandardMaterial color={outfitColor} />
          </mesh>
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.04, 12]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Creature head */}
        <CreatureHead
          creature={config.skinTone}
          bodyColor={config.hairColor}
          eyeStyle={config.eyeColor}
          expression={config.expression}
        />

        {/* Accessory */}
        <AccessoryMesh accessory={config.accessory} />
      </group>

      {/* Vehicle */}
      {config.vehicle && config.vehicle !== "none" && (
        <VehicleMesh vehicle={config.vehicle} outfitColor={config.outfitColor} />
      )}
    </group>
  );
}
