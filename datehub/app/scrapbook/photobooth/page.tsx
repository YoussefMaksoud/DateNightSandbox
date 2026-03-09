"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Camera, BookOpen, RefreshCw, Save, CheckCircle } from "lucide-react";

// --- Filter types ---

type FilterName = "none" | "grain" | "warm" | "cool" | "bw" | "vintage";
type OverlayName = "hearts" | "date" | "film" | "sparkles";

const FILTERS: { name: FilterName; label: string }[] = [
  { name: "none", label: "None" },
  { name: "grain", label: "Film Grain" },
  { name: "warm", label: "Warm" },
  { name: "cool", label: "Cool" },
  { name: "bw", label: "B&W" },
  { name: "vintage", label: "Vintage" },
];

const OVERLAYS: { name: OverlayName; label: string; icon: string }[] = [
  { name: "hearts", label: "Hearts", icon: "💕" },
  { name: "date", label: "Date Stamp", icon: "📅" },
  { name: "film", label: "Film Strip", icon: "🎞️" },
  { name: "sparkles", label: "Sparkles", icon: "✨" },
];

// --- Filter implementations ---

function applyFilter(ctx: CanvasRenderingContext2D, w: number, h: number, filter: FilterName) {
  if (filter === "none") return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];

    if (filter === "bw") {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = d[i + 1] = d[i + 2] = gray;
    } else if (filter === "warm") {
      d[i] = Math.min(255, r + 30);
      d[i + 1] = Math.min(255, g + 10);
      d[i + 2] = Math.max(0, b - 20);
    } else if (filter === "cool") {
      d[i] = Math.max(0, r - 20);
      d[i + 1] = Math.min(255, g + 5);
      d[i + 2] = Math.min(255, b + 30);
    } else if (filter === "vintage") {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = Math.min(255, gray + 40);
      d[i + 1] = Math.min(255, gray + 20);
      d[i + 2] = gray;
    } else if (filter === "grain") {
      const noise = (Math.random() - 0.5) * 50;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const mix = 0.85;
      d[i] = Math.min(255, Math.max(0, r * mix + gray * (1 - mix) + noise));
      d[i + 1] = Math.min(255, Math.max(0, g * mix + gray * (1 - mix) + noise));
      d[i + 2] = Math.min(255, Math.max(0, b * mix + gray * (1 - mix) + noise));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Vignette for vintage
  if (filter === "vintage") {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawOverlays(ctx: CanvasRenderingContext2D, w: number, h: number, overlays: Set<OverlayName>) {
  if (overlays.has("film")) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, 28);
    ctx.fillRect(0, h - 28, w, 28);
    ctx.fillStyle = "#222";
    for (let x = 10; x < w; x += 30) {
      ctx.fillRect(x, 4, 16, 20);
      ctx.fillRect(x, h - 24, 16, 20);
    }
    ctx.fillStyle = "#111";
    for (let x = 14; x < w; x += 30) {
      ctx.fillRect(x, 8, 8, 12);
      ctx.fillRect(x, h - 20, 8, 12);
    }
  }

  if (overlays.has("hearts")) {
    ctx.font = "20px serif";
    const positions = [
      [15, 40], [w - 35, 45], [20, h - 40], [w - 30, h - 35],
      [w / 2 - 10, 38], [w / 2 + 30, h - 38], [50, h / 2],
      [w - 50, h / 2], [80, 50], [w - 80, 55], [100, h - 45], [w - 100, h - 50],
    ];
    const hearts = ["❤️", "💕", "💖", "🩷", "💗"];
    positions.forEach(([x, y], i) => {
      ctx.fillText(hearts[i % hearts.length], x, y);
    });
  }

  if (overlays.has("sparkles")) {
    ctx.font = "16px serif";
    const sparklePositions = [
      [30, 35], [w - 45, 50], [w / 3, 30], [w * 0.7, 40],
      [25, h - 30], [w - 40, h - 35], [w / 2, h - 30],
      [60, h / 3], [w - 60, h * 0.6], [w / 4, h * 0.7], [w * 0.8, h / 4],
    ];
    const icons = ["✨", "⭐", "🌟", "💫", "⚡"];
    sparklePositions.forEach(([x, y], i) => {
      ctx.fillText(icons[i % icons.length], x, y);
    });
  }

  if (overlays.has("date")) {
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const padding = 12;
    ctx.font = "bold 16px 'Courier New', monospace";
    const metrics = ctx.measureText(dateStr);
    const boxW = metrics.width + padding * 2;
    const boxH = 28;
    const bx = w - boxW - 16;
    const by = h - boxH - (overlays.has("film") ? 36 : 12);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 4);
    ctx.fill();
    ctx.fillStyle = "#FF6B6B";
    ctx.fillText(dateStr, bx + padding, by + 20);
  }
}

// --- Component ---

