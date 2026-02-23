"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface RaceResultDto {
  id: string;
  roomId: string;
  userId: string;
  lapCount: number;
  finishTime: number;
  won: boolean;
  createdAt: string;
}

export default function LeaderboardPage() {
  const { user, isLoaded } = useUser();
  const [results, setResults] = useState<RaceResultDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/race/leaderboard")
      .then((r) => r.json())
      .then((d) => setResults(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-yellow-500/30 border-t-yellow-500" />
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-yellow-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/[0.02] blur-[80px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/map" className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Map
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-lg font-bold">🏆 Leaderboard</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">🏆 Race Leaderboard</h1>
          <p className="mt-2 text-zinc-500">Fastest race times</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-yellow-500/30 border-t-yellow-500" />
          </div>
        ) : results.length === 0 ? (
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="p-8 text-center">
              <p className="text-4xl">🏁</p>
              <p className="mt-3 text-zinc-400">No race results yet. Be the first to race!</p>
              <Link href="/race" className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
                Start a race →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => (
              <Card key={r.id} className={`border-white/[0.06] ${i < 3 ? "bg-yellow-500/[0.02]" : "bg-white/[0.02]"}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-xl font-bold">
                    {i < 3 ? medals[i] : <span className="text-sm text-zinc-500">#{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {r.userId === user?.id ? "You" : r.userId.slice(0, 8) + "…"}
                      </p>
                      {r.won && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">WIN</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{r.lapCount} laps · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{r.finishTime.toFixed(2)}s</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
