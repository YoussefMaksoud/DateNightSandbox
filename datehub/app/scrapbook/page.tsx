"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Scrapbook {
  id: string;
  name: string;
  coverUrl: string | null;
  createdBy: string;
  createdAt: string;
  pages: { id: string; pageNumber: number; items: unknown[] }[];
}

export default function ScrapbookListPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [scrapbooks, setScrapbooks] = useState<Scrapbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/scrapbook")
      .then((r) => r.json())
      .then((d) => { setScrapbooks(d.scrapbooks || []); setLoading(false); });
  }, [isLoaded, user]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/scrapbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const { scrapbook } = await res.json();
      router.push(`/scrapbook/${scrapbook.id}`);
    }
    setCreating(false);
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-pink-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-purple-500/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/map" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Date<span className="text-rose-400">Hub</span>
              </span>
            </Link>
            <span className="ml-1 rounded-full bg-pink-500/10 px-3 py-0.5 text-[11px] font-semibold text-pink-400">
              📔 Scrapbook Station
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/map"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06]"
            >
              🗺️ Back to Map
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Our Scrapbooks 📔</h1>
            <p className="mt-1 text-zinc-500">Collect memories together — add photos, stickers, and notes</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
            + New Scrapbook
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Name your scrapbook…"
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
                  autoFocus
                />
                <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? "Creating…" : "Create"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowCreate(false); setNewName(""); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
          </div>
        ) : scrapbooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl">📔</span>
            <h2 className="mt-4 text-xl font-semibold text-white">No scrapbooks yet</h2>
            <p className="mt-2 text-sm text-zinc-500">Create your first scrapbook to start collecting memories!</p>
            <Button variant="primary" size="sm" className="mt-6" onClick={() => setShowCreate(true)}>
              + Create First Scrapbook
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scrapbooks.map((sb) => (
              <button
                key={sb.id}
                onClick={() => router.push(`/scrapbook/${sb.id}`)}
                className="group text-left"
              >
                <Card className="transition-all duration-200 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/10">
                  <CardContent>
                    {/* Cover preview */}
                    <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-rose-900/30 to-purple-900/30 border border-white/[0.06]">
                      <span className="text-5xl opacity-60 group-hover:opacity-100 transition-opacity">📖</span>
                    </div>
                    <h3 className="text-base font-semibold text-white group-hover:text-rose-400 transition-colors">
                      {sb.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600">
                      {sb.pages.length} page{sb.pages.length !== 1 ? "s" : ""} ·{" "}
                      {new Date(sb.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
