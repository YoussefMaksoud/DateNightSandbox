"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const ROOM_ID = "homework-default";
const POLL_INTERVAL = 1500;

interface SessionData {
  roomId: string;
  hostUserId: string;
  offer: string | null;
  answer: string | null;
  hostCandidates: string[];
  viewerCandidates: string[];
  isActive: boolean;
}

export default function HomeworkPage() {
  const { user, isLoaded } = useUser();

  const [mode, setMode] = useState<"idle" | "hosting" | "viewing">("idle");
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState("Ready to start");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentCandidatesRef = useRef(0);
  const appliedCandidatesRef = useRef(0);

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    sentCandidatesRef.current = 0;
    appliedCandidatesRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      fetch("/api/screen-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", roomId: ROOM_ID }),
      }).catch(() => {});
    };
  }, [cleanup]);

  // Poll for session updates
  useEffect(() => {
    if (mode === "idle") return;

    async function poll() {
      try {
        const res = await fetch(`/api/screen-share?roomId=${ROOM_ID}`);
        const data = await res.json();
        if (data.session) setSession(data.session);
        else if (mode === "viewing") {
          setStatus("Host stopped sharing");
          setMode("idle");
          cleanup();
        }
      } catch {}
    }

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    poll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [mode, cleanup]);

  // Host: handle viewer answer
  useEffect(() => {
    if (mode !== "hosting" || !session?.answer || !pcRef.current) return;
    if (pcRef.current.remoteDescription) return;

    (async () => {
      try {
        await pcRef.current!.setRemoteDescription(JSON.parse(session.answer!));
        setStatus("Connected! Sharing your screen");
      } catch {}
    })();
  }, [mode, session?.answer]);

  // Host: apply viewer ICE candidates
  useEffect(() => {
    if (mode !== "hosting" || !session || !pcRef.current) return;
    const candidates = session.viewerCandidates;
    for (let i = appliedCandidatesRef.current; i < candidates.length; i++) {
      try {
        pcRef.current.addIceCandidate(JSON.parse(candidates[i]));
      } catch {}
    }
    appliedCandidatesRef.current = candidates.length;
  }, [mode, session?.viewerCandidates]);

  // Viewer: apply host ICE candidates
  useEffect(() => {
    if (mode !== "viewing" || !session || !pcRef.current) return;
    const candidates = session.hostCandidates;
    for (let i = appliedCandidatesRef.current; i < candidates.length; i++) {
      try {
        pcRef.current.addIceCandidate(JSON.parse(candidates[i]));
      } catch {}
    }
    appliedCandidatesRef.current = candidates.length;
  }, [mode, session?.hostCandidates]);

  // Viewer: connect when offer is available
  useEffect(() => {
    if (mode !== "viewing" || !session?.offer || pcRef.current) return;

    (async () => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            fetch("/api/screen-share", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "candidate",
                roomId: ROOM_ID,
                candidate: JSON.stringify(e.candidate),
                role: "viewer",
              }),
            }).catch(() => {});
          }
        };

        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setStatus("Watching live screen");
          }
        };

        await pc.setRemoteDescription(JSON.parse(session.offer!));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch("/api/screen-share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "answer",
            roomId: ROOM_ID,
            answer: JSON.stringify(answer),
          }),
        });

        setStatus("Connecting…");
      } catch (err) {
        setStatus("Failed to connect");
      }
    })();
  }, [mode, session?.offer]);

  async function startSharing() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // When user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          fetch("/api/screen-share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "candidate",
              roomId: ROOM_ID,
              candidate: JSON.stringify(e.candidate),
              role: "host",
            }),
          }).catch(() => {});
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch("/api/screen-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          roomId: ROOM_ID,
          offer: JSON.stringify(offer),
        }),
      });

      setMode("hosting");
      setStatus("Sharing — waiting for viewer…");
    } catch (err) {
      setStatus("Screen share cancelled or denied");
    }
  }

  async function startViewing() {
    setMode("viewing");
    setStatus("Looking for active screen share…");
  }

  async function stopSharing() {
    await fetch("/api/screen-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", roomId: ROOM_ID }),
    }).catch(() => {});
    cleanup();
    setMode("idle");
    setSession(null);
    setStatus("Ready to start");
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-500/30 border-t-blue-500" />
          <span className="text-sm text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0c]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
              <span className="text-lg">🎓</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Homework<span className="text-blue-400">Night</span>
            </span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <Link
          href="/map"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-blue-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Map
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">Homework Night 🎓</h1>
          <p className="mt-1 text-zinc-500">
            Share your screen so your partner can follow along — great for notes on your iPad!
          </p>
        </div>

        {/* Status bar */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className={`h-2.5 w-2.5 rounded-full ${
            mode === "idle" ? "bg-zinc-500" : mode === "hosting" ? "bg-emerald-400 animate-pulse" : "bg-blue-400 animate-pulse"
          }`} />
          <span className="text-sm text-zinc-300">{status}</span>
          {mode !== "idle" && (
            <span className="ml-auto rounded-full bg-white/[0.06] px-3 py-0.5 text-[11px] font-medium text-zinc-400">
              {mode === "hosting" ? "📡 Hosting" : "👀 Viewing"}
            </span>
          )}
        </div>

        {/* Action buttons (idle state) */}
        {mode === "idle" && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <button
              onClick={startSharing}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-8 transition-all hover:border-blue-500/40 hover:bg-blue-500/[0.1]"
            >
              <span className="text-4xl">📡</span>
              <span className="text-lg font-semibold text-white">Share My Screen</span>
              <span className="text-xs text-zinc-500">
                Share your iPad, notes, or any window
              </span>
            </button>
            <button
              onClick={startViewing}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-8 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/[0.1]"
            >
              <span className="text-4xl">👀</span>
              <span className="text-lg font-semibold text-white">Watch Stream</span>
              <span className="text-xs text-zinc-500">
                View your partner&apos;s shared screen
              </span>
            </button>
          </div>
        )}

        {/* Video area */}
        <div className="flex flex-1 flex-col">
          {mode === "hosting" && (
            <div className="flex flex-1 flex-col">
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-contain"
                />
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 backdrop-blur-md">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-white">Your Screen</span>
                </div>
              </div>
              <button
                onClick={stopSharing}
                className="mt-4 self-center rounded-full bg-red-500/15 px-6 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/25"
              >
                Stop Sharing
              </button>
            </div>
          )}

          {mode === "viewing" && (
            <div className="flex flex-1 flex-col">
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
                {!session?.offer && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-500/30 border-t-blue-500" />
                    <span className="text-sm text-zinc-500">Waiting for host to share…</span>
                  </div>
                )}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 backdrop-blur-md">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                  <span className="text-xs font-medium text-white">Live</span>
                </div>
              </div>
              <button
                onClick={() => { cleanup(); setMode("idle"); setSession(null); setStatus("Ready to start"); }}
                className="mt-4 self-center rounded-full bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.1]"
              >
                Leave
              </button>
            </div>
          )}

          {mode === "idle" && (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
              <div className="flex flex-col items-center gap-2 py-16">
                <span className="text-5xl opacity-30">🎓</span>
                <span className="text-sm text-zinc-600">
                  Share your screen or watch your partner&apos;s
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
