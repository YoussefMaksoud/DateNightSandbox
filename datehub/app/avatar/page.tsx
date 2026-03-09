"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dice5 } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AvatarRenderer from "@/components/AvatarRenderer";
import Avatar3D from "@/components/map3d/Avatar3D";
import { AVATAR_OPTIONS } from "@/domain/value-objects";
import type { AvatarConfigProps, AvatarCategory } from "@/domain/value-objects/AvatarConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// --- Color maps for swatch categories ---

const BODY_COLORS: Record<string, string> = {
  coral: "#FF6B6B", mint: "#4ECDC4", lavender: "#B8A9E8",
  sky: "#74B9FF", peach: "#FFD093", lemon: "#F9E547",
  blush: "#FD79A8", sage: "#00B894", lilac: "#A29BFE",
  ocean: "#0984E3", cloud: "#DFE6E9",
};

const OUTFIT_COLORS: Record<string, string> = {
  rose: "#e11d48", blue: "#3B82F6", purple: "#8B5CF6", green: "#10B981",
  orange: "#F97316", red: "#DC2626", black: "#27272A", white: "#E4E4E7",
  pink: "#EC4899", teal: "#14B8A6",
};

const SWATCH_MAPS: Partial<Record<AvatarCategory, Record<string, string>>> = {
  hairColor: BODY_COLORS,
  outfitColor: OUTFIT_COLORS,
};

const CREATURE_EMOJI: Record<string, string> = {
  cat: "🐱", dog: "🐶", bunny: "🐰", bear: "🐻", frog: "🐸",
  fox: "🦊", owl: "🦉", penguin: "🐧", alien: "👽", robot: "🤖", ghost: "👻",
};

const CATEGORY_LABELS: Record<string, string> = {
  skinTone: "Creature",
  hairStyle: "Pattern",
  hairColor: "Body Color",
  eyeColor: "Eye Style",
  outfit: "Outfit",
  outfitColor: "Outfit Color",
  accessory: "Accessory",
  expression: "Expression",
  background: "Background",
  vehicle: "Vehicle",
};

const CATEGORY_ORDER: AvatarCategory[] = [
  "skinTone", "hairColor", "eyeColor", "hairStyle",
  "outfit", "outfitColor", "accessory", "expression", "background", "vehicle",
];

