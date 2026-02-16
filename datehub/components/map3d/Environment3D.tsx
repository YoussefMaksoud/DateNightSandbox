"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- All building positions (quest + placeholder) for avoidance ---

const ALL_BUILDING_POSITIONS: [number, number][] = [
  [-5, -6], [5, -6],   // Music Lounge, Movie Night
  [-5, -1], [5, -1],   // Café, Bookshop
  [-5, 5],  [5, 5],    // Game Arcade, Kitchen
  [-5, 10], [5, 10],   // Flower Shop, Pet Shop
  [0, -12], [0, 13],   // Trivia Tower, Cozy Corner
];

// Village area bounding box — the cobblestone zone
const VILLAGE_MIN_X = -8;
const VILLAGE_MAX_X = 8;
const VILLAGE_MIN_Z = -14;
const VILLAGE_MAX_Z = 15;

// Path segments: [centerX, centerZ, halfX, halfZ]
const PATH_BOXES: [number, number, number, number][] = [
  // Main north-south avenue
  [0, 0, 2, 16],
  // West sidewalk
  [-3.5, 1, 1.2, 14],
  // East sidewalk
  [3.5, 1, 1.2, 14],
  // Cross streets
  [0, -9, 8, 1.2],
  [0, -3.5, 8, 1.2],
  [0, 2, 8, 1.2],
  [0, 7.5, 8, 1.2],
  [0, 11.5, 8, 1.2],
];

function isNearBuilding(x: number, z: number, radius = 3): boolean {
  return ALL_BUILDING_POSITIONS.some(([bx, bz]) => (x - bx) ** 2 + (z - bz) ** 2 < radius * radius);
}

function isInVillage(x: number, z: number, margin = 1): boolean {
  return x > VILLAGE_MIN_X - margin && x < VILLAGE_MAX_X + margin &&
         z > VILLAGE_MIN_Z - margin && z < VILLAGE_MAX_Z + margin;
}

function isOnPath(x: number, z: number, margin = 0.5): boolean {
  return PATH_BOXES.some(([px, pz, hx, hz]) =>
    Math.abs(x - px) < hx + margin && Math.abs(z - pz) < hz + margin
  );
}

function isOnTrack(x: number, z: number, margin = 2.5): boolean {
  const cx = 0, cz = 1;
  const rx = 13, rz = 21;
  const d = Math.sqrt(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2);
  return Math.abs(d - 1.0) < margin / Math.min(rx, rz);
}

// Scatter points OUTSIDE the village (for forest border)
function scatterForest(count: number, rangeX: number, rangeZ: number, seed: number, minDist = 2): [number, number][] {
  const pts: [number, number][] = [];
  let s = seed;
  while (pts.length < count) {
    s = (s * 16807 + 7) % 2147483647;
    const x = ((s / 2147483647) - 0.5) * rangeX;
    s = (s * 16807 + 7) % 2147483647;
    const z = ((s / 2147483647) - 0.5) * rangeZ;
    if (!isInVillage(x, z, minDist) && !isOnTrack(x, z)) pts.push([x, z]);
  }
  return pts;
}

// Scatter points INSIDE the village, avoiding buildings and paths (for planters, benches, etc.)
function scatterVillage(count: number, seed: number, buildingClear = 2.5): [number, number][] {
  const pts: [number, number][] = [];
  let s = seed;
  while (pts.length < count) {
    s = (s * 16807 + 7) % 2147483647;
    const x = VILLAGE_MIN_X + (s / 2147483647) * (VILLAGE_MAX_X - VILLAGE_MIN_X);
    s = (s * 16807 + 7) % 2147483647;
    const z = VILLAGE_MIN_Z + (s / 2147483647) * (VILLAGE_MAX_Z - VILLAGE_MIN_Z);
    if (!isNearBuilding(x, z, buildingClear) && !isOnPath(x, z, 1)) pts.push([x, z]);
  }
  return pts;
}

function seededRange(seed: number, index: number, min: number, max: number): number {
  let s = (seed + index * 16807 + 13) % 2147483647;
  s = (s * 48271) % 2147483647;
  return min + (s / 2147483647) * (max - min);
}

