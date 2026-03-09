"use client";

import { useEffect, useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Palette, ClipboardList, Paintbrush, Pin, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameRoom, GameRoomDto } from "@/hooks/useGameRoom";

function proxyUrl(url: string): string {
  return `/api/painting-session/image?url=${encodeURIComponent(url)}`;
}

interface PaintingSessionDto {
  id: string;
  userId: string;
  dateNightId: string | null;
  difficulty: string;
  theme: string;
  referenceUrl: string;
  palette: string[];
  status: string;
  createdAt: string;
}

const DIFFICULTIES = [
  { id: "beginner", label: "Beginner", emoji: "🌱", desc: "Simple shapes & bold colors" },
  { id: "intermediate", label: "Intermediate", emoji: "🎯", desc: "More detail & blending" },
  { id: "advanced", label: "Advanced", emoji: "🔥", desc: "Complex compositions" },
];

const THEMES = [
  { id: "landscape", label: "Landscape", emoji: "🏞️" },
  { id: "portrait", label: "Portrait", emoji: "🧑‍🎨" },
  { id: "still-life", label: "Still Life", emoji: "🍎" },
  { id: "abstract", label: "Abstract", emoji: "🌀" },
  { id: "floral", label: "Floral", emoji: "🌸" },
  { id: "sunset", label: "Sunset", emoji: "🌅" },
];

type View = "setup" | "lobby" | "countdown" | "painting" | "history";

