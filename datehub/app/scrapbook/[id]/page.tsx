"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Camera, Smile, Paperclip, Ribbon, Type, Pen, Frame, LayoutTemplate, FilePlus, ArrowUpToLine, Lock, Unlock, Undo2, Redo2, Download, Link2, Book, BookOpen, User, Heart, RotateCw, Frown, ImageIcon, Trash2 } from "lucide-react";

// --- Types ---

interface ScrapbookReaction {
  id: string;
  itemId: string;
  userId: string;
  emoji: string;
}

interface ScrapbookItem {
  id: string;
  pageId: string;
  type: "photo" | "sticker" | "text" | "drawing";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  locked: boolean;
  createdBy: string;
  reactions: ScrapbookReaction[];
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
  shareToken: string | null;
  pages: ScrapbookPage[];
}

interface CursorPos {
  userId: string;
  x: number;
  y: number;
}

// --- Undo history entry ---
interface HistoryEntry {
  pages: ScrapbookPage[];
}

// --- Constants ---

const STICKERS = [
  // Hearts & Love
  "❤️", "💕", "💖", "💗", "🩷", "💘", "💝", "💌",
  "💞", "💓", "💟", "♥️", "🫀", "❣️", "💑", "💋",
  // Stars & Sky
  "⭐", "✨", "🌟", "💫", "🌈", "☀️", "🌙", "⚡",
  "🪐", "🌠", "💥", "☁️", "🌤️", "🌊", "❄️", "🔮",
  // Flowers & Nature
  "🌸", "🌹", "🌺", "🌻", "🌷", "🌼", "🪻", "💐",
  "🌿", "🍀", "🍃", "🪷", "🌾", "🪴", "🌱", "🌵",
  // Animals
  "🦋", "🐾", "🐝", "🐞", "🦊", "🐱", "🐶", "🐰",
  "🦢", "🕊️", "🐚", "🦩", "🐿️", "🦌", "🐻", "🦄",
  // Food & Treats
  "🎂", "🍰", "🧁", "🍪", "🍩", "🍫", "🍬", "🍭",
  "🍓", "🍒", "🍑", "🍉", "🧇", "☕", "🧋", "🍿",
  // Celebration & Party
  "🎀", "🎁", "🎈", "🎉", "🎊", "🪅", "🎆", "🎇",
  "🎏", "🎐", "🏮", "🪩", "🎠", "🎡", "🎢", "🎪",
  // Music & Arts
  "📸", "🎵", "🎶", "🎤", "🎨", "🎭", "🎬", "📽️",
  "🎹", "🎸", "🎺", "🥁", "🎻", "🎷", "📝", "✏️",
  // Accessories & Glam
  "💎", "👑", "🔥", "🕯️", "💅", "👒", "🎩", "👗",
  "👠", "💄", "🪞", "📿", "🧣", "🕶️", "💍", "👜",
  // Expressions & Vibes
  "🫶", "🤗", "😘", "🥰", "😍", "🫧", "🥳", "😊",
  "🤩", "😇", "🤭", "😋", "💃", "🕺", "🙌", "👏",
  // Travel & Adventure
  "🗺️", "✈️", "🏖️", "🏔️", "🌅", "🌄", "🏕️", "⛺",
  "🚗", "🛤️", "🧭", "🌍", "🗼", "🗽", "🏰", "⛩️",
  // Cozy & Home
  "🏠", "🛋️", "🕯️", "📚", "🧸", "🛁", "🪔", "🧶",
  "☂️", "🌂", "🍂", "🎃", "🫖", "🪵", "🔑", "💡",
  // Symbols & Marks
  "✅", "❌", "⭕", "💯", "🏷️", "📌", "🔖", "🏅",
  "🎗️", "🪶", "♾️", "💠", "🔸", "🔹", "❇️", "🌀",
];

const TAPE_STICKERS = ["📎", "🔖", "🏷️", "📌", "🖇️", "✂️"];

const WASHI_TAPES = [
  { name: "Pink Dots", bg: "bg-pink-200", pattern: "radial-gradient(circle, #f472b6 1px, transparent 1px)", size: "6px 6px" },
  { name: "Blue Stripe", bg: "bg-blue-200", pattern: "repeating-linear-gradient(90deg, #93c5fd 0px, #93c5fd 3px, #bfdbfe 3px, #bfdbfe 6px)", size: "" },
  { name: "Gold", bg: "bg-yellow-200", pattern: "linear-gradient(135deg, #fbbf24 25%, #f59e0b 50%, #fbbf24 75%)", size: "" },
  { name: "Mint Check", bg: "bg-emerald-100", pattern: "repeating-conic-gradient(#6ee7b7 0% 25%, #a7f3d0 0% 50%) 0 0 / 8px 8px", size: "" },
  { name: "Lavender", bg: "bg-purple-200", pattern: "repeating-linear-gradient(45deg, #c084fc 0px, #c084fc 2px, #d8b4fe 2px, #d8b4fe 5px)", size: "" },
  { name: "Red Heart", bg: "bg-red-100", pattern: "", size: "", emoji: "❤️" },
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
  { name: "Kraft", value: "#D4B896" },
  { name: "Charcoal", value: "#2D2D2D" },
  { name: "Navy", value: "#1B2838" },
  { name: "Wine", value: "#3D1C2A" },
];

const FONTS = [
  { name: "Serif", value: "'Georgia', serif" },
  { name: "Sans", value: "'Inter', sans-serif" },
  { name: "Cursive", value: "'Segoe Script', 'Bradley Hand', cursive" },
  { name: "Mono", value: "'Courier New', monospace" },
  { name: "Fantasy", value: "'Papyrus', 'Comic Sans MS', fantasy" },
];

const TEXT_COLORS = [
  "#4a3728", "#1a1a1a", "#8B0000", "#00008B",
  "#006400", "#4B0082", "#FF1493", "#FFFFFF",
];

