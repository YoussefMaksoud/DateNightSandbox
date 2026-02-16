"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Avatar3D from "@/components/map3d/Avatar3D";
import { VEHICLE_PARTS, PART_STATS } from "@/domain/value-objects";
import type { VehicleBuildConfigProps, VehiclePartCategory } from "@/domain/value-objects/VehicleBuildConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORY_ORDER: VehiclePartCategory[] = ["engine", "tires", "body", "spoiler", "nitro"];

const CATEGORY_LABELS: Record<VehiclePartCategory, string> = {
  engine: "Engine",
  tires: "Tires",
  body: "Body Kit",
  spoiler: "Spoiler",
  nitro: "Nitro System",
};

const CATEGORY_EMOJI: Record<VehiclePartCategory, string> = {
  engine: "⚙️",
  tires: "🛞",
  body: "🚗",
  spoiler: "🏎️",
  nitro: "🔥",
};

const DEFAULT_BUILD: VehicleBuildConfigProps = {
  engine: "stock",
  tires: "street",
  body: "sedan",
  spoiler: "none",
  nitro: "none",
};

function toTitleCase(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeStats(config: VehicleBuildConfigProps): { speed: number; weight: number; acceleration: number } {
  const base = { speed: 30, weight: 50, acceleration: 30 };
  for (const [cat, part] of Object.entries(config)) {
    const mods = PART_STATS[cat]?.[part];
    if (mods) {
      base.speed += mods.speed;
      base.weight += mods.weight;
      base.acceleration += mods.acceleration;
    }
  }
  return {
    speed: Math.max(0, Math.min(100, base.speed)),
    weight: Math.max(0, Math.min(100, base.weight)),
    acceleration: Math.max(0, Math.min(100, base.acceleration)),
  };
}

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">
          {icon} {label}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

function PartStatPreview({ category, option }: { category: string; option: string }) {
  const mods = PART_STATS[category]?.[option];
  if (!mods) return null;
  const entries = [
    { key: "SPD", val: mods.speed, color: "#3B82F6" },
    { key: "WGT", val: mods.weight, color: "#F97316" },
    { key: "ACC", val: mods.acceleration, color: "#22C55E" },
  ];
  const nonZero = entries.filter((e) => e.val !== 0);
  if (nonZero.length === 0) return <span className="text-[10px] text-zinc-600">Base</span>;
  return (
    <div className="flex gap-1.5">
      {nonZero.map((e) => (
        <span
          key={e.key}
          className="text-[10px] font-semibold"
          style={{ color: e.val > 0 ? e.color : "#ef4444" }}
        >
          {e.val > 0 ? "+" : ""}{e.val} {e.key}
        </span>
      ))}
    </div>
  );
}

async function fetchBuild(): Promise<VehicleBuildConfigProps | null> {
  const res = await fetch("/api/vehicle-build");
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.build) return null;
  const { stats, ...config } = data.build;
  return config;
}