export default function PaintingPage() {
  const [view, setView] = useState<View>("setup");
  const [difficulty, setDifficulty] = useState("beginner");
  const [theme, setTheme] = useState("landscape");
  const [session, setSession] = useState<PaintingSessionDto | null>(null);
  const [sessions, setSessions] = useState<PaintingSessionDto[]>([]);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [soloCreating, setSoloCreating] = useState(false);

  const {
    room, phase, countdown, creating, joining, error, isLoaded, userId,
    createRoom, joinRoom, readyUp, updateMetadata, resetRoom,
  } = useGameRoom("painting", {
    onGameStart: async (gameRoom: GameRoomDto) => {
      if (gameRoom.player1Id === userId) {
        const res = await fetch("/api/painting-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            difficulty: gameRoom.metadata.difficulty as string,
            theme: gameRoom.metadata.theme as string,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
          await updateMetadata({
            sessionId: data.session.id,
            referenceUrl: data.session.referenceUrl,
            palette: data.session.palette,
          });
        }
      } else {
        const poll = setInterval(async () => {
          const res = await fetch(`/api/room?roomId=${gameRoom.roomId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.room?.metadata?.referenceUrl) {
              clearInterval(poll);
              setSession({
                id: data.room.metadata.sessionId as string,
                userId: gameRoom.player1Id,
                dateNightId: null,
                difficulty: data.room.metadata.difficulty as string,
                theme: data.room.metadata.theme as string,
                referenceUrl: data.room.metadata.referenceUrl as string,
                palette: data.room.metadata.palette as string[],
                status: "active",
                createdAt: new Date().toISOString(),
              });
            }
          }
        }, 500);
      }
      setView("painting");
    },
  });

  // Sync phase → view for room-based flow
  useEffect(() => {
    if (phase === "lobby") setView("lobby");
    else if (phase === "countdown") setView("countdown");
  }, [phase]);

  const fetchSessions = useCallback(async () => {
    setLoadingHistory(true);
    const res = await fetch("/api/painting-session");
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions || []);
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (isLoaded && userId) fetchSessions();
  }, [isLoaded, userId, fetchSessions]);

  async function handleStartSolo() {
    setSoloCreating(true);
    const res = await fetch("/api/painting-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty, theme }),
    });
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setView("painting");
    }
    setSoloCreating(false);
  }

  async function handleCreateRoom() {
    const r = await createRoom({ difficulty, theme });
    if (r) {
      setView("lobby");
    }
  }

  async function handleJoinRoom() {
    if (!joinCode.trim()) return;
    const r = await joinRoom(joinCode.trim());
    if (r) {
      setView("lobby");
    }
  }

  async function handleUpdateStatus(status: "saved" | "completed") {
    if (!session) return;
    setSavingStatus("saving");
    const res = await fetch("/api/painting-session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, status }),
    });
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setSavingStatus("saved");
      await fetchSessions();
      if (status === "completed") {
        setTimeout(() => setView("setup"), 1500);
      }
    }
    setTimeout(() => setSavingStatus("idle"), 2000);
  }

  function handleViewSession(s: PaintingSessionDto) {
    setSession(s);
    setView("painting");
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple-500/30 border-t-purple-500" />
          <span className="text-sm text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-purple-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-violet-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] h-[40vh] w-[40vh] rounded-full bg-purple-600/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Paint<span className="text-purple-400">Studio</span>
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
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-purple-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Map
        </Link>

        {/* View tabs */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => { resetRoom(); setView("setup"); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              view === "setup" || view === "painting" || view === "lobby" || view === "countdown"
                ? "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Paintbrush className="h-4 w-4" /> New Session
          </button>
          <button
            onClick={() => { setView("history"); fetchSessions(); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              view === "history"
                ? "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Past Sessions ({sessions.length})
          </button>
        </div>

        {/* SETUP VIEW */}
        {view === "setup" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Paint Night
              </h1>
              <p className="mt-1 text-zinc-500">
                Choose your difficulty and theme, then start painting together!
              </p>
            </div>

            {/* Difficulty */}
            <Card>
              <CardContent>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Difficulty
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`flex flex-col rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                        difficulty === d.id
                          ? "bg-purple-500/15 text-white ring-1 ring-purple-500/50"
                          : "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {d.emoji} {d.label}
                      </span>
                      <span className="mt-0.5 text-[11px] text-zinc-500">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardContent>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Theme
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                        theme === t.id
                          ? "bg-purple-500/15 text-white ring-1 ring-purple-500/50"
                          : "bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Start Buttons */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Solo / Create Room */}
              <Card className="border-white/[0.06] bg-white/[0.02]">
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-lg font-semibold text-white">Start Painting</h2>
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={soloCreating}
                      onClick={handleStartSolo}
                      className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500 shadow-lg shadow-purple-500/25"
                    >
                      {soloCreating ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-[2px] border-white/30 border-t-white" />
                          Preparing canvas…
                        </div>
                      ) : (
                        <><Paintbrush className="h-4 w-4" /> Paint Solo</>
                      )}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={creating}
                      onClick={handleCreateRoom}
                      className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 focus:ring-violet-500"
                    >
                      {creating ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-[2px] border-white/30 border-t-white" />
                          Creating room…
                        </div>
                      ) : (
                        "Create Room"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card className="border-white/[0.06] bg-white/[0.02]">
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-lg font-semibold text-white">Join Room</h2>
                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">Room Code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Enter room code"
                      className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleJoinRoom}
                    disabled={joining || !joinCode.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500"
                  >
                    {joining ? "Joining…" : "Join Room"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {/* LOBBY VIEW */}
        {view === "lobby" && room && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Paint Lobby</h1>
              <p className="mt-2 text-zinc-500">Waiting for your partner to join</p>
            </div>

            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="space-y-6 p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">
                    Room: <span className="text-purple-400">{room.roomId}</span>
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">Share this code with your partner</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {THEMES.find((t) => t.id === (room.metadata.theme as string))?.emoji}{" "}
                    {(room.metadata.theme as string)?.replace("-", " ")} ·{" "}
                    {DIFFICULTIES.find((d) => d.id === (room.metadata.difficulty as string))?.emoji}{" "}
                    {room.metadata.difficulty as string}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Player 1 */}
                  <div
                    className={`rounded-xl border p-4 ${
                      room.player1Ready
                        ? "border-purple-500/30 bg-purple-500/5"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎨</span>
                      <div>
                        <p className="font-semibold text-white">
                          {room.player1Id === userId ? "You" : "Player 1"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {room.player1Ready ? "✅ Ready" : "⏳ Waiting"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div
                    className={`rounded-xl border p-4 ${
                      room.player2Ready
                        ? "border-violet-500/30 bg-violet-500/5"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{room.player2Id ? "🎨" : "❓"}</span>
                      <div>
                        <p className="font-semibold text-white">
                          {room.player2Id
                            ? room.player2Id === userId
                              ? "You"
                              : "Player 2"
                            : "Waiting for partner…"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {room.player2Id
                            ? room.player2Ready
                              ? "✅ Ready"
                              : "⏳ Waiting"
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {room.player2Id && (
                  <div className="text-center">
                    {((room.player1Id === userId && !room.player1Ready) ||
                      (room.player2Id === userId && !room.player2Ready)) ? (
                      <Button
                        onClick={readyUp}
                        className="bg-purple-600 px-8 hover:bg-purple-700"
                      >
                        Ready Up!
                      </Button>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        Waiting for both players to ready up…
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* COUNTDOWN VIEW */}
        {view === "countdown" && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div
                className="text-[120px] font-black transition-all"
                style={{
                  color: countdown === 0 ? "#A855F7" : "#ffffff",
                  textShadow:
                    countdown === 0
                      ? "0 0 60px #A855F7"
                      : "0 0 40px rgba(255,255,255,0.3)",
                  animation: "pulse 0.5s ease-in-out",
                }}
              >
                {countdown === 0 ? "GO!" : countdown}
              </div>
              <p className="mt-4 text-zinc-500">Get your brushes ready! 🖌️</p>
            </div>
          </div>
        )}

        {/* PAINTING VIEW */}
        {view === "painting" && session && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Your Reference Painting
                </h1>
                <p className="mt-1 text-zinc-500">
                  {THEMES.find((t) => t.id === session.theme)?.emoji}{" "}
                  {THEMES.find((t) => t.id === session.theme)?.label} ·{" "}
                  {DIFFICULTIES.find((d) => d.id === session.difficulty)?.emoji}{" "}
                  {DIFFICULTIES.find((d) => d.id === session.difficulty)?.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {session.status === "active" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Active
                  </span>
                )}
                {session.status === "saved" && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                    📌 Saved for later
                  </span>
                )}
                {session.status === "completed" && (
                  <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                    <CheckCircle className="h-3.5 w-3.5 inline" /> Completed
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Reference Image */}
              <div className="flex-1">
                <Card>
                  <CardContent>
                    <div className="relative overflow-hidden rounded-xl border border-white/[0.06]">
                      <img
                        src={proxyUrl(session.referenceUrl)}
                        alt="Reference painting"
                        className="w-full object-contain"
                        style={{ maxHeight: 500 }}
                      />
                    </div>
                    <p className="mt-3 text-center text-[11px] text-zinc-600">
                      Try to recreate this painting together — don&apos;t worry about perfection!
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar — Palette + Actions */}
              <div className="lg:w-[300px] lg:shrink-0">
                <div className="space-y-5 lg:sticky lg:top-8">
                  {/* Color Palette */}
                  <Card>
                    <CardContent>
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        Color Palette
                      </h3>
                      <p className="mb-3 text-[11px] text-zinc-600">
                        These are the main colors used — try to match them!
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {session.palette.map((color, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <div
                              className="h-12 w-full rounded-lg border border-white/[0.08] shadow-inner"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[10px] font-mono text-zinc-500">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Session Info */}
                  <Card>
                    <CardContent>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        Session Info
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Started</span>
                          <span className="text-zinc-300">
                            {new Date(session.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Theme</span>
                          <span className="text-zinc-300 capitalize">{session.theme.replace("-", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Difficulty</span>
                          <span className="text-zinc-300 capitalize">{session.difficulty}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  {session.status === "active" && (
                    <Card>
                      <CardContent className="space-y-3">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500"
                          disabled={savingStatus === "saving"}
                          onClick={() => handleUpdateStatus("saved")}
                        >
                          {savingStatus === "saving" ? (
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 animate-spin rounded-full border-[2px] border-white/30 border-t-white" />
                              Saving…
                            </div>
                          ) : (
                            <><Pin className="h-4 w-4" /> Save for Later</>
                          )}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500"
                          disabled={savingStatus === "saving"}
                          onClick={() => handleUpdateStatus("completed")}
                        >
                          <><CheckCircle className="h-4 w-4" /> Mark Complete</>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => { setSession(null); resetRoom(); setView("setup"); }}
                        >
                          <><ArrowLeft className="h-4 w-4" /> New Session</>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {session.status !== "active" && (
                    <Card>
                      <CardContent>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => { setSession(null); resetRoom(); setView("setup"); }}
                        >
                          <><ArrowLeft className="h-4 w-4" /> Start New Session</>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {savingStatus === "saved" && (
                    <div className="flex items-center justify-center">
                      <span className="animate-pulse text-xs text-emerald-400">Saved ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === "history" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Past Paint Sessions
              </h1>
              <p className="mt-1 text-zinc-500">
                View your previous painting date nights
              </p>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-purple-500/30 border-t-purple-500" />
                  <span className="text-sm text-zinc-500">Loading sessions…</span>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <Palette className="mb-3 h-10 w-10 text-zinc-500" />
                  <p className="text-sm text-zinc-400">No painting sessions yet!</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                    onClick={() => setView("setup")}
                  >
                    Start Your First Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((s) => (
                  <Card key={s.id} hoverable>
                    <CardContent>
                      <button
                        className="w-full text-left"
                        onClick={() => handleViewSession(s)}
                      >
                        <div className="relative mb-3 overflow-hidden rounded-lg border border-white/[0.06]" style={{ height: 160 }}>
                          <img
                            src={proxyUrl(s.referenceUrl)}
                            alt="Reference"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute right-2 top-2">
                            {s.status === "active" && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
                                Active
                              </span>
                            )}
                            {s.status === "saved" && (
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-sm">
                                Saved
                              </span>
                            )}
                            {s.status === "completed" && (
                              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400 backdrop-blur-sm">
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white capitalize">
                              {THEMES.find((t) => t.id === s.theme)?.emoji} {s.theme.replace("-", " ")}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {DIFFICULTIES.find((d) => d.id === s.difficulty)?.emoji} {s.difficulty} ·{" "}
                              {new Date(s.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {s.palette.slice(0, 4).map((c, i) => (
                              <div
                                key={i}
                                className="h-4 w-4 rounded-full border border-white/10"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