// --- Trees (forest border around village) ---

function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const bottomRef = useRef<THREE.InstancedMesh>(null!);
  const midRef = useRef<THREE.InstancedMesh>(null!);
  const topRef = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => scatterForest(50, 50, 44, 42, 1.5), []);

  const PALETTE = [
    "#2e7d32", "#388e3c", "#43a047", "#1b5e20", "#33691e",
    "#4caf50", "#558b2f", "#3e8e41", "#2a6e2e", "#4a8c50",
  ];

  useEffect(() => {
    const d = new THREE.Object3D();
    positions.forEach(([x, z], i) => {
      const scale = seededRange(42, i, 0.7, 1.3);
      const trunkH = 0.5 + 0.4 * scale;

      d.position.set(x, trunkH / 2, z);
      d.scale.set(scale, scale, scale);
      d.rotation.set(0, seededRange(42, i + 200, 0, Math.PI * 2), 0);
      d.updateMatrix();
      trunkRef.current.setMatrixAt(i, d.matrix);

      const bottomY = trunkH + 0.25 * scale;
      d.position.set(x, bottomY, z);
      d.scale.set(scale * 1.1, scale * 0.85, scale * 1.1);
      d.updateMatrix();
      bottomRef.current.setMatrixAt(i, d.matrix);
      bottomRef.current.setColorAt(i, new THREE.Color(PALETTE[i % PALETTE.length]));

      const ox = seededRange(42, i + 50, -0.12, 0.12) * scale;
      const oz = seededRange(42, i + 80, -0.12, 0.12) * scale;
      const midY = bottomY + 0.45 * scale;
      d.position.set(x + ox, midY, z + oz);
      d.scale.set(scale * 0.9, scale * 0.75, scale * 0.9);
      d.updateMatrix();
      midRef.current.setMatrixAt(i, d.matrix);
      midRef.current.setColorAt(i, new THREE.Color(PALETTE[(i + 3) % PALETTE.length]));

      const topY = midY + 0.35 * scale;
      d.position.set(x - ox * 0.5, topY, z - oz * 0.5);
      d.scale.set(scale * 0.6, scale * 0.55, scale * 0.6);
      d.updateMatrix();
      topRef.current.setMatrixAt(i, d.matrix);
      topRef.current.setColorAt(i, new THREE.Color(PALETTE[(i + 6) % PALETTE.length]));
    });
    [trunkRef, bottomRef, midRef, topRef].forEach((ref) => {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    });
  }, [positions]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, positions.length]} castShadow>
        <cylinderGeometry args={[0.06, 0.13, 0.9, 16]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bottomRef} args={[undefined, undefined, positions.length]} castShadow>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={midRef} args={[undefined, undefined, positions.length]} castShadow>
        <sphereGeometry args={[0.48, 16, 12]} />
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={topRef} args={[undefined, undefined, positions.length]} castShadow>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </>
  );
}

// --- Hedges (line the village streets) ---

