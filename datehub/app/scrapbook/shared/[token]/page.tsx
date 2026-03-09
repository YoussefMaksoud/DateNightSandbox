"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";

// --- Types ---

interface ScrapbookItem {
  id: string;
  type: "photo" | "sticker" | "text" | "drawing";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  createdBy: string;
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

// --- Constants ---

const CANVAS_W = 600;
const CANVAS_H = 500;

// --- Content parsers ---

function safeParseTextContent(content: string): { text: string; font: string; color: string; size: number; border: string; align: string } {
  try {
    const parsed = JSON.parse(content);
    return {
      text: parsed.text ?? content,
      font: parsed.font ?? "'Georgia', serif",
      color: parsed.color ?? "#4a3728",
      size: parsed.size ?? 14,
      border: parsed.border ?? "none",
      align: parsed.align ?? "center",
    };
  } catch {
    return { text: content, font: "'Georgia', serif", color: "#4a3728", size: 14, border: "none", align: "center" };
  }
}

function safeParsePhotoContent(content: string): { url: string; frame: string } {
  try {
    const parsed = JSON.parse(content);
    return { url: parsed.url ?? content, frame: parsed.frame ?? "none" };
  } catch {
    return { url: content, frame: "none" };
  }
}

function safeParseDrawingContent(content: string): { paths: string[]; color: string; width: number } {
  try {
    const parsed = JSON.parse(content);
    return {
      paths: parsed.paths ?? [],
      color: parsed.color ?? "#000000",
      width: parsed.width ?? 2,
    };
  } catch {
    return { paths: [], color: "#000000", width: 2 };
  }
}

// --- Component ---

export default function SharedScrapbookPage() {
  const params = useParams();
  const token = params.token as string;

  const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchScrapbook() {
      try {
        const res = await fetch(`/api/scrapbook/shared/${token}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setScrapbook(data.scrapbook);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    fetchScrapbook();
  }, [token]);

  const currentPage = scrapbook?.pages[currentPageIdx] ?? null;

  // --- Loading ---

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
      </div>
    );
  }

  // --- Not found ---

  if (notFound || !scrapbook) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] text-white overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/[0.04] blur-[120px]" />
        <BookOpen className="h-14 w-14" />
        <p className="mt-6 text-xl font-semibold text-zinc-300">Scrapbook not found</p>
        <p className="mt-2 text-sm text-zinc-500">This link may have expired or the scrapbook may no longer be shared.</p>
      </div>
    );
  }

  // --- Main view ---

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0c] overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-rose-500/[0.03] blur-[150px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-pink-500/[0.03] blur-[130px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/[0.02] blur-[100px]" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0c0a]/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <h1 className="text-lg font-bold text-white"><BookOpen className="h-5 w-5 inline" /> {scrapbook.name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            Page {currentPageIdx + 1} of {scrapbook.pages.length}
          </span>
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-400 border border-rose-500/20">
            Made with DateHub
          </span>
        </div>
      </header>

      {/* Canvas area */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        {/* Page navigation */}
        {scrapbook.pages.length > 1 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setCurrentPageIdx(Math.max(0, currentPageIdx - 1))}
              disabled={currentPageIdx === 0}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
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
              className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Next →
            </button>
          </div>
        )}

        {/* Scrapbook page canvas */}
        {currentPage && (
          <div
            className="relative overflow-hidden rounded-lg shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]"
            style={{
              width: "min(90vw, 600px)",
              aspectRatio: "6/5",
              backgroundColor: currentPage.backgroundColor,
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
                <ReadOnlyItem key={item.id} item={item} />
              ))}

            {/* Empty state */}
            {currentPage.items.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-30">
                <BookOpen className="h-12 w-12" />
                <p className="mt-3 text-sm font-medium text-zinc-600">
                  This page is empty
                </p>
              </div>
            )}
          </div>
        )}

        {/* Page counter for single-page scrapbooks */}
        {scrapbook.pages.length === 1 && (
          <p className="mt-4 text-xs text-zinc-600">Page 1 of 1</p>
        )}
      </div>
    </div>
  );
}

// --- Read-only item renderer ---

function ReadOnlyItem({ item }: { item: ScrapbookItem }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${(item.x / CANVAS_W) * 100}%`,
        top: `${(item.y / CANVAS_H) * 100}%`,
        width: `${(item.width / CANVAS_W) * 100}%`,
        height: `${(item.height / CANVAS_H) * 100}%`,
        transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: item.zIndex,
      }}
    >
      {item.type === "sticker" && <StickerItem content={item.content} />}
      {item.type === "photo" && <PhotoItem content={item.content} />}
      {item.type === "text" && <TextItem content={item.content} />}
      {item.type === "drawing" && <DrawingItem content={item.content} />}
    </div>
  );
}

// --- Sticker ---

function StickerItem({ content }: { content: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-4xl select-none">
      {content}
    </div>
  );
}

// --- Photo with frame styles ---

function PhotoItem({ content }: { content: string }) {
  const { url, frame } = safeParsePhotoContent(content);

  if (frame === "polaroid") {
    return (
      <div className="flex h-full w-full flex-col items-center rounded-sm bg-white p-1 pb-4 shadow-lg">
        <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>
    );
  }

  if (frame === "tape") {
    return (
      <div className="relative h-full w-full">
        <img src={url} alt="" className="h-full w-full rounded-sm object-cover" draggable={false} />
        <div className="absolute -left-2 -top-1 h-4 w-10 rotate-[-15deg] rounded-sm bg-yellow-200/70 shadow-sm" />
        <div className="absolute -bottom-1 -right-2 h-4 w-10 rotate-[10deg] rounded-sm bg-yellow-200/70 shadow-sm" />
      </div>
    );
  }

  if (frame === "shadow") {
    return (
      <img
        src={url}
        alt=""
        className="h-full w-full rounded-md object-cover shadow-xl shadow-black/30"
        draggable={false}
      />
    );
  }

  // none
  return (
    <img
      src={url}
      alt=""
      className="h-full w-full rounded-sm object-cover"
      style={{ border: "3px solid white", boxShadow: "2px 2px 8px rgba(0,0,0,0.15)" }}
      draggable={false}
    />
  );
}

// --- Text ---

function TextItem({ content }: { content: string }) {
  const { text, font, color, size, border, align } = safeParseTextContent(content);

  const borderStyles: Record<string, React.CSSProperties> = {
    none: {},
    doodle: { border: "3px dashed #f9a8d4", borderRadius: "12px", padding: "8px" },
    scallop: { border: "3px solid #c084fc", borderRadius: "20px", padding: "8px", boxShadow: "inset 0 0 0 2px #e9d5ff, inset 0 0 0 4px #c084fc" },
    ribbon: { border: "2px solid #fbbf24", borderRadius: "4px", padding: "8px", background: "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)" },
    heartbox: { border: "3px solid #fb7185", borderRadius: "16px", padding: "10px", boxShadow: "0 0 0 2px #ffe4e6, 0 4px 12px rgba(251,113,133,0.2)" },
    stamp: { border: "3px dashed #64748b", borderRadius: "2px", padding: "10px", outline: "2px solid #64748b", outlineOffset: "3px" },
    notebook: { borderBottom: "2px solid #93c5fd", borderLeft: "3px solid #f87171", padding: "8px 8px 8px 14px", background: "repeating-linear-gradient(transparent, transparent 27px, #e2e8f0 27px, #e2e8f0 28px)" },
    postcard: { border: "2px solid #d4b896", borderRadius: "4px", padding: "10px", background: "linear-gradient(to bottom right, rgba(212,184,150,0.1) 0%, rgba(255,248,240,0.3) 100%)", boxShadow: "2px 2px 8px rgba(0,0,0,0.1)" },
    sparkle: { border: "2px solid #fbbf24", borderRadius: "12px", padding: "8px", background: "linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(244,114,182,0.05) 50%, rgba(168,85,247,0.05) 100%)", boxShadow: "0 0 8px rgba(251,191,36,0.3), 0 0 16px rgba(244,114,182,0.1)" },
    "polaroid-text": { border: "none", borderRadius: "2px", padding: "12px 10px 20px", background: "white", boxShadow: "2px 3px 12px rgba(0,0,0,0.15)" },
    chalk: { border: "2px solid rgba(255,255,255,0.3)", borderRadius: "0", padding: "8px", background: "rgba(45,45,45,0.9)" },
    "washi-border": { borderTop: "8px solid #fbcfe8", borderBottom: "8px solid #a5f3fc", borderLeft: "none", borderRight: "none", padding: "10px 8px", borderRadius: "0" },
  };

  return (
    <div
      className="flex h-full w-full items-center px-2 font-medium"
      style={{
        fontFamily: font,
        color: color,
        fontSize: `${size}px`,
        textAlign: (align || "center") as React.CSSProperties["textAlign"],
        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        ...(borderStyles[border] ?? {}),
      }}
    >
      {text}
    </div>
  );
}

// --- Drawing ---

function DrawingItem({ content }: { content: string }) {
  const { paths, color, width } = safeParseDrawingContent(content);

  return (
    <svg className="h-full w-full" viewBox="0 0 600 500" preserveAspectRatio="none">
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
