"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// --- Types ---

interface ScrapbookItem {
  id: string;
  pageId: string;
  type: "photo" | "sticker" | "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

interface ScrapbookPage {
  id: string;
  pageNumber: number;
  backgroundColor: string;
  items: ScrapbookItem[];
}

interface Scrapbook {
  id: string;
  name: string;
  pages: ScrapbookPage[];
}

// --- Sticker library ---

const STICKERS = [
  "❤️", "💕", "💖", "💗", "🩷", "💘", "💝", "💌",
  "⭐", "✨", "🌟", "💫", "🌈", "☀️", "🌙", "⚡",
  "🌸", "🌹", "🌺", "🌻", "🌷", "🌼", "🪻", "💐",
  "🦋", "🐾", "🎀", "🎁", "🎂", "🍰", "🧁", "🍪",
  "📸", "🎵", "🎶", "🎤", "🕯️", "💎", "👑", "🔥",
  "💋", "💑", "🫶", "🤗", "😘", "🥰", "😍", "🫧",
];

const PAGE_COLORS = [
  { name: "Cream", value: "#FFF8F0" },
  { name: "Blush", value: "#FFF0F5" },
  { name: "Lavender", value: "#F0F0FF" },
  { name: "Mint", value: "#F0FFF4" },
  { name: "Sky", value: "#F0F8FF" },
  { name: "Peach", value: "#FFF5EE" },
  { name: "Lemon", value: "#FFFFF0" },
  { name: "White", value: "#FFFFFF" },
];

// --- Sync interval ---

const POLL_INTERVAL = 2000;

// --- Component ---

export default function ScrapbookEditorPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const scrapbookId = params.id as string;