const TEXT_BORDERS = [
  { name: "None", value: "none", style: {} },
  { name: "Doodle", value: "doodle", style: { border: "3px dashed #f9a8d4", borderRadius: "12px", padding: "8px" } },
  { name: "Scallop", value: "scallop", style: { border: "3px solid #c084fc", borderRadius: "20px", padding: "8px", boxShadow: "inset 0 0 0 2px #e9d5ff, inset 0 0 0 4px #c084fc" } },
  { name: "Ribbon", value: "ribbon", style: { border: "2px solid #fbbf24", borderRadius: "4px", padding: "8px", background: "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)" } },
  { name: "Heart Box", value: "heartbox", style: { border: "3px solid #fb7185", borderRadius: "16px", padding: "10px", boxShadow: "0 0 0 2px #ffe4e6, 0 4px 12px rgba(251,113,133,0.2)" } },
  { name: "Stamp", value: "stamp", style: { border: "3px dashed #64748b", borderRadius: "2px", padding: "10px", outline: "2px solid #64748b", outlineOffset: "3px" } },
  { name: "Notebook", value: "notebook", style: { borderBottom: "2px solid #93c5fd", borderLeft: "3px solid #f87171", padding: "8px 8px 8px 14px", background: "repeating-linear-gradient(transparent, transparent 27px, #e2e8f0 27px, #e2e8f0 28px)" } },
  { name: "Postcard", value: "postcard", style: { border: "2px solid #d4b896", borderRadius: "4px", padding: "10px", background: "linear-gradient(to bottom right, rgba(212,184,150,0.1) 0%, rgba(255,248,240,0.3) 100%)", boxShadow: "2px 2px 8px rgba(0,0,0,0.1)" } },
  { name: "Sparkle", value: "sparkle", style: { border: "2px solid #fbbf24", borderRadius: "12px", padding: "8px", background: "linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(244,114,182,0.05) 50%, rgba(168,85,247,0.05) 100%)", boxShadow: "0 0 8px rgba(251,191,36,0.3), 0 0 16px rgba(244,114,182,0.1)" } },
  { name: "Polaroid", value: "polaroid-text", style: { border: "none", borderRadius: "2px", padding: "12px 10px 20px", background: "white", boxShadow: "2px 3px 12px rgba(0,0,0,0.15)" } },
  { name: "Chalk", value: "chalk", style: { border: "2px solid rgba(255,255,255,0.3)", borderRadius: "0", padding: "8px", background: "rgba(45,45,45,0.9)" } },
  { name: "Washi", value: "washi-border", style: { borderTop: "8px solid #fbcfe8", borderBottom: "8px solid #a5f3fc", borderLeft: "none", borderRight: "none", padding: "10px 8px", borderRadius: "0" } },
];

const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;

const PHOTO_FRAMES = [
  { name: "None", value: "none" },
  { name: "Polaroid", value: "polaroid" },
  { name: "Shadow", value: "shadow" },
  { name: "Tape", value: "tape" },
];

const PAGE_TEMPLATES = [
  { name: "Blank", items: [] },
  {
    name: "2 Photos + Caption",
    items: [
      { type: "photo" as const, x: 30, y: 30, w: 250, h: 250 },
      { type: "photo" as const, x: 320, y: 30, w: 250, h: 250 },
      { type: "text" as const, x: 150, y: 350, w: 300, h: 60 },
    ],
  },
  {
    name: "Collage Grid",
    items: [
      { type: "photo" as const, x: 20, y: 20, w: 180, h: 220 },
      { type: "photo" as const, x: 210, y: 20, w: 180, h: 220 },
      { type: "photo" as const, x: 400, y: 20, w: 180, h: 220 },
      { type: "photo" as const, x: 100, y: 260, w: 180, h: 220 },
      { type: "photo" as const, x: 310, y: 260, w: 180, h: 220 },
    ],
  },
  {
    name: "Full Bleed",
    items: [
      { type: "photo" as const, x: 0, y: 0, w: 600, h: 500 },
      { type: "text" as const, x: 180, y: 420, w: 240, h: 50 },
    ],
  },
];

const DRAW_COLORS = ["#1a1a1a", "#8B0000", "#00008B", "#006400", "#FF1493", "#FF6B00", "#FFFFFF"];
const DRAW_WIDTHS = [2, 4, 6, 10];

const CANVAS_SIZES = [
  { name: "S", w: 600, label: "Compact" },
  { name: "M", w: 800, label: "Standard" },
  { name: "L", w: 1000, label: "Large" },
  { name: "XL", w: 1400, label: "Extra Large" },
];

const POLL_INTERVAL = 2000;
const CANVAS_W = 600;
const CANVAS_H = 500;
const MIN_SIZE = 30;
const MAX_HISTORY = 30;

// --- Component ---

