"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import MapScene3DInner, { toWorld, to2D, KEYBOARD_MAP } from "@/components/map3d/MapScene3D";

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

// --- Constants ---

const POLL_INTERVAL = 2000;
const INTERACT_RADIUS_3D = 3.5;

const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: "cat", hairStyle: "solid", hairColor: "coral",
  eyeColor: "round", outfit: "casual-tee", outfitColor: "rose",
  accessory: "none", expression: "smile", background: "none",
  vehicle: "none",
};

const QUESTS_2D = [
  { id: "music", label: "Music Lounge",  emoji: "🎵", x: 500, y: 280, color: "#e11d48", desc: "Listen to music together" },
  { id: "movie", label: "Movie Night",   emoji: "🎬", x: 700, y: 280, color: "#8B5CF6", desc: "Watch something together" },
  { id: "game",  label: "Game Arcade",   emoji: "🎮", x: 500, y: 500, color: "#3B82F6", desc: "Play games together" },
  { id: "cook",  label: "Kitchen",       emoji: "🍳", x: 700, y: 500, color: "#10B981", desc: "Cook a meal together" },
  { id: "quiz",  label: "Trivia Tower",  emoji: "🧩", x: 600, y: 160, color: "#F97316", desc: "Test your knowledge" },
  { id: "chat",  label: "Cozy Corner",   emoji: "💬", x: 600, y: 660, color: "#EC4899", desc: "Just talk & hang out" },
  { id: "scrapbook", label: "Scrapbook Station", emoji: "📔", x: 500, y: 600, color: "#e91e63", desc: "Create scrapbooks together" },
  { id: "vehicle-shop", label: "Speed Shop", emoji: "🔧", x: 880, y: 440, color: "#E67E22", desc: "Customize your vehicle" },
  { id: "race-start", label: "Start Race", emoji: "🏁", x: 840, y: 340, color: "#22C55E", desc: "Race around the track!" },
  { id: "homework", label: "Homework Night", emoji: "🎓", x: 700, y: 380, color: "#1565c0", desc: "Study together with screen share" },
  { id: "painting", label: "Paint Studio", emoji: "🎨", x: 500, y: 380, color: "#9C27B0", desc: "Paint together on a date night" },
];

const QUESTS = QUESTS_2D.map((q) => {
  const [wx, wz] = toWorld(q.x, q.y);
  return { ...q, pos3d: [wx, 0, wz] as [number, number, number] };
});

// --- API helpers ---

async function fetchPlayers(): Promise<Player[]> {
  const res = await fetch("/api/map/position");
  if (!res.ok) return [];
  const data = await res.json();
  return data.players || [];
}

async function updatePosition(x: number, y: number): Promise<void> {
  await fetch("/api/map/position", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y }),
  });
}

async function fetchMyAvatar(): Promise<AvatarConfig> {
  const res = await fetch("/api/avatar");
  if (!res.ok) return DEFAULT_AVATAR;
  const data = await res.json();
  return data.avatar || DEFAULT_AVATAR;
}

// --- Main ---