  const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"stickers" | "text" | null>(null);
  const [dragging, setDragging] = useState<{ itemId: string; offsetX: number; offsetY: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch scrapbook data
  const fetchScrapbook = useCallback(async () => {
    const res = await fetch(`/api/scrapbook/${scrapbookId}`);
    if (!res.ok) return;
    const data = await res.json();
    setScrapbook(data.scrapbook);
  }, [scrapbookId]);

  // Init
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchScrapbook().then(() => setLoading(false));
  }, [isLoaded, user, fetchScrapbook]);

  // Polling sync for collaborative editing
  useEffect(() => {
    if (!isLoaded || !user || loading) return;
    const interval = setInterval(fetchScrapbook, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isLoaded, user, loading, fetchScrapbook]);

  const currentPage = scrapbook?.pages[currentPageIdx] ?? null;

  // --- Actions ---

  async function addSticker(emoji: string) {
    if (!currentPage) return;
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: currentPage.id,
        type: "sticker",
        content: emoji,
        x: 200 + Math.random() * 200,
        y: 150 + Math.random() * 200,
        width: 60,
        height: 60,
        rotation: (Math.random() - 0.5) * 30,
        zIndex: (currentPage.items.length || 0) + 1,
      }),
    });
    await fetchScrapbook();
  }

  async function addText() {
    if (!currentPage) return;
    const text = prompt("Enter your text:");
    if (!text) return;
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: currentPage.id,
        type: "text",
        content: text,
        x: 150 + Math.random() * 200,
        y: 150 + Math.random() * 200,
        width: 180,
        height: 40,
        zIndex: (currentPage.items.length || 0) + 1,
      }),
    });
    await fetchScrapbook();
    setActivePanel(null);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentPage) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/scrapbook/upload", { method: "POST", body: formData });

    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      await fetch(`/api/scrapbook/${scrapbookId}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: currentPage.id,
          type: "photo",
          content: url,
          x: 150 + Math.random() * 100,
          y: 100 + Math.random() * 100,
          width: 200,
          height: 200,
          rotation: (Math.random() - 0.5) * 10,
          zIndex: (currentPage.items.length || 0) + 1,
        }),
      });
      await fetchScrapbook();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addPage() {
    if (!scrapbook) return;
    const nextNum = scrapbook.pages.length + 1;
    await fetch(`/api/scrapbook/${scrapbookId}/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageNumber: nextNum }),
    });
    await fetchScrapbook();
    setCurrentPageIdx(nextNum - 1);
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/scrapbook/${scrapbookId}/item/${itemId}`, { method: "DELETE" });
    await fetchScrapbook();
  }

  async function updateItemPosition(itemId: string, x: number, y: number) {
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, x, y }),
    });
  }

  // --- Drag handling ---

  function handleMouseDown(e: React.MouseEvent, item: ScrapbookItem) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 500 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    setDragging({ itemId: item.id, offsetX: mouseX - item.x, offsetY: mouseY - item.y });
    e.preventDefault();
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !canvasRef.current || !scrapbook) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 500 / rect.height;
    const newX = Math.max(0, Math.min(600, (e.clientX - rect.left) * scaleX - dragging.offsetX));
    const newY = Math.max(0, Math.min(500, (e.clientY - rect.top) * scaleY - dragging.offsetY));

    // Optimistic local update
    setScrapbook((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) => ({
          ...p,
          items: p.items.map((it) =>
            it.id === dragging.itemId ? { ...it, x: newX, y: newY } : it
          ),
        })),
      };
    });
  }

  function handleMouseUp() {
    if (!dragging || !scrapbook) return;
    const item = scrapbook.pages
      .flatMap((p) => p.items)
      .find((it) => it.id === dragging.itemId);
    if (item) updateItemPosition(dragging.itemId, item.x, item.y);
    setDragging(null);
  }

  // --- Render ---

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
      </div>
    );
  }

  if (!scrapbook) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] text-white">
        <span className="text-4xl">😢</span>
        <p className="mt-4 text-zinc-400">Scrapbook not found</p>
        <Link href="/scrapbook" className="mt-4 text-rose-400 hover:underline">← Back</Link>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#0a0a0c]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0c0a]/90 px-4 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href="/scrapbook" className="text-zinc-500 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">📔 {scrapbook.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">
            Page {currentPageIdx + 1} of {scrapbook.pages.length}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="flex w-14 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0a0c0a]/80 py-3">
          <ToolButton icon="📸" label="Photo" onClick={() => fileInputRef.current?.click()} active={uploading} />
          <ToolButton
            icon="😀"
            label="Stickers"
            onClick={() => setActivePanel(activePanel === "stickers" ? null : "stickers")}
            active={activePanel === "stickers"}
          />
          <ToolButton
            icon="✏️"
            label="Text"
            onClick={addText}
            active={false}
          />
          <div className="my-2 h-px w-8 bg-white/[0.06]" />
          <ToolButton icon="📄" label="Add Page" onClick={addPage} active={false} />
        </div>

        {/* Side panel (stickers) */}
        {activePanel === "stickers" && (
          <div className="w-56 overflow-y-auto border-r border-white/[0.06] bg-[#0a0c0a]/80 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Stickers</p>
            <div className="grid grid-cols-4 gap-1.5">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  onClick={() => addSticker(s)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-2xl transition-all hover:scale-110 hover:bg-white/[0.08] active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas area */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-auto bg-zinc-950/50 p-4">
          {/* Page navigation */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setCurrentPageIdx(Math.max(0, currentPageIdx - 1))}
              disabled={currentPageIdx === 0}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-30"
            >
              ← Prev
            </button>
            {scrapbook.pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setCurrentPageIdx(i)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                  i === currentPageIdx
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08]"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPageIdx(Math.min(scrapbook.pages.length - 1, currentPageIdx + 1))}
              disabled={currentPageIdx >= scrapbook.pages.length - 1}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>

          {/* Scrapbook page canvas */}
          {currentPage && (
            <div
              ref={canvasRef}
              className="relative select-none overflow-hidden rounded-lg shadow-2xl shadow-black/40"
              style={{
                width: "min(90vw, 600px)",
                aspectRatio: "6/5",
                backgroundColor: currentPage.backgroundColor,
                cursor: dragging ? "grabbing" : "default",
              }}
            >
              {/* Page texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 19px, #00000015 20px)",
                }}
              />

              {/* Items */}
              {currentPage.items
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((item) => (
                  <div
                    key={item.id}
                    className="group absolute"
                    style={{
                      left: `${(item.x / 600) * 100}%`,
                      top: `${(item.y / 500) * 100}%`,
                      width: `${(item.width / 600) * 100}%`,
                      height: `${(item.height / 500) * 100}%`,
                      transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
                      zIndex: item.zIndex,
                      cursor: dragging?.itemId === item.id ? "grabbing" : "grab",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                  >
                    {item.type === "sticker" && (
                      <div className="flex h-full w-full items-center justify-center text-4xl select-none">
                        {item.content}
                      </div>
                    )}
                    {item.type === "photo" && (
                      <img
                        src={item.content}
                        alt=""
                        className="h-full w-full rounded-sm object-cover shadow-md"
                        style={{ border: "3px solid white", boxShadow: "2px 2px 8px rgba(0,0,0,0.15)" }}
                        draggable={false}
                      />
                    )}
                    {item.type === "text" && (
                      <div
                        className="flex h-full w-full items-center justify-center px-2 text-center text-sm font-medium"
                        style={{ color: "#4a3728", fontFamily: "'Georgia', serif" }}
                      >
                        {item.content}
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-md group-hover:flex"
                    >
                      ×
                    </button>
                  </div>
                ))}

              {/* Empty state */}
              {currentPage.items.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-30">
                  <span className="text-5xl">📔</span>
                  <p className="mt-3 text-sm text-zinc-600 font-medium">
                    Add photos, stickers & text to this page
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Page color picker */}
          {currentPage && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Page color:</span>
              {PAGE_COLORS.map((pc) => (
                <button
                  key={pc.value}
                  onClick={async () => {
                    // Optimistic update
                    setScrapbook((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        pages: prev.pages.map((p, i) =>
                          i === currentPageIdx ? { ...p, backgroundColor: pc.value } : p
                        ),
                      };
                    });
                  }}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${
                    currentPage.backgroundColor === pc.value
                      ? "border-rose-500 scale-110"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  style={{ backgroundColor: pc.value }}
                  title={pc.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Uploading overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-900 p-8 shadow-2xl">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
            <p className="text-sm text-zinc-400">Uploading photo…</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Toolbar button ---

function ToolButton({ icon, label, onClick, active }: {
  icon: string; label: string; onClick: () => void; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-lg transition-all ${
        active
          ? "bg-rose-500/20 text-white"
          : "text-zinc-500 hover:bg-white/[0.06] hover:text-white"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