export default function ScrapbookEditorPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const scrapbookId = params.id as string;

  const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<
    "stickers" | "tape" | "text" | "frames" | "washi" | "draw" | "templates" | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ itemId: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{
    itemId: string; startX: number; startY: number; startW: number; startH: number; corner: string;
  } | null>(null);
  const [rotating, setRotating] = useState<{ itemId: string; startAngle: number; startRotation: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState("");
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [textSize, setTextSize] = useState(14);
  const [textBorder, setTextBorder] = useState("none");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
  const [drawWidth, setDrawWidth] = useState(DRAW_WIDTHS[1]);
  const [currentPaths, setCurrentPaths] = useState<{ x: number; y: number }[]>([]);
  const [allDrawPaths, setAllDrawPaths] = useState<{ points: { x: number; y: number }[]; color: string; width: number }[]>([]);

  // Undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Live cursors
  const [cursors, setCursors] = useState<CursorPos[]>([]);

  // Share
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // Upload-to-slot: when set, the next file upload fills this existing item
  const [uploadTargetItemId, setUploadTargetItemId] = useState<string | null>(null);

  // Page flip
  const [flipDirection, setFlipDirection] = useState<"left" | "right" | null>(null);

  // Canvas size
  const [canvasSizeIdx, setCanvasSizeIdx] = useState(0);
  const canvasDisplayW = CANVAS_SIZES[canvasSizeIdx].w;
  const canvasDisplayH = canvasDisplayW * (CANVAS_H / CANVAS_W);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const drawCanvasRef = useRef<SVGSVGElement>(null);

  // --- Data fetching ---

  // Track whether user is actively interacting (drag/resize/rotate/edit/draw)
  const isBusyRef = useRef(false);

  const fetchScrapbook = useCallback(async (force = false) => {
    if (!force && isBusyRef.current) return; // skip poll during active interaction
    const res = await fetch(`/api/scrapbook/${scrapbookId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!isBusyRef.current) {
      setScrapbook(data.scrapbook);
    }
  }, [scrapbookId]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchScrapbook(true).then(() => setLoading(false));
  }, [isLoaded, user, fetchScrapbook]);

  useEffect(() => {
    if (!isLoaded || !user || loading) return;
    const interval = setInterval(fetchScrapbook, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isLoaded, user, loading, fetchScrapbook]);

  const currentPage = scrapbook?.pages[currentPageIdx] ?? null;

  // --- Push to undo history ---
  function pushHistory() {
    if (!scrapbook) return;
    const entry: HistoryEntry = { pages: JSON.parse(JSON.stringify(scrapbook.pages)) };
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(entry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  }

  function undo() {
    if (historyIdx <= 0 || !scrapbook) return;
    const prevIdx = historyIdx - 1;
    setHistoryIdx(prevIdx);
    setScrapbook({ ...scrapbook, pages: JSON.parse(JSON.stringify(history[prevIdx].pages)) });
  }

  function redo() {
    if (historyIdx >= history.length - 1 || !scrapbook) return;
    const nextIdx = historyIdx + 1;
    setHistoryIdx(nextIdx);
    setScrapbook({ ...scrapbook, pages: JSON.parse(JSON.stringify(history[nextIdx].pages)) });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItem && !editingText) { e.preventDefault(); deleteItem(selectedItem); }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // --- Canvas coordinate helpers ---

  function canvasCoords(e: React.MouseEvent | MouseEvent) {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  // --- Item CRUD ---

  async function addSticker(emoji: string) {
    if (!currentPage) return;
    pushHistory();
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: currentPage.id, type: "sticker", content: emoji,
        x: 200 + Math.random() * 200, y: 150 + Math.random() * 200,
        width: 60, height: 60, rotation: (Math.random() - 0.5) * 30,
        zIndex: (currentPage.items.length || 0) + 1,
      }),
    });
    await fetchScrapbook(true);
  }

  async function addWashiTape(tape: typeof WASHI_TAPES[0]) {
    if (!currentPage) return;
    pushHistory();
    const content = JSON.stringify({ washiType: tape.name, pattern: tape.pattern, size: tape.size, emoji: tape.emoji });
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: currentPage.id, type: "sticker", content,
        x: 100 + Math.random() * 200, y: 150 + Math.random() * 200,
        width: 200, height: 30, rotation: (Math.random() - 0.5) * 20,
        zIndex: (currentPage.items.length || 0) + 1,
      }),
    });
    await fetchScrapbook(true);
  }

  async function addText() {
    if (!currentPage) return;
    pushHistory();
    const content = JSON.stringify({ text: "Double-click to edit", font: textFont, color: textColor, size: textSize, border: textBorder, align: textAlign });
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: currentPage.id, type: "text", content,
        x: 150 + Math.random() * 200, y: 150 + Math.random() * 200,
        width: 200, height: 60, zIndex: (currentPage.items.length || 0) + 1,
      }),
    });
    await fetchScrapbook(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentPage) return;
    setUploading(true);
    pushHistory();
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/scrapbook/upload", { method: "POST", body: formData });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      const content = JSON.stringify({ url, frame: "none" });

      if (uploadTargetItemId) {
        // Fill an existing empty photo slot (from a template)
        setScrapbook((prev) => {
          if (!prev) return prev;
          return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === uploadTargetItemId ? { ...it, content } : it) })) };
        });
        await updateItem(uploadTargetItemId, { content });
        setUploadTargetItemId(null);
      } else {
        // Create a new photo item
        await fetch(`/api/scrapbook/${scrapbookId}/item`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: currentPage.id, type: "photo", content,
            x: 150 + Math.random() * 100, y: 100 + Math.random() * 100,
            width: 220, height: 220, rotation: (Math.random() - 0.5) * 10,
            zIndex: (currentPage.items.length || 0) + 1,
          }),
        });
      }
      await fetchScrapbook(true);
    }
    setUploading(false);
    setUploadTargetItemId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function triggerSlotUpload(itemId: string) {
    setUploadTargetItemId(itemId);
    fileInputRef.current?.click();
  }

  async function deleteItem(itemId: string) {
    pushHistory();
    await fetch(`/api/scrapbook/${scrapbookId}/item/${itemId}`, { method: "DELETE" });
    if (selectedItem === itemId) setSelectedItem(null);
    await fetchScrapbook(true);
  }

  async function updateItem(itemId: string, updates: Record<string, unknown>) {
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...updates }),
    });
  }

  // --- Page actions ---

  async function addPage() {
    if (!scrapbook) return;
    pushHistory();
    const nextNum = scrapbook.pages.length + 1;
    await fetch(`/api/scrapbook/${scrapbookId}/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageNumber: nextNum }),
    });
    await fetchScrapbook(true);
    setCurrentPageIdx(nextNum - 1);
  }

  async function deletePage() {
    if (!currentPage || !scrapbook || scrapbook.pages.length <= 1) return;
    if (!confirm("Delete this page and all its items?")) return;
    pushHistory();
    await fetch(`/api/scrapbook/${scrapbookId}/page`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: currentPage.id }),
    });
    setCurrentPageIdx(Math.max(0, currentPageIdx - 1));
    await fetchScrapbook(true);
  }

  async function updatePageColor(color: string) {
    if (!currentPage) return;
    pushHistory();
    setScrapbook((prev) => {
      if (!prev) return prev;
      return { ...prev, pages: prev.pages.map((p, i) => i === currentPageIdx ? { ...p, backgroundColor: color } : p) };
    });
    await fetch(`/api/scrapbook/${scrapbookId}/page`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: currentPage.id, backgroundColor: color }),
    });
  }

  // --- Page templates ---
  async function applyTemplate(template: typeof PAGE_TEMPLATES[0]) {
    if (!currentPage) return;
    pushHistory();
    // Clear existing items on this page first
    for (const existing of currentPage.items) {
      await fetch(`/api/scrapbook/${scrapbookId}/item/${existing.id}`, { method: "DELETE" });
    }
    setSelectedItem(null);
    if (template.items.length === 0) {
      await fetchScrapbook(true);
      return;
    }
    for (const item of template.items) {
      const content = item.type === "text"
        ? JSON.stringify({ text: "Your text here", font: FONTS[0].value, color: TEXT_COLORS[0], size: 16, border: "none", align: "center" })
        : JSON.stringify({ url: "", frame: "none" });
      await fetch(`/api/scrapbook/${scrapbookId}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: currentPage.id, type: item.type, content,
          x: item.x, y: item.y, width: item.w, height: item.h ?? 60,
          zIndex: currentPage.items.length + 1,
        }),
      });
    }
    await fetchScrapbook(true);
  }

  // --- Frame change ---
  async function changePhotoFrame(frame: string) {
    if (!selectedItem || !scrapbook) return;
    const item = scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === selectedItem);
    if (!item || item.type !== "photo") return;
    pushHistory();
    const parsed = safeParsePhotoContent(item.content);
    const content = JSON.stringify({ ...parsed, frame });
    setScrapbook((prev) => {
      if (!prev) return prev;
      return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === selectedItem ? { ...it, content } : it) })) };
    });
    await updateItem(selectedItem, { content });
  }

  // --- Lock / unlock ---
  async function toggleLock(itemId: string) {
    if (!scrapbook) return;
    const item = scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === itemId);
    if (!item) return;
    const locked = !item.locked;
    setScrapbook((prev) => {
      if (!prev) return prev;
      return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === itemId ? { ...it, locked } : it) })) };
    });
    await updateItem(itemId, { locked });
  }

  // --- Reactions ---
  async function toggleReaction(itemId: string) {
    if (!user) return;
    const item = scrapbook?.pages.flatMap((p) => p.items).find((it) => it.id === itemId);
    if (!item) return;
    const hasReacted = item.reactions.some((r) => r.userId === user.id);
    if (hasReacted) {
      await fetch(`/api/scrapbook/${scrapbookId}/item/${itemId}/reaction`, { method: "DELETE" });
    } else {
      await fetch(`/api/scrapbook/${scrapbookId}/item/${itemId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: "❤️" }),
      });
    }
    await fetchScrapbook(true);
  }

  // --- Share ---
  async function generateShareLink() {
    const res = await fetch(`/api/scrapbook/${scrapbookId}/share`, { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      setShareUrl(`${window.location.origin}${url}`);
      setShowShareModal(true);
    }
  }

  // --- Export ---
  async function exportAsImage() {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null, scale: 2, useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `scrapbook-page-${currentPageIdx + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  // --- Inline text editing ---
  function startTextEdit(item: ScrapbookItem) {
    const parsed = safeParseTextContent(item.content);
    isBusyRef.current = true;
    setEditingText(item.id);
    setEditTextValue(parsed.text);
    setTextFont(parsed.font);
    setTextColor(parsed.color);
    setTextSize(parsed.size);
    setTextBorder(parsed.border);
    setTextAlign(parsed.align as "left" | "center" | "right");
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  async function finishTextEdit() {
    if (!editingText) return;
    pushHistory();
    const content = JSON.stringify({ text: editTextValue, font: textFont, color: textColor, size: textSize, border: textBorder, align: textAlign });
    setScrapbook((prev) => {
      if (!prev) return prev;
      return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === editingText ? { ...it, content } : it) })) };
    });
    await updateItem(editingText, { content });
    setEditingText(null);
    isBusyRef.current = false;
    fetchScrapbook(true);
  }

  // --- Drawing ---
  function handleDrawStart(e: React.MouseEvent) {
    if (activePanel !== "draw") return;
    e.preventDefault();
    isBusyRef.current = true;
    setIsDrawing(true);
    const { x, y } = canvasCoords(e);
    setCurrentPaths([{ x, y }]);
  }

  function handleDrawMove(e: React.MouseEvent) {
    if (!isDrawing || activePanel !== "draw") return;
    const { x, y } = canvasCoords(e);
    setCurrentPaths((prev) => [...prev, { x, y }]);
  }

  async function handleDrawEnd() {
    if (!isDrawing || !currentPage || currentPaths.length < 2) {
      setIsDrawing(false);
      setCurrentPaths([]);
      isBusyRef.current = false;
      return;
    }
    setIsDrawing(false);
    const newPath = { points: currentPaths, color: drawColor, width: drawWidth };
    const updatedPaths = [...allDrawPaths, newPath];
    setAllDrawPaths(updatedPaths);
    setCurrentPaths([]);
    isBusyRef.current = false;
  }

  async function saveDrawing() {
    if (!currentPage || allDrawPaths.length === 0) return;
    pushHistory();
    const content = JSON.stringify({ paths: allDrawPaths });
    await fetch(`/api/scrapbook/${scrapbookId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: currentPage.id, type: "drawing", content,
        x: 0, y: 0, width: CANVAS_W, height: CANVAS_H,
        zIndex: (currentPage.items.length || 0) + 1,
      }),
    });
    setAllDrawPaths([]);
    await fetchScrapbook(true);
  }

  // --- Drag / resize / rotate ---
  function handleMouseDown(e: React.MouseEvent, item: ScrapbookItem) {
    if (activePanel === "draw") return;
    if (item.locked) { setSelectedItem(item.id); return; }
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem(item.id);
    if (editingText && editingText !== item.id) finishTextEdit();
    const { x, y } = canvasCoords(e);
    isBusyRef.current = true;
    setDragging({ itemId: item.id, offsetX: x - item.x, offsetY: y - item.y });
  }

  function handleResizeDown(e: React.MouseEvent, item: ScrapbookItem, corner: string) {
    if (item.locked) return;
    e.preventDefault(); e.stopPropagation();
    const { x, y } = canvasCoords(e);
    isBusyRef.current = true;
    setResizing({ itemId: item.id, startX: x, startY: y, startW: item.width, startH: item.height, corner });
  }

  function handleRotateDown(e: React.MouseEvent, item: ScrapbookItem) {
    if (item.locked) return;
    e.preventDefault(); e.stopPropagation();
    const { x, y } = canvasCoords(e);
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;
    const startAngle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
    isBusyRef.current = true;
    setRotating({ itemId: item.id, startAngle, startRotation: item.rotation });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!scrapbook) return;

    if (activePanel === "draw" && isDrawing) {
      handleDrawMove(e);
      return;
    }

    if (dragging) {
      const { x, y } = canvasCoords(e);
      const newX = Math.max(0, Math.min(CANVAS_W, x - dragging.offsetX));
      const newY = Math.max(0, Math.min(CANVAS_H, y - dragging.offsetY));
      setScrapbook((prev) => {
        if (!prev) return prev;
        return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === dragging.itemId ? { ...it, x: newX, y: newY } : it) })) };
      });
    }

    if (resizing) {
      const { x, y } = canvasCoords(e);
      const dx = x - resizing.startX;
      const dy = y - resizing.startY;
      let newW = resizing.startW, newH = resizing.startH;
      if (resizing.corner.includes("r")) newW = Math.max(MIN_SIZE, resizing.startW + dx);
      if (resizing.corner.includes("b")) newH = Math.max(MIN_SIZE, resizing.startH + dy);
      if (resizing.corner.includes("l")) newW = Math.max(MIN_SIZE, resizing.startW - dx);
      if (resizing.corner.includes("t")) newH = Math.max(MIN_SIZE, resizing.startH - dy);
      setScrapbook((prev) => {
        if (!prev) return prev;
        return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === resizing.itemId ? { ...it, width: newW, height: newH } : it) })) };
      });
    }

    if (rotating) {
      const { x, y } = canvasCoords(e);
      const item = scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === rotating.itemId);
      if (!item) return;
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
      const newRotation = rotating.startRotation + (angle - rotating.startAngle);
      setScrapbook((prev) => {
        if (!prev) return prev;
        return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === rotating.itemId ? { ...it, rotation: newRotation } : it) })) };
      });
    }
  }

  async function handleMouseUp() {
    if (activePanel === "draw" && isDrawing) { handleDrawEnd(); return; }
    if (!scrapbook) return;
    let didInteract = false;
    if (dragging) {
      didInteract = true;
      pushHistory();
      const item = scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === dragging.itemId);
      if (item) await updateItem(dragging.itemId, { x: item.x, y: item.y });
      setDragging(null);
    }
    if (resizing) {
      didInteract = true;
      pushHistory();
      const item = scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === resizing.itemId);
      if (item) await updateItem(resizing.itemId, { width: item.width, height: item.height });
      setResizing(null);
    }
    if (rotating) {
      didInteract = true;
      pushHistory();
      const item = scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === rotating.itemId);
      if (item) await updateItem(rotating.itemId, { rotation: item.rotation });
      setRotating(null);
    }
    if (didInteract) {
      isBusyRef.current = false;
      await fetchScrapbook(true);
    }
  }

  function handleCanvasClick() {
    if (activePanel === "draw") return;
    if (!dragging && !resizing && !rotating) {
      setSelectedItem(null);
      if (editingText) finishTextEdit();
    }
  }

  async function bringToFront(itemId: string) {
    if (!currentPage) return;
    pushHistory();
    const maxZ = Math.max(...currentPage.items.map((it) => it.zIndex), 0);
    setScrapbook((prev) => {
      if (!prev) return prev;
      return { ...prev, pages: prev.pages.map((p) => ({ ...p, items: p.items.map((it) => it.id === itemId ? { ...it, zIndex: maxZ + 1 } : it) })) };
    });
    await updateItem(itemId, { zIndex: maxZ + 1 });
  }

  // --- Page navigation with flip ---
  function goToPage(idx: number) {
    if (idx === currentPageIdx || !scrapbook) return;
    setFlipDirection(idx > currentPageIdx ? "right" : "left");
    setTimeout(() => {
      setCurrentPageIdx(idx);
      setTimeout(() => setFlipDirection(null), 400);
    }, 200);
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
        <Frown className="h-10 w-10" />
        <p className="mt-4 text-zinc-400">Scrapbook not found</p>
        <Link href="/scrapbook" className="mt-4 text-rose-400 hover:underline">← Back</Link>
      </div>
    );
  }

  const selectedItemData = selectedItem
    ? scrapbook.pages.flatMap((p) => p.items).find((it) => it.id === selectedItem)
    : null;

  // SVG path helper for drawing
  function pointsToPath(points: { x: number; y: number }[]) {
    if (points.length < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
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
          <h1 className="text-lg font-bold text-white"><Book className="h-5 w-5 inline" /> {scrapbook.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIdx <= 0} className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-white disabled:opacity-30" title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-white disabled:opacity-30" title="Redo (Ctrl+Y)"><Redo2 className="h-4 w-4" /></button>
          <button onClick={exportAsImage} disabled={exporting} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition-colors" title="Export page as image">
            {exporting ? "…" : <Download className="h-4 w-4" />}
          </button>
          <button onClick={generateShareLink} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition-colors" title="Share scrapbook">
            <Link2 className="h-4 w-4" />
          </button>
          <Link href="/scrapbook/photobooth" className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition-colors" title="Photobooth">
            <Camera className="h-4 w-4" />
          </Link>
          <span className="text-xs text-zinc-600">Page {currentPageIdx + 1}/{scrapbook.pages.length}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="flex w-14 flex-col items-center gap-1 overflow-y-auto border-r border-white/[0.06] bg-[#0a0c0a]/80 py-3">
          <ToolButton icon={<Camera className="h-5 w-5" />} label="Photo" onClick={() => fileInputRef.current?.click()} active={uploading} />
          <ToolButton icon={<Smile className="h-5 w-5" />} label="Stickers" onClick={() => setActivePanel(activePanel === "stickers" ? null : "stickers")} active={activePanel === "stickers"} />
          <ToolButton icon={<Paperclip className="h-5 w-5" />} label="Tape & Clips" onClick={() => setActivePanel(activePanel === "tape" ? null : "tape")} active={activePanel === "tape"} />
          <ToolButton icon={<Ribbon className="h-5 w-5" />} label="Washi Tape" onClick={() => setActivePanel(activePanel === "washi" ? null : "washi")} active={activePanel === "washi"} />
          <ToolButton icon={<Type className="h-5 w-5" />} label="Text" onClick={() => setActivePanel(activePanel === "text" ? null : "text")} active={activePanel === "text"} />
          <ToolButton icon={<Pen className="h-5 w-5" />} label="Draw" onClick={() => { setActivePanel(activePanel === "draw" ? null : "draw"); setSelectedItem(null); }} active={activePanel === "draw"} />
          {selectedItemData?.type === "photo" && (
            <ToolButton icon={<Frame className="h-5 w-5" />} label="Frames" onClick={() => setActivePanel(activePanel === "frames" ? null : "frames")} active={activePanel === "frames"} />
          )}
          <div className="my-2 h-px w-8 bg-white/[0.06]" />
          <ToolButton icon={<LayoutTemplate className="h-5 w-5" />} label="Templates" onClick={() => setActivePanel(activePanel === "templates" ? null : "templates")} active={activePanel === "templates"} />
          <ToolButton icon={<FilePlus className="h-5 w-5" />} label="Add Page" onClick={addPage} active={false} />
          {selectedItem && (
            <>
              <div className="my-2 h-px w-8 bg-white/[0.06]" />
              <ToolButton icon={<ArrowUpToLine className="h-5 w-5" />} label="Bring Front" onClick={() => bringToFront(selectedItem)} active={false} />
              <ToolButton icon={selectedItemData?.locked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />} label={selectedItemData?.locked ? "Unlock" : "Lock"} onClick={() => toggleLock(selectedItem)} active={!!selectedItemData?.locked} />
            </>
          )}
        </div>

        {/* Side panels */}
        {activePanel === "stickers" && (
          <SidePanel title="Stickers">
            <div className="grid grid-cols-4 gap-1.5">
              {STICKERS.map((s, i) => (
                <button key={`${s}-${i}`} onClick={() => addSticker(s)} className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-2xl transition-all hover:scale-110 hover:bg-white/[0.08] active:scale-95">{s}</button>
              ))}
            </div>
          </SidePanel>
        )}

        {activePanel === "tape" && (
          <SidePanel title="Tape & Clips">
            <div className="grid grid-cols-3 gap-1.5">
              {TAPE_STICKERS.map((s) => (
                <button key={s} onClick={() => addSticker(s)} className="flex h-14 w-full items-center justify-center rounded-lg bg-white/[0.04] text-3xl transition-all hover:scale-105 hover:bg-white/[0.08] active:scale-95">{s}</button>
              ))}
            </div>
          </SidePanel>
        )}

        {activePanel === "washi" && (
          <SidePanel title="Washi Tape">
            <div className="space-y-2">
              {WASHI_TAPES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => addWashiTape(t)}
                  className="flex w-full items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-zinc-400 transition-all hover:bg-white/[0.08]"
                >
                  <div className="h-4 w-20 rounded-sm" style={{ background: t.pattern || undefined, backgroundSize: t.size || undefined, backgroundColor: t.pattern ? undefined : "#fecdd3" }} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-zinc-600">Drag strips over photos!</p>
          </SidePanel>
        )}

        {activePanel === "text" && (
          <SidePanel title="Add Text">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Font</label>
                <div className="flex flex-wrap gap-1">
                  {FONTS.map((f) => (
                    <button key={f.name} onClick={() => setTextFont(f.value)}
                      className={`rounded-md px-2 py-1 text-xs transition-all ${textFont === f.value ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}
                      style={{ fontFamily: f.value }}>{f.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {TEXT_COLORS.map((c) => (
                    <button key={c} onClick={() => setTextColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${textColor === c ? "border-rose-500 scale-110" : "border-zinc-700 hover:border-zinc-500"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Size: {textSize}px</label>
                <input type="range" min={10} max={36} value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-rose-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Alignment</label>
                <div className="flex gap-1">
                  {TEXT_ALIGNMENTS.map((a) => (
                    <button key={a} onClick={() => setTextAlign(a)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs capitalize transition-all ${textAlign === a ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Border Style</label>
                <div className="grid grid-cols-2 gap-1">
                  {TEXT_BORDERS.map((b) => (
                    <button key={b.value} onClick={() => setTextBorder(b.value)}
                      className={`rounded-md px-2 py-1.5 text-[10px] transition-all ${textBorder === b.value ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}>{b.name}</button>
                  ))}
                </div>
              </div>
              <button onClick={addText} className="w-full rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/30">+ Add Text Block</button>
            </div>
          </SidePanel>
        )}

        {activePanel === "draw" && (
          <SidePanel title="Draw / Handwrite">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Ink Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {DRAW_COLORS.map((c) => (
                    <button key={c} onClick={() => setDrawColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${drawColor === c ? "border-rose-500 scale-110" : "border-zinc-700 hover:border-zinc-500"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Brush Size</label>
                <div className="flex gap-2">
                  {DRAW_WIDTHS.map((w) => (
                    <button key={w} onClick={() => setDrawWidth(w)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${drawWidth === w ? "bg-rose-500/20 ring-1 ring-rose-500/40" : "bg-white/[0.04] hover:bg-white/[0.08]"}`}>
                      <div className="rounded-full bg-white" style={{ width: w + 2, height: w + 2 }} />
                    </button>
                  ))}
                </div>
              </div>
              {allDrawPaths.length > 0 && (
                <>
                  <button onClick={saveDrawing} className="w-full rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/30">✓ Save Drawing</button>
                  <button onClick={() => setAllDrawPaths([])} className="w-full rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.08]">Clear</button>
                </>
              )}
              <p className="text-[10px] text-zinc-600">Draw directly on the page. Click &quot;Save Drawing&quot; when done.</p>
            </div>
          </SidePanel>
        )}

        {activePanel === "frames" && selectedItemData?.type === "photo" && (
          <SidePanel title="Photo Frame">
            <div className="space-y-2">
              {PHOTO_FRAMES.map((f) => {
                const parsed = safeParsePhotoContent(selectedItemData.content);
                return (
                  <button key={f.value} onClick={() => changePhotoFrame(f.value)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${parsed.frame === f.value ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}>
                    {f.name}
                  </button>
                );
              })}
            </div>
          </SidePanel>
        )}

        {activePanel === "templates" && (
          <SidePanel title="Page Templates">
            <div className="space-y-2">
              {PAGE_TEMPLATES.map((t) => (
                <button key={t.name} onClick={() => applyTemplate(t)}
                  className="w-full rounded-lg bg-white/[0.04] px-3 py-2 text-left text-sm text-zinc-400 transition-all hover:bg-white/[0.08] hover:text-white">
                  {t.name}
                  {t.items.length > 0 && <span className="ml-2 text-[10px] text-zinc-600">({t.items.length} items)</span>}
                </button>
              ))}
            </div>
          </SidePanel>
        )}

        {/* Canvas area */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-auto bg-zinc-950/50 p-4">
          {/* Page navigation */}
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => goToPage(Math.max(0, currentPageIdx - 1))} disabled={currentPageIdx === 0}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-30">← Prev</button>
            {scrapbook.pages.map((_p, i) => (
              <button key={_p.id} onClick={() => goToPage(i)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${i === currentPageIdx ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08]"}`}>{i + 1}</button>
            ))}
            <button onClick={() => goToPage(Math.min(scrapbook.pages.length - 1, currentPageIdx + 1))} disabled={currentPageIdx >= scrapbook.pages.length - 1}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-white disabled:opacity-30">Next →</button>
            {scrapbook.pages.length > 1 && (
              <button onClick={deletePage}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-all hover:bg-red-500/20 hover:text-red-400"
                title="Delete current page">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Scrapbook page canvas with flip animation */}
          {currentPage && (
            <div
              style={{ perspective: "1200px" }}
            >
              <div
                ref={canvasRef}
                className="relative select-none overflow-hidden rounded-lg shadow-2xl shadow-black/40 transition-all duration-400"
                style={{
                  width: `min(90vw, ${canvasDisplayW}px)`,
                  height: `min(75vh, ${canvasDisplayH}px)`,
                  aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
                  backgroundColor: currentPage.backgroundColor,
                  cursor: activePanel === "draw" ? "crosshair" : dragging ? "grabbing" : resizing ? "nwse-resize" : rotating ? "crosshair" : "default",
                  transform: flipDirection === "right"
                    ? "rotateY(-8deg)"
                    : flipDirection === "left"
                    ? "rotateY(8deg)"
                    : "rotateY(0deg)",
                }}
                onClick={handleCanvasClick}
                onMouseDown={activePanel === "draw" ? handleDrawStart : undefined}
              >
                {/* Page texture */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 19px, #00000015 20px)" }} />

                {/* Items */}
                {currentPage.items.sort((a, b) => a.zIndex - b.zIndex).map((item) => (
                  <ScrapbookItemRenderer
                    key={item.id}
                    item={item}
                    isSelected={selectedItem === item.id}
                    isEditing={editingText === item.id}
                    editTextValue={editTextValue}
                    onEditTextChange={setEditTextValue}
                    editInputRef={editInputRef}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                    onDoubleClick={() => {
                      if (item.type === "text") startTextEdit(item);
                      if (item.type === "photo") {
                        const p = safeParsePhotoContent(item.content);
                        if (!p.url) triggerSlotUpload(item.id);
                      }
                    }}
                    onResizeDown={(e, corner) => handleResizeDown(e, item, corner)}
                    onRotateDown={(e) => handleRotateDown(e, item)}
                    onDelete={() => {}}
                    onFinishEdit={finishTextEdit}
                    onToggleReaction={() => toggleReaction(item.id)}
                    onToggleLock={() => toggleLock(item.id)}
                    onUploadToSlot={() => triggerSlotUpload(item.id)}
                    currentUserId={user?.id ?? ""}
                    textFont={textFont}
                    textColor={textColor}
                    textSize={textSize}
                    onTextFontChange={setTextFont}
                    onTextColorChange={setTextColor}
                    onTextSizeChange={setTextSize}
                    textBorder={textBorder}
                    textAlign={textAlign}
                    onTextBorderChange={setTextBorder}
                    onTextAlignChange={(v: string) => setTextAlign(v as "left" | "center" | "right")}
                    drawMode={activePanel === "draw"}
                  />
                ))}

                {/* Drawing overlay (SVG) */}
                {activePanel === "draw" && (
                  <svg ref={drawCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none">
                    {allDrawPaths.map((path, i) => (
                      <path key={i} d={pointsToPath(path.points)} fill="none" stroke={path.color} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                    {currentPaths.length > 1 && (
                      <path d={pointsToPath(currentPaths)} fill="none" stroke={drawColor} strokeWidth={drawWidth} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
                    )}
                  </svg>
                )}

                {/* Live cursors */}
                {cursors.filter((c) => c.userId !== user?.id).map((c) => (
                  <div key={c.userId} className="pointer-events-none absolute z-50" style={{ left: `${(c.x / CANVAS_W) * 100}%`, top: `${(c.y / CANVAS_H) * 100}%` }}>
                    <div className="h-4 w-4 -translate-x-1 -translate-y-1 rounded-full bg-fuchsia-500 opacity-70 shadow-lg shadow-fuchsia-500/50" />
                  </div>
                ))}

                {/* Empty state */}
                {currentPage.items.length === 0 && allDrawPaths.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-30">
                    <BookOpen className="h-12 w-12" />
                    <p className="mt-3 text-sm text-zinc-600 font-medium">Add photos, stickers, text & drawings</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page controls row */}
          {currentPage && (
            <div className="mt-3 flex items-center gap-4 flex-wrap justify-center">
              {/* Page color */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Color:</span>
                {PAGE_COLORS.map((pc) => (
                  <button key={pc.value} onClick={() => updatePageColor(pc.value)}
                    className={`h-5 w-5 rounded-full border-2 transition-all ${currentPage.backgroundColor === pc.value ? "border-rose-500 scale-110" : "border-zinc-700 hover:border-zinc-500"}`}
                    style={{ backgroundColor: pc.value }} title={pc.name} />
                ))}
              </div>

              <div className="h-4 w-px bg-white/[0.06]" />

              {/* Canvas size toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Size:</span>
                {CANVAS_SIZES.map((s, i) => (
                  <button key={s.name} onClick={() => setCanvasSizeIdx(i)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                      canvasSizeIdx === i
                        ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
                        : "bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300"
                    }`}
                    title={s.label}>{s.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handlePhotoUpload} />

      {/* Uploading overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-900 p-8 shadow-2xl">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
            <p className="text-sm text-zinc-400">Uploading photo…</p>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-3"><Link2 className="h-5 w-5 inline" /> Share Scrapbook</h2>
            <p className="text-sm text-zinc-400 mb-4">Anyone with this link can view your scrapbook (read-only):</p>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={shareUrl ?? ""} className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              <button onClick={() => { if (shareUrl) navigator.clipboard.writeText(shareUrl); }}
                className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/30">Copy</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-4 w-full rounded-lg bg-white/[0.04] py-2 text-sm text-zinc-400 hover:bg-white/[0.08]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Content parsers ---

function safeParseTextContent(content: string): { text: string; font: string; color: string; size: number; border: string; align: string } {
  try {
    const p = JSON.parse(content);
    return { text: p.text ?? content, font: p.font ?? "'Georgia', serif", color: p.color ?? "#4a3728", size: p.size ?? 14, border: p.border ?? "none", align: p.align ?? "center" };
  } catch { return { text: content, font: "'Georgia', serif", color: "#4a3728", size: 14, border: "none", align: "center" }; }
}

function safeParsePhotoContent(content: string): { url: string; frame: string } {
  try {
    const p = JSON.parse(content);
    return { url: p.url ?? content, frame: p.frame ?? "none" };
  } catch { return { url: content, frame: "none" }; }
}

function safeParseWashiContent(content: string): { washiType?: string; pattern?: string; size?: string; emoji?: string } | null {
  try {
    const p = JSON.parse(content);
    if (p.washiType) return p;
    return null;
  } catch { return null; }
}

function safeParseDrawingContent(content: string): { paths: { points: { x: number; y: number }[]; color: string; width: number }[] } {
  try {
    return JSON.parse(content);
  } catch { return { paths: [] }; }
}

// --- Scrapbook Item Renderer ---

function ScrapbookItemRenderer({
  item, isSelected, isEditing, editTextValue, onEditTextChange, editInputRef,
  onMouseDown, onDoubleClick, onResizeDown, onRotateDown, onDelete, onFinishEdit,
  onToggleReaction, onToggleLock, onUploadToSlot, currentUserId,
  textFont, textColor, textSize, onTextFontChange, onTextColorChange, onTextSizeChange,
  textBorder, textAlign, onTextBorderChange, onTextAlignChange,
  drawMode,
}: {
  item: ScrapbookItem; isSelected: boolean; isEditing: boolean;
  editTextValue: string; onEditTextChange: (v: string) => void;
  editInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onMouseDown: (e: React.MouseEvent) => void; onDoubleClick: () => void;
  onResizeDown: (e: React.MouseEvent, corner: string) => void;
  onRotateDown: (e: React.MouseEvent) => void;
  onDelete: () => void; onFinishEdit: () => void;
  onToggleReaction: () => void; onToggleLock: () => void;
  onUploadToSlot: () => void;
  currentUserId: string;
  textFont: string; textColor: string; textSize: number;
  onTextFontChange: (v: string) => void; onTextColorChange: (v: string) => void; onTextSizeChange: (v: number) => void;
  textBorder: string; textAlign: string;
  onTextBorderChange: (v: string) => void; onTextAlignChange: (v: string) => void;
  drawMode: boolean;
}) {
  const parsed = item.type === "text" ? safeParseTextContent(item.content) : null;
  const photoParsed = item.type === "photo" ? safeParsePhotoContent(item.content) : null;
  const washiParsed = item.type === "sticker" ? safeParseWashiContent(item.content) : null;
  const drawParsed = item.type === "drawing" ? safeParseDrawingContent(item.content) : null;
  const hasReacted = item.reactions.some((r) => r.userId === currentUserId);

  return (
    <div
      className="group absolute"
      style={{
        left: `${(item.x / CANVAS_W) * 100}%`,
        top: `${(item.y / CANVAS_H) * 100}%`,
        width: `${(item.width / CANVAS_W) * 100}%`,
        height: `${(item.height / CANVAS_H) * 100}%`,
        transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: item.zIndex,
        cursor: drawMode ? "crosshair" : isEditing ? "text" : item.locked ? "not-allowed" : "grab",
        opacity: item.locked && !isSelected ? 0.85 : 1,
      }}
      onMouseDown={drawMode ? undefined : isEditing ? undefined : onMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={drawMode ? undefined : onDoubleClick}
    >
      {/* Sticker (emoji or washi tape) */}
      {item.type === "sticker" && !washiParsed && (
        <div className="flex h-full w-full items-center justify-center text-4xl select-none">{item.content}</div>
      )}

      {/* Washi tape */}
      {item.type === "sticker" && washiParsed && (
        <div
          className="h-full w-full rounded-sm opacity-80"
          style={{
            background: washiParsed.pattern || "#fecdd3",
            backgroundSize: washiParsed.size || undefined,
          }}
        >
          {washiParsed.emoji && (
            <div className="flex h-full w-full items-center justify-center gap-2 text-sm opacity-60">
              {Array.from({ length: 5 }, (_, i) => <span key={i}>{washiParsed.emoji}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Photo */}
      {item.type === "photo" && photoParsed && (
        photoParsed.url ? (
          <PhotoItem url={photoParsed.url} frame={photoParsed.frame} />
        ) : (
          <button
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-zinc-300/40 bg-zinc-100/10 text-zinc-400 transition-all hover:border-rose-400/60 hover:bg-rose-500/5 hover:text-rose-400"
            onClick={(e) => { e.stopPropagation(); onUploadToSlot(); }}
          >
            <Camera className="h-8 w-8" />
            <span className="text-[11px] font-medium">Click to add photo</span>
          </button>
        )
      )}

      {/* Text */}
      {item.type === "text" && parsed && (
        isEditing ? (
          <div className="flex h-full w-full flex-col" onClick={(e) => e.stopPropagation()}>
            <textarea ref={editInputRef} value={editTextValue} onChange={(e) => onEditTextChange(e.target.value)}
              onBlur={onFinishEdit} onKeyDown={(e) => { if (e.key === "Escape") onFinishEdit(); }}
              className="flex-1 resize-none rounded bg-white/90 px-2 py-1 outline-none ring-2 ring-rose-500"
              style={{ fontFamily: textFont, color: textColor, fontSize: `${textSize}px` }} />
            <div className="absolute -bottom-10 left-0 flex items-center gap-1 rounded-lg bg-zinc-900/95 px-2 py-1 shadow-xl backdrop-blur-sm" style={{ zIndex: 9999 }}>
              {FONTS.slice(0, 3).map((f) => (
                <button key={f.name} onClick={(e) => { e.stopPropagation(); onTextFontChange(f.value); }}
                  className={`rounded px-1.5 py-0.5 text-[10px] ${textFont === f.value ? "bg-rose-500/30 text-rose-400" : "text-zinc-400 hover:text-white"}`}
                  style={{ fontFamily: f.value }}>{f.name}</button>
              ))}
              <div className="mx-1 h-3 w-px bg-zinc-700" />
              {TEXT_COLORS.slice(0, 4).map((c) => (
                <button key={c} onClick={(e) => { e.stopPropagation(); onTextColorChange(c); }}
                  className={`h-4 w-4 rounded-full border ${textColor === c ? "border-rose-500" : "border-zinc-600"}`}
                  style={{ backgroundColor: c }} />
              ))}
              <div className="mx-1 h-3 w-px bg-zinc-700" />
              <button onClick={(e) => { e.stopPropagation(); onTextSizeChange(Math.max(10, textSize - 2)); }} className="text-[10px] text-zinc-400 hover:text-white px-1">A-</button>
              <button onClick={(e) => { e.stopPropagation(); onTextSizeChange(Math.min(36, textSize + 2)); }} className="text-[10px] text-zinc-400 hover:text-white px-1">A+</button>
              <div className="mx-1 h-3 w-px bg-zinc-700" />
              {(["left", "center", "right"] as const).map((a) => (
                <button key={a} onClick={(e) => { e.stopPropagation(); onTextAlignChange(a); }}
                  className={`px-1 text-[10px] ${textAlign === a ? "text-rose-400" : "text-zinc-400 hover:text-white"}`}>
                  {a === "left" ? "⫷" : a === "right" ? "⫸" : "⊡"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center px-2 font-medium"
            style={{
              fontFamily: parsed.font, color: parsed.color, fontSize: `${parsed.size}px`,
              textAlign: (parsed.align || "center") as React.CSSProperties["textAlign"],
              justifyContent: parsed.align === "left" ? "flex-start" : parsed.align === "right" ? "flex-end" : "center",
              ...(TEXT_BORDERS.find(b => b.value === parsed.border)?.style ?? {}),
            }}>{parsed.text}</div>
        )
      )}

      {/* Drawing */}
      {item.type === "drawing" && drawParsed && (
        <svg className="h-full w-full" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none">
          {drawParsed.paths.map((path, i) => (
            <path key={i} d={path.points.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
              fill="none" stroke={path.color} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      )}

      {/* Ownership badge */}
      {item.createdBy && !isEditing && (
        <div className="absolute -left-1 -bottom-1 hidden h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[8px] text-zinc-400 border border-zinc-700 group-hover:flex" title={`By ${item.createdBy.slice(0, 8)}`}>
          <User className="h-3 w-3" />
        </div>
      )}

      {/* Reactions */}
      {item.reactions.length > 0 && !isEditing && (
        <div className="absolute -right-1 -bottom-1 flex h-5 items-center gap-0.5 rounded-full bg-zinc-800/90 px-1.5 text-[10px] border border-zinc-700">
          <Heart className="h-3 w-3 fill-current text-rose-400" />
          <span className="text-zinc-400">{item.reactions.length}</span>
        </div>
      )}

      {/* Lock indicator */}
      {item.locked && (
        <div className="pointer-events-none absolute left-1 top-1 text-[10px] opacity-50"><Lock className="h-3 w-3" /></div>
      )}

      {/* Selection controls */}
      {isSelected && !isEditing && !drawMode && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded border-2 border-rose-500/60" />
          {!item.locked && ["br", "bl", "tr", "tl"].map((corner) => {
            const pos = corner === "br" ? "bottom-0 right-0" : corner === "bl" ? "bottom-0 left-0" : corner === "tr" ? "top-0 right-0" : "top-0 left-0";
            return (
              <div key={corner} className={`absolute ${pos} h-3 w-3 cursor-nwse-resize rounded-full bg-rose-500 border-2 border-white shadow-md`}
                style={{ transform: "translate(50%, 50%)" }} onMouseDown={(e) => onResizeDown(e, corner)} />
            );
          })}
          {!item.locked && (
            <div className="absolute -top-6 left-1/2 flex h-4 w-4 -translate-x-1/2 cursor-crosshair items-center justify-center rounded-full bg-rose-500 text-[8px] text-white shadow-md"
              onMouseDown={onRotateDown}><RotateCw className="h-3 w-3" /></div>
          )}
          {/* Action bar */}
          <div className="absolute -top-8 right-0 flex items-center gap-0.5 rounded-lg bg-zinc-900/95 px-1 py-0.5 shadow-xl backdrop-blur-sm" style={{ zIndex: 9999 }}>
            <button onClick={(e) => { e.stopPropagation(); onToggleReaction(); }}
              className={`rounded px-1 py-0.5 text-[10px] transition-all ${hasReacted ? "text-rose-400" : "text-zinc-500 hover:text-rose-400"}`}><Heart className="h-3 w-3" /></button>
            <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
              className="rounded px-1 py-0.5 text-[10px] text-zinc-500 hover:text-white">{item.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}</button>
          </div>
        </>
      )}
    </div>
  );
}

// --- Photo with frame styles ---

function PhotoItem({ url, frame }: { url: string; frame: string }) {
  if (!url) return <div className="flex h-full w-full items-center justify-center rounded bg-zinc-200 text-2xl text-zinc-400"><ImageIcon className="h-8 w-8" /></div>;

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
    return <img src={url} alt="" className="h-full w-full rounded-md object-cover shadow-xl shadow-black/30" draggable={false} />;
  }

  return <img src={url} alt="" className="h-full w-full rounded-sm object-cover" style={{ border: "3px solid white", boxShadow: "2px 2px 8px rgba(0,0,0,0.15)" }} draggable={false} />;
}

// --- Side Panel ---

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-56 overflow-y-auto border-r border-white/[0.06] bg-[#0a0c0a]/80 p-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

// --- Toolbar button ---

function ToolButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg transition-all ${active ? "bg-rose-500/20 text-white" : "text-zinc-500 hover:bg-white/[0.06] hover:text-white"}`} title={label}>
      {icon}
    </button>
  );
}