function Hedges() {
  // Hedge rows along the west and east building edges, and village entrance/exit
  const hedgePositions: { pos: [number, number, number]; scale: [number, number, number] }[] = [
    // West edge
    { pos: [-7.2, 0.25, -6], scale: [0.4, 0.5, 1.8] },
    { pos: [-7.2, 0.25, -1], scale: [0.4, 0.5, 1.8] },
    { pos: [-7.2, 0.25, 5], scale: [0.4, 0.5, 1.8] },
    { pos: [-7.2, 0.25, 10], scale: [0.4, 0.5, 1.8] },
    // East edge
    { pos: [7.2, 0.25, -6], scale: [0.4, 0.5, 1.8] },
    { pos: [7.2, 0.25, -1], scale: [0.4, 0.5, 1.8] },
    { pos: [7.2, 0.25, 5], scale: [0.4, 0.5, 1.8] },
    { pos: [7.2, 0.25, 10], scale: [0.4, 0.5, 1.8] },
    // North entrance flanking
    { pos: [-2.5, 0.25, -14], scale: [1.5, 0.5, 0.4] },
    { pos: [2.5, 0.25, -14], scale: [1.5, 0.5, 0.4] },
    // South entrance flanking
    { pos: [-2.5, 0.25, 15], scale: [1.5, 0.5, 0.4] },
    { pos: [2.5, 0.25, 15], scale: [1.5, 0.5, 0.4] },
  ];

  return (
    <group>
      {hedgePositions.map((h, i) => (
        <mesh key={i} position={h.pos} scale={h.scale} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#2e7d32" : "#1b5e20"} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// --- Bushes (village garden accents) ---

function Bushes() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => scatterVillage(14, 99, 2.2), []);

  useEffect(() => {
    const d = new THREE.Object3D();
    const colors = ["#1a4a1a", "#1d5a22", "#22662e", "#194e1c"];
    positions.forEach(([x, z], i) => {
      const s = seededRange(99, i, 0.4, 0.8);
      d.position.set(x, 0.12 * s, z);
      d.scale.set(s, s * 0.65, s);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
      ref.current.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow>
      <sphereGeometry args={[0.35, 16, 12]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

// --- Flower planters near buildings ---

function Planters() {
  // Small flower box + flowers beside building doors
  const spots: { pos: [number, number, number]; flowerColor: string }[] = [
    { pos: [-3.8, 0, -6], flowerColor: "#e11d48" },
    { pos: [3.8, 0, -6], flowerColor: "#8B5CF6" },
    { pos: [-3.8, 0, -1], flowerColor: "#FBBF24" },
    { pos: [3.8, 0, -1], flowerColor: "#3B82F6" },
    { pos: [-3.8, 0, 5], flowerColor: "#EC4899" },
    { pos: [3.8, 0, 5], flowerColor: "#10B981" },
    { pos: [-3.8, 0, 10], flowerColor: "#f472b6" },
    { pos: [3.8, 0, 10], flowerColor: "#fb923c" },
  ];

  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={s.pos}>
          {/* Box */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.5, 0.24, 0.3]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} />
          </mesh>
          {/* Soil */}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.44, 0.04, 0.24]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          {/* Flowers — 3 little spheres */}
          {[-0.12, 0, 0.12].map((fx, fi) => (
            <mesh key={fi} position={[fx, 0.34, 0]}>
              <sphereGeometry args={[0.06, 12, 8]} />
              <meshStandardMaterial color={s.flowerColor} emissive={s.flowerColor} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// --- Benches along the main avenue ---

function Benches() {
  const spots: [number, number, number][] = [
    [-1.8, 0, -5], [1.8, 0, -5],
    [-1.8, 0, 3], [1.8, 0, 3],
    [-1.8, 0, 9], [1.8, 0, 9],
  ];

  return (
    <group>
      {spots.map((pos, i) => (
        <group key={i} position={pos} rotation={[0, i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          {/* Seat plank */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.7, 0.04, 0.25]} />
            <meshStandardMaterial color="#6d4c41" roughness={0.85} />
          </mesh>
          {/* Back rest */}
          <mesh position={[0, 0.38, -0.1]} castShadow>
            <boxGeometry args={[0.7, 0.2, 0.04]} />
            <meshStandardMaterial color="#5d4037" roughness={0.85} />
          </mesh>
          {/* Legs */}
          {[-0.28, 0.28].map((lx, li) => (
            <mesh key={li} position={[lx, 0.1, 0]} castShadow>
              <boxGeometry args={[0.04, 0.2, 0.25]} />
              <meshStandardMaterial color="#4e342e" metalness={0.2} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// --- Fountain (town square centerpiece) ---

function Fountain() {
  const waterRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const mat = waterRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 1.2) * 0.08;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base pool — octagonal look */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[1.6, 1.8, 0.16, 24]} />
        <meshStandardMaterial color="#78909c" roughness={0.6} />
      </mesh>
      {/* Inner pool rim */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[1.4, 1.5, 0.06, 24]} />
        <meshStandardMaterial color="#607d8b" roughness={0.5} />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <circleGeometry args={[1.35, 32]} />
        <meshStandardMaterial color="#1a6e8e" emissive="#1a6e8e" emissiveIntensity={0.2} roughness={0.15} metalness={0.1} transparent opacity={0.9} />
      </mesh>
      {/* Center pillar */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.8, 16]} />
        <meshStandardMaterial color="#90a4ae" roughness={0.5} />
      </mesh>
      {/* Top bowl */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#78909c" roughness={0.5} />
      </mesh>
      {/* Spout tip */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color="#b0bec5" emissive="#90caf9" emissiveIntensity={0.3} />
      </mesh>
      {/* Subtle water light */}
      <pointLight position={[0, 0.3, 0]} color="#4fc3f7" intensity={0.5} distance={4} decay={2} />
    </group>
  );
}

// --- Signposts at key junctions ---

function Signposts() {
  const posts: { pos: [number, number, number]; labels: string[] }[] = [
    { pos: [-1.5, 0, -9], labels: ["🧩 ↑", "🎵 ←", "🎬 →"] },
    { pos: [1.5, 0, 7.5], labels: ["💬 ↓", "🎮 ←", "🍳 →"] },
  ];

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={p.pos}>
          {/* Post */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1, 12]} />
            <meshStandardMaterial color="#5d4037" roughness={0.8} />
          </mesh>
          {/* Sign boards */}
          {p.labels.map((label, li) => (
            <group key={li} position={[0.2, 0.85 - li * 0.22, 0]} rotation={[0, -0.3 + li * 0.3, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.4, 0.14, 0.03]} />
                <meshStandardMaterial color="#6d4c41" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={[0.36, 0.1, 0.01]} />
                <meshStandardMaterial color="#efebe9" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// --- Village streets (cobblestone grid) ---

function Streets() {
  const segments: { pos: [number, number, number]; size: [number, number, number] }[] = [
    // Main north-south avenue (wide)
    { pos: [0, 0.015, 0], size: [3.5, 0.03, 30] },
    // West sidewalk
    { pos: [-3.5, 0.015, 0.5], size: [2, 0.03, 27] },
    // East sidewalk
    { pos: [3.5, 0.015, 0.5], size: [2, 0.03, 27] },
    // Cross streets
    { pos: [0, 0.015, -9], size: [16, 0.03, 2] },
    { pos: [0, 0.015, -3.5], size: [16, 0.03, 2] },
    { pos: [0, 0.015, 2], size: [16, 0.03, 2] },
    { pos: [0, 0.015, 7.5], size: [16, 0.03, 2] },
    { pos: [0, 0.015, 11.5], size: [16, 0.03, 2] },
  ];

  return (
    <group>
      {segments.map((seg, i) => (
        <group key={i}>
          {/* Border */}
          <mesh position={seg.pos} receiveShadow>
            <boxGeometry args={[seg.size[0] + 0.3, 0.01, seg.size[2] + 0.3]} />
            <meshStandardMaterial color="#2d2218" />
          </mesh>
          {/* Surface */}
          <mesh position={[seg.pos[0], seg.pos[1] + 0.005, seg.pos[2]]} receiveShadow>
            <boxGeometry args={seg.size} />
            <meshStandardMaterial color="#4a3d2e" />
          </mesh>
        </group>
      ))}
      {/* Town square plaza — wider circular area at center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <circleGeometry args={[3.2, 32]} />
        <meshStandardMaterial color="#5d4e3e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.027, 0]}>
        <ringGeometry args={[2.8, 3.2, 32]} />
        <meshStandardMaterial color="#3e3428" />
      </mesh>
    </group>
  );
}

// --- Lanterns (along village streets) ---

function Lantern({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + position[0] * 0.5;
    const flicker = 0.85 + Math.sin(t * 3.2) * 0.08 + Math.sin(t * 7.1) * 0.04 + Math.sin(t * 1.3) * 0.03;
    lightRef.current.intensity = 1.2 * flicker;
    const mat = glowRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.5 * flicker;
    glowRef.current.scale.setScalar(0.9 + flicker * 0.15);
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.06, 16]} />
        <meshStandardMaterial color="#3e3428" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 1.0, 12]} />
        <meshStandardMaterial color="#4a3c2e" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.055, 0.015, 12, 16]} />
        <meshStandardMaterial color="#6b5a42" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.15, 1.12, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.35, 12]} />
        <meshStandardMaterial color="#4a3c2e" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0.28, 1.22, 0]} castShadow>
        <coneGeometry args={[0.1, 0.08, 16]} />
        <meshStandardMaterial color="#5c4a36" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.28, 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.16, 16, 1, true]} />
        <meshStandardMaterial color="#6b5a42" metalness={0.4} roughness={0.5} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.28, 1.04, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 12]} />
        <meshStandardMaterial color="#5c4a36" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={glowRef} position={[0.28, 1.12, 0]}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshStandardMaterial color="#FBBF24" emissive="#ff9800" emissiveIntensity={1.5} transparent opacity={0.9} />
      </mesh>
      <pointLight ref={lightRef} position={[0.28, 1.12, 0]} color="#ffb74d" intensity={1.2} distance={5} decay={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.01, 0]}>
        <circleGeometry args={[0.8, 24]} />
        <meshStandardMaterial color="#ffb74d" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

function Lanterns() {
  const lampPositions: [number, number, number][] = [
    // Along main avenue (alternating sides)
    [-1.5, 0, -11], [1.5, 0, -7.5], [-1.5, 0, -5],
    [1.5, 0, -2], [-1.5, 0, 1], [1.5, 0, 4],
    [-1.5, 0, 6.5], [1.5, 0, 9.5], [-1.5, 0, 12],
  ];

  return (
    <group>
      {lampPositions.map((pos, i) => (
        <Lantern key={i} position={pos} />
      ))}
    </group>
  );
}

// --- Flowers (scattered in green areas outside village) ---

function Flowers() {
  const petalRef = useRef<THREE.InstancedMesh>(null!);
  const centerRef = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => scatterForest(30, 46, 40, 177, 0.5), []);

  useEffect(() => {
    const d = new THREE.Object3D();
    const colors = ["#e11d48", "#FBBF24", "#EC4899", "#8B5CF6", "#fb923c", "#f472b6"];
    positions.forEach(([x, z], i) => {
      d.position.set(x, 0.06, z);
      d.scale.set(1, 1, 1);
      d.updateMatrix();
      petalRef.current.setMatrixAt(i, d.matrix);
      petalRef.current.setColorAt(i, new THREE.Color(colors[i % colors.length]));
      d.position.set(x, 0.09, z);
      d.scale.set(0.5, 0.5, 0.5);
      d.updateMatrix();
      centerRef.current.setMatrixAt(i, d.matrix);
    });
    petalRef.current.instanceMatrix.needsUpdate = true;
    centerRef.current.instanceMatrix.needsUpdate = true;
    if (petalRef.current.instanceColor) petalRef.current.instanceColor.needsUpdate = true;
  }, [positions]);

  return (
    <>
      <instancedMesh ref={petalRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial />
      </instancedMesh>
      <instancedMesh ref={centerRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} />
      </instancedMesh>
    </>
  );
}

// --- Rocks ---

function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => scatterForest(12, 44, 38, 311, 0.5), []);

  useEffect(() => {
    const d = new THREE.Object3D();
    const colors = ["#4a4a4a", "#3a3a3a", "#555555", "#484848"];
    positions.forEach(([x, z], i) => {
      const s = seededRange(311, i, 0.6, 1.2);
      d.position.set(x, 0.05 * s, z);
      d.scale.set(0.25 * s, 0.12 * s, 0.25 * s);
      d.rotation.set(0, seededRange(311, i + 100, 0, Math.PI), 0);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
      ref.current.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
}

// --- Pond (small park area south-east) ---

function Pond() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
  });

  return (
    <group position={[10, 0, 12]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial color="#3d5c1e" />
      </mesh>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial color="#1a6e8e" emissive="#1a6e8e" emissiveIntensity={0.15} roughness={0.2} metalness={0.1} />
      </mesh>
      {[[0.5, 0.4], [-0.6, -0.3], [0.1, -0.7]].map(([lx, lz], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.035, lz]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#2d7a2d" />
        </mesh>
      ))}
    </group>
  );
}

// --- Decorative crates & barrels ---

function Props() {
  const spots: { pos: [number, number, number]; type: "barrel" | "crate" }[] = [
    { pos: [-6.8, 0, -4], type: "barrel" },
    { pos: [6.8, 0, -4], type: "crate" },
    { pos: [-6.8, 0, 7.5], type: "crate" },
    { pos: [6.8, 0, 7.5], type: "barrel" },
    { pos: [-6.6, 0, -8.5], type: "barrel" },
    { pos: [6.6, 0, 2.5], type: "crate" },
  ];

  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={s.pos}>
          {s.type === "barrel" ? (
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.2, 0.5, 16]} />
              <meshStandardMaterial color="#5d4037" roughness={0.9} />
            </mesh>
          ) : (
            <mesh position={[0, 0.18, 0]} rotation={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.35, 0.35, 0.35]} />
              <meshStandardMaterial color="#6d4c41" roughness={0.85} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// --- Race Track (oval loop around the village) ---

function buildTrackGeo(curve: THREE.CatmullRomCurve3, halfWidth: number, segments: number, y: number): THREE.BufferGeometry {
  const verts: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const left = point.clone().add(normal.clone().multiplyScalar(halfWidth));
    const right = point.clone().add(normal.clone().multiplyScalar(-halfWidth));
    verts.push(left.x, y, left.z);
    verts.push(right.x, y, right.z);
    uvs.push(0, t);
    uvs.push(1, t);
    if (i < segments) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function RaceTrack() {
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(12, 0, -16),
      new THREE.Vector3(14, 0, 0),
      new THREE.Vector3(12, 0, 17),
      new THREE.Vector3(0, 0, 22),
      new THREE.Vector3(-12, 0, 17),
      new THREE.Vector3(-14, 0, 0),
      new THREE.Vector3(-12, 0, -16),
      new THREE.Vector3(0, 0, -20),
    ];
    return new THREE.CatmullRomCurve3(points, true, "centripetal", 0.5);
  }, []);

  const trackGeo = useMemo(() => buildTrackGeo(curve, 1.8, 200, 0.03), [curve]);
  const lineGeo = useMemo(() => buildTrackGeo(curve, 0.05, 200, 0.04), [curve]);
  const leftCurbGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      pts.push(p.clone().add(n.clone().multiplyScalar(1.8)));
    }
    const c = new THREE.CatmullRomCurve3(pts, true);
    return buildTrackGeo(c, 0.1, 200, 0.04);
  }, [curve]);
  const rightCurbGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      pts.push(p.clone().add(n.clone().multiplyScalar(-1.8)));
    }
    const c = new THREE.CatmullRomCurve3(pts, true);
    return buildTrackGeo(c, 0.1, 200, 0.04);
  }, [curve]);

  return (
    <group>
      <mesh geometry={trackGeo} receiveShadow>
        <meshStandardMaterial color="#333340" roughness={0.85} />
      </mesh>
      <mesh geometry={lineGeo}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>
      <mesh geometry={leftCurbGeo}>
        <meshStandardMaterial color="#cc3333" />
      </mesh>
      <mesh geometry={rightCurbGeo}>
        <meshStandardMaterial color="#cc3333" />
      </mesh>
    </group>
  );
}

// --- Main Environment ---

export default function Environment3D() {
  return (
    <group>
      {/* Ground — large green plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2d5a1e" />
      </mesh>

      {/* Village ground area — slightly lighter grass within village bounds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0.5]} receiveShadow>
        <planeGeometry args={[18, 32]} />
        <meshStandardMaterial color="#336b22" />
      </mesh>

      <Streets />
      <Fountain />
      <Trees />
      <Hedges />
      <Bushes />
      <Flowers />
      <Rocks />
      <Planters />
      <Benches />
      <Signposts />
      <Lanterns />
      <Pond />
      <Props />
      <RaceTrack />
    </group>
  );
}
