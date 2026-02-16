"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import Environment3D from "./Environment3D";
import QuestBuilding3D from "./QuestBuilding3D";
import PlaceholderBuilding3D from "./PlaceholderBuilding3D";
import ScrapbookBuilding3D from "./ScrapbookBuilding3D";
import VehicleShopBuilding3D from "./VehicleShopBuilding3D";
import RaceFlag3D from "./RaceFlag3D";
import HomeworkBuilding3D from "./HomeworkBuilding3D";
import PaintingBuilding3D from "./PaintingBuilding3D";
import AvatarSprite3D from "./AvatarSprite3D";

// --- Types ---

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

interface Player {
  userId: string;
  x: number;
  y: number;
  avatar: AvatarConfig | null;
  updatedAt: string;
}

interface Quest {
  id: string;
  label: string;
  emoji: string;
  x: number;
  y: number;
  color: string;
  desc: string;
  pos3d: [number, number, number];
}

interface MapScene3DInnerProps {
  myPos: { x: number; z: number };
  onMove: (x: number, z: number) => void;
  myAvatar: AvatarConfig;
  myName: string;
  players: Player[];
  quests: Quest[];
  nearbyQuest: string | null;
  defaultAvatar: AvatarConfig;
}

// --- Coordinate conversion (2D 1200x800 → 3D centered world) ---

export function toWorld(x2d: number, y2d: number): [number, number] {
  return [(x2d - 600) / 20, (y2d - 400) / 20];
}

export function to2D(x3d: number, z3d: number): { x: number; y: number } {
  return { x: x3d * 20 + 600, y: z3d * 20 + 400 };
}

// --- Placeholder buildings data ---

const PLACEHOLDER_BUILDINGS = [
  { id: "pet",    label: "Pet Shop",    emoji: "🐾", pos: [5, 0, 10] as [number, number, number],  color: "#ef6c00" },
];

// --- Constants ---

const WALK_SPEED = 4;
const VEHICLE_SPEEDS: Record<string, number> = { none: 4, bike: 8, car: 12, airplane: 16 };
const WORLD_HALF_X = 22;
const WORLD_HALF_Z = 26;
const CAMERA_OFFSET = new THREE.Vector3(0, 10, 8);

// --- Player controller ---

function PlayerController({ myPos, onMove, myAvatar, myName }: {
  myPos: { x: number; z: number };
  onMove: (x: number, z: number) => void;
  myAvatar: AvatarConfig;
  myName: string;
}) {
  const posRef = useRef(new THREE.Vector3(myPos.x, 0, myPos.z));
  const movingRef = useRef(false);
  const facingRef = useRef(0);
  const avatarGroupRef = useRef<THREE.Group>(null!);
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();

  useEffect(() => {
    posRef.current.set(myPos.x, 0, myPos.z);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const { forward, backward, left, right } = getKeys() as {
      forward: boolean; backward: boolean; left: boolean; right: boolean;
    };

    let dx = 0;
    let dz = 0;
    if (forward) dz -= 1;
    if (backward) dz += 1;
    if (left) dx -= 1;
    if (right) dx += 1;

    const moving = dx !== 0 || dz !== 0;
    movingRef.current = moving;

    if (moving) {
      const speed = VEHICLE_SPEEDS[myAvatar.vehicle ?? "none"] ?? WALK_SPEED;
      const len = Math.sqrt(dx * dx + dz * dz);
      dx = (dx / len) * speed * delta;
      dz = (dz / len) * speed * delta;

      const newX = Math.max(-WORLD_HALF_X, Math.min(WORLD_HALF_X, posRef.current.x + dx));
      const newZ = Math.max(-WORLD_HALF_Z, Math.min(WORLD_HALF_Z, posRef.current.z + dz));
      posRef.current.set(newX, 0, newZ);
      onMove(newX, newZ);

      // Face movement direction
      facingRef.current = Math.atan2(dx, dz);
    }

    // Smooth rotation toward facing direction
    if (avatarGroupRef.current) {
      const cur = avatarGroupRef.current.rotation.y;
      const target = facingRef.current;
      let diff = target - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      avatarGroupRef.current.rotation.y = cur + diff * 8 * delta;
    }

    // Isometric follow-cam
    const target = posRef.current;
    const desiredCamPos = target.clone().add(CAMERA_OFFSET);
    camera.position.lerp(desiredCamPos, 4 * delta);
    camera.lookAt(target.x, 0, target.z);
  });

  return (
    <group position={[posRef.current.x, 0, posRef.current.z]} ref={avatarGroupRef}>
      <AvatarSprite3D
        position={[0, 0, 0]}
        config={myAvatar}
        label={myName}
        isCurrentUser
        isMoving={movingRef.current}
      />
    </group>
  );
}

// --- Inner scene (inside Canvas) ---

function MapScene3DInner({
  myPos,
  onMove,
  myAvatar,
  myName,
  players,
  quests,
  nearbyQuest,
  defaultAvatar,
}: MapScene3DInnerProps) {
  return (
    <>
      {/* Fog */}
      <fog attach="fog" args={["#1a2e1a", 25, 60]} />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#87CEEB", "#2d5a1e", 0.4]} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-8, 6, -4]} intensity={0.3} color="#ffd4a0" />

      {/* Environment */}
      <Environment3D />

      {/* Quest buildings (skip scrapbook — has its own building) */}
      {quests.filter((q) => q.id !== "scrapbook" && q.id !== "vehicle-shop" && q.id !== "race-start" && q.id !== "homework" && q.id !== "painting").map((q) => (
        <QuestBuilding3D
          key={q.id}
          position={q.pos3d}
          color={q.color}
          emoji={q.emoji}
          label={q.label}
          isNearby={nearbyQuest === q.id}
        />
      ))}

      {/* Placeholder buildings */}
      {PLACEHOLDER_BUILDINGS.map((b) => (
        <PlaceholderBuilding3D
          key={b.id}
          position={b.pos}
          color={b.color}
          emoji={b.emoji}
          label={b.label}
        />
      ))}

      {/* Scrapbook station (replaces Flower Shop) */}
      <ScrapbookBuilding3D
        position={[-5, 0, 10]}
        isNearby={nearbyQuest === "scrapbook"}
      />

      {/* Vehicle customization shop (along race track) */}
      <VehicleShopBuilding3D
        position={[14, 0, 2]}
        isNearby={nearbyQuest === "vehicle-shop"}
      />

      {/* Race start flag (on track near shop) */}
      <RaceFlag3D
        position={[12, 0, -3]}
        isNearby={nearbyQuest === "race-start"}
      />

      {/* Homework Night (replaces Bookshop) */}
      <HomeworkBuilding3D
        position={[5, 0, -1]}
        isNearby={nearbyQuest === "homework"}
      />

      {/* Paint Studio (replaces Café) */}
      <PaintingBuilding3D
        position={[-5, 0, -1]}
        isNearby={nearbyQuest === "painting"}
      />

      {/* Current player */}
      <PlayerController
        myPos={myPos}
        onMove={onMove}
        myAvatar={myAvatar}
        myName={myName}
      />

      {/* Other players */}
      {players.map((p) => {
        const [wx, wz] = toWorld(p.x, p.y);
        return (
          <AvatarSprite3D
            key={p.userId}
            position={[wx, 0, wz]}
            config={p.avatar || defaultAvatar}
            label="Player"
          />
        );
      })}
    </>
  );
}

// --- Keyboard map ---

export const KEYBOARD_MAP = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

export default MapScene3DInner;