async function saveBuild(config: VehicleBuildConfigProps): Promise<boolean> {
  const res = await fetch("/api/vehicle-build", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return res.ok;
}

export default function VehicleBuildPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [config, setConfig] = useState<VehicleBuildConfigProps>(DEFAULT_BUILD);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchBuild().then((build) => {
      if (build) setConfig(build);
      setLoading(false);
    });
  }, [isLoaded, user]);

  const persistConfig = useCallback(async (newConfig: VehicleBuildConfigProps) => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveBuild(newConfig);
    setSaveStatus("saved");
    saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
  }, []);

  function handleOptionChange(category: VehiclePartCategory, value: string) {
    const updated = { ...config, [category]: value };
    setConfig(updated);
    persistConfig(updated);
  }

  const stats = computeStats(config);

  const previewAvatarConfig = {
    skinTone: "cat",
    hairStyle: "solid",
    hairColor: "coral",
    eyeColor: "round",
    outfit: "casual-tee",
    outfitColor: "rose",
    accessory: "none",
    expression: "smile",
    background: "none",
    vehicle: "car",
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-orange-500/30 border-t-orange-500" />
          <span className="text-sm text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-orange-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-amber-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] h-[40vh] w-[40vh] rounded-full bg-orange-600/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
              <span className="text-lg">🔧</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Speed<span className="text-orange-400">Shop</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/map"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Map
        </Link>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Customize Your Ride 🏎️
          </h1>
          <p className="mt-1 text-zinc-500">
            Swap parts to tune your stats — upgrades apply during races!
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-orange-500/30 border-t-orange-500" />
              <span className="text-sm text-zinc-500">Loading your build…</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left column — Vehicle preview + stats (sticky) */}
            <div className="lg:w-[380px] lg:shrink-0">
              <div className="lg:sticky lg:top-8 space-y-5">
                {/* 3D Preview */}
                <Card>
                  <CardContent>
                    <div className="relative w-full" style={{ height: 260 }}>
                      <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 blur-xl" />
                      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.06]">
                        <Canvas
                          camera={{ position: [0.8, 0.4, 1.2], fov: 45 }}
                          style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0c 100%)" }}
                        >
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[3, 4, 5]} intensity={1} />
                          <directionalLight position={[-2, 2, -1]} intensity={0.3} color="#ffd4a0" />
                          <group position={[0, -0.2, 0]}>
                            <Avatar3D config={previewAvatarConfig} />
                          </group>
                          <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            minPolarAngle={Math.PI / 6}
                            maxPolarAngle={Math.PI / 2.2}
                          />
                          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
                            <circleGeometry args={[0.8, 24]} />
                            <meshStandardMaterial color="#1a1a2e" />
                          </mesh>
                        </Canvas>
                      </div>
                      <p className="mt-1 text-center text-[10px] text-zinc-600">Drag to rotate</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats panel */}
                <Card>
                  <CardContent>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                      Race Stats
                    </h3>
                    <div className="space-y-4">
                      <StatBar label="Speed" value={stats.speed} color="#3B82F6" icon="⚡" />
                      <StatBar label="Weight" value={stats.weight} color="#F97316" icon="⚖️" />
                      <StatBar label="Acceleration" value={stats.acceleration} color="#22C55E" icon="🚀" />
                    </div>
                    <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[11px] text-zinc-500">
                        💡 Stats only apply during races. Your overworld speed stays the same.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Save status + actions */}
                <Card>
                  <CardContent className="flex flex-col items-center gap-3">
                    <div className="flex h-5 items-center justify-center">
                      {saveStatus === "saving" && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <div className="h-3 w-3 animate-spin rounded-full border-[2px] border-orange-500/30 border-t-orange-500" />
                          Saving…
                        </div>
                      )}
                      {saveStatus === "saved" && (
                        <span className="animate-pulse text-xs text-emerald-400">Saved ✓</span>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push("/map")}
                    >
                      Back to Map
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column — Part categories */}
            <div className="min-w-0 flex-1 space-y-6">
              {CATEGORY_ORDER.map((category) => {
                const options = VEHICLE_PARTS[category] as readonly string[];
                const selected = config[category];

                return (
                  <Card key={category}>
                    <CardContent>
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        {CATEGORY_EMOJI[category]} {CATEGORY_LABELS[category]}
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {options.map((option) => {
                          const isSelected = selected === option;
                          return (
                            <button
                              key={option}
                              onClick={() => handleOptionChange(category, option)}
                              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                                isSelected
                                  ? "bg-orange-500/15 text-white ring-1 ring-orange-500/50"
                                  : "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                              }`}
                            >
                              <span className="text-sm font-medium">
                                {toTitleCase(option)}
                              </span>
                              <PartStatPreview category={category} option={option} />
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Bottom action bar (mobile) */}
              <div className="pb-8 lg:hidden">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => router.push("/map")}
                >
                  Back to Map
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