function toTitleCase(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const DEFAULT_CONFIG: AvatarConfigProps = {
  skinTone: "cat",
  hairStyle: "solid",
  hairColor: "coral",
  eyeColor: "round",
  outfit: "casual-tee",
  outfitColor: "rose",
  accessory: "none",
  expression: "smile",
  background: "none",
  vehicle: "none",
};

// --- API helpers ---

async function fetchAvatar(): Promise<AvatarConfigProps | null> {
  const res = await fetch("/api/avatar");
  if (!res.ok) return null;
  const data = await res.json();
  return data.avatar || null;
}

async function saveAvatar(config: AvatarConfigProps): Promise<boolean> {
  const res = await fetch("/api/avatar", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return res.ok;
}

// --- Component ---

export default function AvatarPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [config, setConfig] = useState<AvatarConfigProps>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load avatar on mount
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchAvatar().then((avatar) => {
      if (avatar) setConfig(avatar);
      setLoading(false);
    });
  }, [isLoaded, user]);

  // Persist on change (with save indicator)
  const persistConfig = useCallback(async (newConfig: AvatarConfigProps) => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    await saveAvatar(newConfig);

    setSaveStatus("saved");
    saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
  }, []);

  function handleOptionChange(category: AvatarCategory, value: string) {
    const updated = { ...config, [category]: value };
    setConfig(updated);
    persistConfig(updated);
  }

  function handleRandomize() {
    const randomConfig = {} as AvatarConfigProps;
    for (const key of CATEGORY_ORDER) {
      const options = AVATAR_OPTIONS[key];
      randomConfig[key] = options[Math.floor(Math.random() * options.length)];
    }
    setConfig(randomConfig);
    persistConfig(randomConfig);
  }

  function handleSaveAndGoBack() {
    router.push("/dashboard");
  }

  // --- Render ---

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
          <span className="text-sm text-zinc-500">Loading your experience…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-rose-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-purple-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] h-[40vh] w-[40vh] rounded-full bg-rose-600/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Date<span className="text-rose-400">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 sm:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-400">
                {user?.firstName || "You"}&apos;s date night
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-rose-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Your Creature
          </h1>
          <p className="mt-1 text-zinc-500">
            Pick your creature and make it yours — your partner will see this!
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
              <span className="text-sm text-zinc-500">Loading avatar…</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left column — Avatar preview (sticky) */}
            <div className="lg:w-[340px] lg:shrink-0">
              <div className="lg:sticky lg:top-8">
                <Card className="flex flex-col items-center p-8">
                  <CardContent className="flex flex-col items-center">
                    {/* 3D Avatar Preview */}
                    <div className="relative mb-4 w-full" style={{ height: 280 }}>
                      <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-rose-500/10 to-purple-500/10 blur-xl" />
                      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.06]">
                        <Canvas
                          camera={{ position: [0, 0.5, 2], fov: 45 }}
                          style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0c 100%)" }}
                        >
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[3, 4, 5]} intensity={1} />
                          <directionalLight position={[-2, 2, -1]} intensity={0.3} color="#ffd4a0" />
                          <group position={[0, -0.45, 0]}>
                            <Avatar3D config={config} />
                          </group>
                          <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI / 2}
                          />
                          {/* Ground disc */}
                          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
                            <circleGeometry args={[0.6, 24]} />
                            <meshStandardMaterial color="#1a1a2e" />
                          </mesh>
                        </Canvas>
                      </div>
                      <p className="mt-1 text-center text-[10px] text-zinc-600">Drag to rotate</p>
                    </div>

                    {/* Small 2D badge */}
                    <div className="mb-3 overflow-hidden rounded-full ring-1 ring-white/[0.08]">
                      <AvatarRenderer config={config} size={64} />
                    </div>

                    <h2 className="mb-1 text-lg font-semibold text-white">
                      {user?.firstName || "You"}
                    </h2>
                    <p className="mb-6 text-sm text-zinc-500">Looking great!</p>

                    {/* Save status */}
                    <div className="mb-4 flex h-5 items-center justify-center">
                      {saveStatus === "saving" && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <div className="h-3 w-3 animate-spin rounded-full border-[2px] border-rose-500/30 border-t-rose-500" />
                          Saving…
                        </div>
                      )}
                      {saveStatus === "saved" && (
                        <span className="animate-pulse text-xs text-emerald-400">
                          Saved ✓
                        </span>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={handleRandomize}
                      >
                        <Dice5 className="h-4 w-4" /> Randomize
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={handleSaveAndGoBack}
                      >
                        Save &amp; Go Back
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column — Customization categories */}
            <div className="min-w-0 flex-1 space-y-6">
              {CATEGORY_ORDER.map((category) => {
                const options = AVATAR_OPTIONS[category] as readonly string[];
                const swatchMap = SWATCH_MAPS[category];
                const selected = config[category];

                return (
                  <Card key={category}>
                    <CardContent>
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        {CATEGORY_LABELS[category]}
                      </h3>

                      {swatchMap ? (
                        /* Color swatch grid */
                        <div className="flex flex-wrap gap-3">
                          {options.map((option) => {
                            const isSelected = selected === option;
                            const color = swatchMap[option] || "#888";
                            return (
                              <button
                                key={option}
                                onClick={() => handleOptionChange(category, option)}
                                className={`group relative h-10 w-10 rounded-full transition-all duration-200 ${
                                  isSelected
                                    ? "ring-2 ring-rose-500 ring-offset-2 ring-offset-zinc-900 scale-110"
                                    : "hover:scale-110 hover:ring-1 hover:ring-white/20 hover:ring-offset-1 hover:ring-offset-zinc-900"
                                }`}
                                style={{ backgroundColor: color }}
                                title={toTitleCase(option)}
                              >
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="h-4 w-4 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Pill button grid */
                        <div className="flex flex-wrap gap-2">
                          {options.map((option) => {
                            const isSelected = selected === option;
                            return (
                              <button
                                key={option}
                                onClick={() => handleOptionChange(category, option)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                  isSelected
                                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                                    : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                                }`}
                              >
                                {category === "skinTone" && CREATURE_EMOJI[option]
                                  ? `${CREATURE_EMOJI[option]} ${toTitleCase(option)}`
                                  : toTitleCase(option)}
                              </button>
                            );
                          })}
                        </div>
                      )}
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
                  onClick={handleSaveAndGoBack}
                >
                  Save &amp; Go Back
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