export default function MapPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [myAvatar, setMyAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [myPos3D, setMyPos3D] = useState({ x: 0, z: 0 });
  const [players, setPlayers] = useState<Player[]>([]);
  const [nearbyQuest, setNearbyQuest] = useState<string | null>(null);
  const [showQuestPrompt, setShowQuestPrompt] = useState<typeof QUESTS[number] | null>(null);
  const [loaded, setLoaded] = useState(false);

  const myPosRef = useRef(myPos3D);
  const lastSyncRef = useRef({ x: 0, z: 0 });

  // Init
  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([fetchMyAvatar(), fetchPlayers()]).then(([avatar, allPlayers]) => {
      setMyAvatar(avatar);
      const me = allPlayers.find((p) => p.userId === user.id);
      if (me) {
        const [wx, wz] = toWorld(me.x, me.y);
        setMyPos3D({ x: wx, z: wz });
        myPosRef.current = { x: wx, z: wz };
        const pos2d = to2D(wx, wz);
        lastSyncRef.current = { x: pos2d.x, z: pos2d.y };
      }
      setPlayers(allPlayers.filter((p) => p.userId !== user.id));
      setLoaded(true);
    });
  }, [isLoaded, user]);

  // Handle movement from the 3D controller
  const handleMove = useCallback((x: number, z: number) => {
    myPosRef.current = { x, z };
    setMyPos3D({ x, z });
  }, []);

  // Sync position to server
  useEffect(() => {
    const interval = setInterval(() => {
      const cur = myPosRef.current;
      const pos2d = to2D(cur.x, cur.z);
      const last = lastSyncRef.current;
      if ((pos2d.x - last.x) ** 2 + (pos2d.y - last.z) ** 2 > 4) {
        updatePosition(pos2d.x, pos2d.y);
        lastSyncRef.current = { x: pos2d.x, z: pos2d.y };
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Poll other players
  useEffect(() => {
    if (!isLoaded || !user) return;
    const interval = setInterval(async () => {
      const allPlayers = await fetchPlayers();
      setPlayers(allPlayers.filter((p) => p.userId !== user.id));
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isLoaded, user]);

  // Quest proximity
  useEffect(() => {
    let nearest: typeof QUESTS[number] | null = null;
    let nearestDist = Infinity;
    for (const q of QUESTS) {
      const dx = myPos3D.x - q.pos3d[0];
      const dz = myPos3D.z - q.pos3d[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < INTERACT_RADIUS_3D && dist < nearestDist) {
        nearest = q;
        nearestDist = dist;
      }
    }
    setNearbyQuest(nearest?.id ?? null);
    if (nearest) setShowQuestPrompt(nearest);
    else setShowQuestPrompt(null);
  }, [myPos3D]);

  if (!isLoaded || !loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
          <span className="text-sm text-zinc-500">Entering the world…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060808]">
      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#0a0c0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Date<span className="text-rose-400">Hub</span>
              </span>
            </Link>
            <span className="ml-1 rounded-full bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-400">
              🗺️ World Map
            </span>
          </div>
          <div className="flex items-center gap-3">
            {players.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs text-zinc-400">
                  {players.length} other{players.length !== 1 ? "s" : ""} online
                </span>
              </div>
            )}
            <Link
              href="/avatar"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06]"
            >
              😊 Avatar
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* 3D viewport */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <KeyboardControls map={KEYBOARD_MAP}>
          <Canvas
            shadows
            camera={{ position: [0, 10, 8], fov: 55, near: 0.1, far: 100 }}
            style={{ background: "#1a2e1a", width: "100%", height: "100%" }}
          >
            <MapScene3DInner
              myPos={myPos3D}
              onMove={handleMove}
              myAvatar={myAvatar}
              myName={user?.firstName || "You"}
              players={players}
              quests={QUESTS}
              nearbyQuest={nearbyQuest}
              defaultAvatar={DEFAULT_AVATAR}
            />
          </Canvas>
        </KeyboardControls>

        {/* Quest prompt overlay */}
        {showQuestPrompt && (
          <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
            <div
              className="flex items-center gap-4 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-xl"
              style={{
                borderColor: showQuestPrompt.color + "30",
                backgroundColor: "rgba(10,12,10,0.92)",
                boxShadow: `0 8px 40px ${showQuestPrompt.color}15`,
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: showQuestPrompt.color + "18" }}
              >
                <span className="text-xl">{showQuestPrompt.emoji}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{showQuestPrompt.label}</p>
                <p className="text-xs text-zinc-500">{showQuestPrompt.desc}</p>
              </div>
              <button
                className="ml-3 rounded-full px-5 py-2 text-sm font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: showQuestPrompt.color,
                  color: "white",
                  boxShadow: `0 4px 20px ${showQuestPrompt.color}40`,
                }}
                onClick={() => {
                  if (showQuestPrompt.id === "scrapbook") {
                    router.push("/scrapbook");
                  } else if (showQuestPrompt.id === "vehicle-shop") {
                    router.push("/vehicle-build");
                  } else if (showQuestPrompt.id === "homework") {
                    router.push("/homework");
                  } else if (showQuestPrompt.id === "painting") {
                    router.push("/painting");
                  } else {
                    alert(`Starting ${showQuestPrompt.label}! (Coming soon)`);
                  }
                }}
              >
                Enter
              </button>
            </div>
          </div>
        )}

        {/* Quest legend */}
        <div className="absolute bottom-5 right-5 z-20 rounded-xl border border-white/[0.06] bg-[#0a0c0a]/80 p-3 backdrop-blur-xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Quests</p>
          <div className="space-y-1.5">
            {QUESTS.map((q) => (
              <div key={q.id} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: q.color }} />
                <span className="text-[11px] text-zinc-500">{q.emoji} {q.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-5 left-5 z-20 rounded-xl border border-white/[0.06] bg-[#0a0c0a]/80 px-3 py-2 backdrop-blur-xl">
          <p className="text-[11px] text-zinc-600">
            WASD / Arrow keys to move · Walk to a quest to interact
          </p>
        </div>
      </div>
    </div>
  );
}