export default function PhotoboothPage() {
  const { isLoaded } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"camera" | "edit" | "saved">("camera");
  const [capturedImage, setCapturedImage] = useState<HTMLImageElement | null>(null);
  const [filter, setFilter] = useState<FilterName>("none");
  const [overlays, setOverlays] = useState<Set<OverlayName>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(true);
      }
    }
    if (phase === "camera") startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [phase]);

  // Render preview whenever filter/overlays change
  const renderPreview = useCallback(() => {
    if (!capturedImage || !previewRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = capturedImage.width;
    canvas.height = capturedImage.height;
    ctx.drawImage(capturedImage, 0, 0);
    applyFilter(ctx, canvas.width, canvas.height, filter);
    drawOverlays(ctx, canvas.width, canvas.height, overlays);
  }, [capturedImage, filter, overlays]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        doCapture();
      }
    }, 1000);
  }

  function doCapture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    // Mirror the capture to match the mirrored video preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const img = new Image();
    img.onload = () => {
      setCapturedImage(img);
      setPhase("edit");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    img.src = canvas.toDataURL("image/jpeg", 0.92);
  }

  function retake() {
    setCapturedImage(null);
    setFilter("none");
    setOverlays(new Set());
    setPhase("camera");
  }

  function toggleOverlay(name: OverlayName) {
    setOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function savePhoto() {
    if (!previewRef.current) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve) =>
        previewRef.current!.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
      );
      const formData = new FormData();
      formData.append("file", new File([blob], "photobooth.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/scrapbook/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setSavedUrl(url);
        setPhase("saved");
      }
    } finally {
      setSaving(false);
    }
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
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-fuchsia-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-rose-500/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/scrapbook" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-lg shadow-rose-500/25">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Photo<span className="text-rose-400">booth</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/scrapbook"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06]"
            >
              <BookOpen className="h-3.5 w-3.5" /> Scrapbooks
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-8">
        {/* Camera Phase */}
        {phase === "camera" && (
          <div className="flex flex-col items-center">
            <h1 className="mb-6 text-2xl font-bold text-white">Strike a Pose!</h1>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl shadow-rose-500/10">
              {cameraError ? (
                <div className="flex h-[360px] w-[480px] flex-col items-center justify-center text-center">
                  <Camera className="h-12 w-12 text-zinc-400" />
                  <p className="mt-4 text-zinc-400">Camera access denied</p>
                  <p className="mt-1 text-xs text-zinc-600">Please allow camera access and refresh</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-[360px] w-[480px] object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              )}
              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <span className="text-8xl font-black text-white animate-pulse drop-shadow-2xl">
                    {countdown}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={capture}
              disabled={cameraError || countdown !== null}
              className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 text-2xl text-white shadow-xl shadow-rose-500/30 transition-all hover:scale-105 hover:shadow-rose-500/50 active:scale-95 disabled:opacity-50"
            >
              <Camera className="h-6 w-6" />
            </button>
            <p className="mt-2 text-xs text-zinc-600">Click to capture (3s countdown)</p>
          </div>
        )}

        {/* Edit Phase */}
        {phase === "edit" && (
          <div className="flex flex-col items-center">
            <h1 className="mb-6 text-2xl font-bold text-white">Perfect Shot!</h1>

            {/* Preview */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-rose-500/10">
              <canvas ref={previewRef} className="h-[360px] w-[480px] object-cover" />
            </div>

            {/* Filter selector */}
            <div className="mt-6 w-full max-w-[480px]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Filters</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setFilter(f.name)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                      filter === f.name
                        ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
                        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay toggles */}
            <div className="mt-4 w-full max-w-[480px]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Overlays</p>
              <div className="flex gap-2">
                {OVERLAYS.map((o) => (
                  <button
                    key={o.name}
                    onClick={() => toggleOverlay(o.name)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      overlays.has(o.name)
                        ? "bg-fuchsia-500/20 text-fuchsia-400 ring-1 ring-fuchsia-500/40"
                        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{o.icon}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={retake}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                <RefreshCw className="h-4 w-4" /> Retake
              </button>
              <button
                onClick={savePhoto}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/40 disabled:opacity-50"
              >
                {saving ? "Saving…" : <><Save className="h-4 w-4" /> Save to Scrapbook</>}
              </button>
            </div>
          </div>
        )}

        {/* Saved Phase */}
        {phase === "saved" && (
          <div className="flex flex-col items-center py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Photo Saved!</h1>
            <p className="mt-2 text-sm text-zinc-500">Your photo has been saved and is ready to add to any scrapbook.</p>

            {savedUrl && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] shadow-xl">
                <img src={savedUrl} alt="Saved photo" className="h-[280px] w-[380px] object-cover" />
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setPhase("camera"); setSavedUrl(""); setCapturedImage(null); setFilter("none"); setOverlays(new Set()); }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                <Camera className="h-4 w-4" /> Take Another
              </button>
              <Link
                href="/scrapbook"
                className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/40"
              >
                <BookOpen className="h-4 w-4" /> Go to Scrapbooks
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Hidden working canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
