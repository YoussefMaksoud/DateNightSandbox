"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// --- Types ---

interface RaceRoomDto {
  roomId: string;
  player1Id: string;
  player2Id: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  lapCount: number;
  status: string;
  player1Lap: number;
  player2Lap: number;
  player1T: number;
  player2T: number;
  player1Time: number | null;
  player2Time: number | null;
  startedAt: string | null;
}

interface VehicleStats {
  speed: number;
  weight: number;
  acceleration: number;
}

interface VehicleBuildDto {
  engine: string;
  tires: string;
  body: string;
  spoiler: string;
  nitro: string;
  stats: VehicleStats;
}

type View = "lobby" | "countdown" | "racing" | "results";

// --- Track geometry ---

const RAW_TRACK_POINTS: [number, number][] = [
  [12, -16], [14, 0], [12, 17], [0, 22],
  [-12, 17], [-14, 0], [-12, -16], [0, -20],
];

function buildCatmullRomLoop(raw: [number, number][], segments: number) {
  const pts = [...raw, raw[0], raw[1], raw[2]];
  const result: { x: number; y: number }[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    for (let t = 0; t < segments; t++) {
      const f = t / segments;
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
      const tt = f * f, ttt = tt * f;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * f + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * tt + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * ttt);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * f + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * tt + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * ttt);
      result.push({ x, y });
    }
  }
  return result;
}

const TRACK_SEGMENTS = 400;
const TRACK_CURVE = buildCatmullRomLoop(RAW_TRACK_POINTS, Math.ceil(TRACK_SEGMENTS / RAW_TRACK_POINTS.length));

function getTrackPoint(t: number) {
  const normalized = ((t % 1) + 1) % 1;
  const idx = normalized * TRACK_CURVE.length;
  const i0 = Math.floor(idx) % TRACK_CURVE.length;
  const i1 = (i0 + 1) % TRACK_CURVE.length;
  const frac = idx - Math.floor(idx);
  return {
    x: TRACK_CURVE[i0].x + (TRACK_CURVE[i1].x - TRACK_CURVE[i0].x) * frac,
    y: TRACK_CURVE[i0].y + (TRACK_CURVE[i1].y - TRACK_CURVE[i0].y) * frac,
  };
}

function getTrackTangent(t: number) {
  const dt = 0.001;
  const p0 = getTrackPoint(t);
  const p1 = getTrackPoint(t + dt);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return { dx: dx / len, dy: dy / len };
}

// --- Canvas helpers ---

const CANVAS_W = 900;
const CANVAS_H = 700;
const SCALE = 14;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

function toCanvas(x: number, y: number) {
  return { cx: CX + x * SCALE, cy: CY + y * SCALE };
}

// --- Main component ---

export default function RacePage() {
  const { user, isLoaded } = useUser();

  const [view, setView] = useState<View>("lobby");
  const [room, setRoom] = useState<RaceRoomDto | null>(null);
  const [myBuild, setMyBuild] = useState<VehicleBuildDto | null>(null);
  const [lapCount, setLapCount] = useState(3);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [myFinishTime, setMyFinishTime] = useState<number | null>(null);
  const [opponentFinishTime, setOpponentFinishTime] = useState<number | null>(null);
  const [resultSaved, setResultSaved] = useState(false);

  // Game state refs (for the animation loop)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    myT: 0,
    mySpeed: 0,
    myLap: 0,
    myLateral: 0,
    opponentT: 0,
    opponentTargetT: 0,
    opponentLap: 0,
    keys: { w: false, a: false, s: false, d: false },
    startTime: 0,
    finished: false,
    finishTime: 0,
  });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const positionSyncRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Fetch vehicle build
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/vehicle-build")
      .then((r) => r.json())
      .then((d) => setMyBuild(d.build))
      .catch(() => {});
  }, [isLoaded, user]);

  // --- Lobby ---

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/race/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lapCount }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
    setCreating(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    const res = await fetch("/api/race/room/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: joinCode.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
    setJoining(false);
  }

  async function handleReady() {
    if (!room) return;
    const res = await fetch("/api/race/room/ready", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.roomId, ready: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
    }
  }

  // Poll room state in lobby
  useEffect(() => {
    if (!room || view !== "lobby") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/race/room?roomId=${room.roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          setRoom(data.room);
          if (data.room.player1Ready && data.room.player2Ready && data.room.player2Id) {
            clearInterval(interval);
            startCountdown(data.room);
          }
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [room?.roomId, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Countdown ---

  function startCountdown(roomData: RaceRoomDto) {
    setView("countdown");
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown(0);
      } else {
        clearInterval(interval);
        startRace(roomData);
      }
    }, 1000);
  }

  // --- Racing ---

  function startRace(roomData: RaceRoomDto) {
    setView("racing");
    setRoom(roomData);

    // Update server status
    fetch("/api/race/room/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: roomData.roomId, status: "racing" }),
    });

    const game = gameRef.current;
    game.myT = 0;
    game.mySpeed = 0;
    game.myLap = 0;
    game.myLateral = 0;
    game.opponentT = 0;
    game.opponentTargetT = 0;
    game.opponentLap = 0;
    game.startTime = performance.now();
    game.finished = false;
    game.finishTime = 0;

    lastTimeRef.current = performance.now();

    // Race timer
    timerRef.current = setInterval(() => {
      setRaceTime((performance.now() - game.startTime) / 1000);
    }, 100);

    // Position sync - send my position every 200ms
    positionSyncRef.current = setInterval(() => {
      if (gameRef.current.finished) return;
      fetch("/api/race/room/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomData.roomId, position: gameRef.current.myT }),
      });
    }, 200);

    // Opponent poll
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/race/room?roomId=${roomData.roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          const r = data.room as RaceRoomDto;
          const isP1 = r.player1Id === user?.id;
          game.opponentLap = isP1 ? r.player2Lap : r.player1Lap;
          const oppTime = isP1 ? r.player2Time : r.player1Time;
          if (oppTime !== null) {
            setOpponentFinishTime(oppTime);
          }
          const oppT = isP1 ? r.player2T : r.player1T;
          game.opponentTargetT = oppT;

          if (r.status === "finished") {
            endRace(r);
          }
        }
      }
    }, 300);

    // Start game loop
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }

  const gameLoop = useCallback((now: number) => {
    const delta = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;

    const game = gameRef.current;
    if (game.finished) return;

    const stats = myBuild?.stats ?? { speed: 30, weight: 50, acceleration: 30 };
    const maxSpeed = 0.08 + (stats.speed / 100) * 0.15;
    const accel = 0.03 + (stats.acceleration / 100) * 0.08;
    const steerSpeed = 3.5 - (stats.weight / 100) * 1.5;

    // Input handling
    if (game.keys.w) {
      game.mySpeed = Math.min(maxSpeed, game.mySpeed + accel * delta);
    } else if (game.keys.s) {
      game.mySpeed = Math.max(0, game.mySpeed - accel * 2 * delta);
    } else {
      game.mySpeed = Math.max(0, game.mySpeed - accel * 0.5 * delta);
    }

    if (game.keys.a) game.myLateral = Math.max(-1, game.myLateral - steerSpeed * delta);
    if (game.keys.d) game.myLateral = Math.min(1, game.myLateral + steerSpeed * delta);
    if (!game.keys.a && !game.keys.d) {
      game.myLateral *= (1 - 3 * delta);
    }

    // Interpolate opponent position
    game.opponentT += (game.opponentTargetT - game.opponentT) * 5 * delta;

    // Update position
    game.myT += game.mySpeed * delta;

    // Check lap completion
    if (Math.floor(game.myT) > game.myLap) {
      game.myLap = Math.floor(game.myT);

      // Report lap to server
      if (room) {
        fetch("/api/race/room/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.roomId, lap: game.myLap }),
        });
      }

      // Check finish
      if (game.myLap >= (room?.lapCount ?? 3)) {
        game.finished = true;
        game.finishTime = (performance.now() - game.startTime) / 1000;
        setMyFinishTime(game.finishTime);

        if (room) {
          fetch("/api/race/room/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: room.roomId, finishTime: game.finishTime }),
          });
        }

        // Wait for opponent or timeout
        setTimeout(() => {
          setView("results");
          cleanup();
        }, 2000);
        return;
      }
    }

    // Draw
    draw(game);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [myBuild, room, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function draw(game: typeof gameRef.current) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw track
    ctx.beginPath();
    for (let i = 0; i <= TRACK_CURVE.length; i++) {
      const pt = TRACK_CURVE[i % TRACK_CURVE.length];
      const c = toCanvas(pt.x, pt.y);
      if (i === 0) ctx.moveTo(c.cx, c.cy);
      else ctx.lineTo(c.cx, c.cy);
    }
    ctx.closePath();
    ctx.strokeStyle = "#333340";
    ctx.lineWidth = 50;
    ctx.stroke();

    // Track curbs (red)
    ctx.strokeStyle = "#cc3333";
    ctx.lineWidth = 54;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Center line (white dashed)
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = "#ffffff30";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Start/finish line
    const startPt = getTrackPoint(0);
    const startTan = getTrackTangent(0);
    const sc = toCanvas(startPt.x, startPt.y);
    const perpX = -startTan.dy * 25;
    const perpY = startTan.dx * 25;
    ctx.beginPath();
    ctx.moveTo(sc.cx - perpX, sc.cy - perpY);
    ctx.lineTo(sc.cx + perpX, sc.cy + perpY);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Checkered squares at start
    for (let i = -3; i <= 3; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          const px = sc.cx + perpX * (i / 3) + startTan.dx * (j * 6 - 3);
          const py = sc.cy + perpY * (i / 3) + startTan.dy * (j * 6 - 3);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(px - 3, py - 3, 6, 6);
        }
      }
    }

    // Draw opponent car (estimated position)
    const oppT = game.opponentT;
    const oppPt = getTrackPoint(oppT % 1);
    const oppTan = getTrackTangent(oppT % 1);
    const oppC = toCanvas(oppPt.x, oppPt.y);
    const oppAngle = Math.atan2(oppTan.dy, oppTan.dx);
    drawCar(ctx, oppC.cx, oppC.cy, oppAngle, "#3B82F6", "P2");

    // Draw my car
    const myPt = getTrackPoint(game.myT % 1);
    const myTan = getTrackTangent(game.myT % 1);
    const lateralPerpX = -myTan.dy * game.myLateral * 15;
    const lateralPerpY = myTan.dx * game.myLateral * 15;
    const myC = toCanvas(myPt.x + lateralPerpX / SCALE, myPt.y + lateralPerpY / SCALE);
    const myAngle = Math.atan2(myTan.dy, myTan.dx);
    drawCar(ctx, myC.cx, myC.cy, myAngle, "#22C55E", "You");

    // HUD
    drawHUD(ctx, game);
  }

  function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, label: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Car body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - 14);
  }

  function drawHUD(ctx: CanvasRenderingContext2D, game: typeof gameRef.current) {
    const laps = room?.lapCount ?? 3;
    const currentLap = Math.min(game.myLap + 1, laps);
    const elapsed = (performance.now() - game.startTime) / 1000;

    // Lap counter (top-left)
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, 10, 140, 40);
    ctx.fillStyle = "#22C55E";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Lap ${currentLap} / ${laps}`, 20, 37);

    // Timer (top-center)
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(CANVAS_W / 2 - 60, 10, 120, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText(elapsed.toFixed(1) + "s", CANVAS_W / 2, 38);

    // Speed (top-right)
    const speedPct = Math.round((game.mySpeed / 0.23) * 100);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(CANVAS_W - 150, 10, 140, 40);
    ctx.fillStyle = speedPct > 70 ? "#EF4444" : "#ffffff";
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(`⚡ ${Math.min(speedPct, 100)}%`, CANVAS_W - 20, 37);

    // Opponent info (bottom-left)
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, CANVAS_H - 50, 180, 40);
    ctx.fillStyle = "#3B82F6";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`🏎️ Opponent: Lap ${Math.min(game.opponentLap + 1, laps)}`, 20, CANVAS_H - 25);

    // Minimap (bottom-right)
    const mmSize = 100;
    const mmX = CANVAS_W - mmSize - 15;
    const mmY = CANVAS_H - mmSize - 15;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmSize, mmSize);

    // Minimap track
    ctx.beginPath();
    for (let i = 0; i <= TRACK_CURVE.length; i++) {
      const pt = TRACK_CURVE[i % TRACK_CURVE.length];
      const mx = mmX + mmSize / 2 + pt.x * 3;
      const my = mmY + mmSize / 2 + pt.y * 2.2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Minimap cars
    const myPtMM = getTrackPoint(game.myT % 1);
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.arc(mmX + mmSize / 2 + myPtMM.x * 3, mmY + mmSize / 2 + myPtMM.y * 2.2, 3, 0, Math.PI * 2);
    ctx.fill();

    const oppPtMM = getTrackPoint(game.opponentT % 1);
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.arc(mmX + mmSize / 2 + oppPtMM.x * 3, mmY + mmSize / 2 + oppPtMM.y * 2.2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function endRace(roomData: RaceRoomDto) {
    cleanup();
    setRoom(roomData);
    setView("results");
  }

  function cleanup() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (positionSyncRef.current) clearInterval(positionSyncRef.current);
  }

  // Keyboard events for racing
  useEffect(() => {
    if (view !== "racing") return;
    const game = gameRef.current;
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") game.keys.w = true;
      if (key === "a" || key === "arrowleft") game.keys.a = true;
      if (key === "s" || key === "arrowdown") game.keys.s = true;
      if (key === "d" || key === "arrowright") game.keys.d = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") game.keys.w = false;
      if (key === "a" || key === "arrowleft") game.keys.a = false;
      if (key === "s" || key === "arrowdown") game.keys.s = false;
      if (key === "d" || key === "arrowright") game.keys.d = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [view]);

  // Cleanup on unmount
  useEffect(() => cleanup, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveResult() {
    if (!room || !myFinishTime || resultSaved) return;
    const isP1 = room.player1Id === user?.id;
    const oppTime = isP1 ? room.player2Time : room.player1Time;
    const won = oppTime === null || myFinishTime < oppTime;
    await fetch("/api/race/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.roomId,
        lapCount: room.lapCount,
        finishTime: myFinishTime,
        won,
      }),
    });
    setResultSaved(true);
  }

  function handleRaceAgain() {
    setView("lobby");
    setRoom(null);
    setMyFinishTime(null);
    setOpponentFinishTime(null);
    setResultSaved(false);
    setRaceTime(0);
    setCountdown(3);
  }

  // --- Loading ---

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-500/30 border-t-emerald-500" />
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-green-500/[0.02] blur-[80px]" />
      </div>

      {/* Header */}
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
            <span className="text-lg font-bold">🏁 Race Track</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* --- LOBBY VIEW --- */}
        {view === "lobby" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">🏁 Race Lobby</h1>
              <p className="mt-2 text-zinc-500">Create or join a race room</p>
            </div>

            {/* Vehicle stats preview */}
            {myBuild && (
              <Card className="border-white/[0.06] bg-white/[0.02]">
                <CardContent className="p-5">
                  <p className="mb-3 text-sm font-semibold text-zinc-400">Your Vehicle</p>
                  <div className="flex items-center gap-6">
                    <div className="text-4xl">🏎️</div>
                    <div className="flex flex-1 gap-6">
                      {[
                        { label: "Speed", value: myBuild.stats.speed, color: "#22C55E" },
                        { label: "Accel", value: myBuild.stats.acceleration, color: "#3B82F6" },
                        { label: "Weight", value: myBuild.stats.weight, color: "#EF4444" },
                      ].map((s) => (
                        <div key={s.label} className="flex-1">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-zinc-500">{s.label}</span>
                            <span style={{ color: s.color }}>{s.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!room ? (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Create room */}
                <Card className="border-white/[0.06] bg-white/[0.02]">
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-lg font-semibold">Create Room</h2>
                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Lap Count</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLapCount(Math.max(1, lapCount - 1))}
                          className="border-white/[0.1] bg-white/[0.03]"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-xl font-bold text-emerald-400">{lapCount}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLapCount(Math.min(10, lapCount + 1))}
                          className="border-white/[0.1] bg-white/[0.03]"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {creating ? "Creating…" : "Create Race Room"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Join room */}
                <Card className="border-white/[0.06] bg-white/[0.02]">
                  <CardContent className="space-y-4 p-6">
                    <h2 className="text-lg font-semibold">Join Room</h2>
                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Room Code</label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Enter room code"
                        className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <Button
                      onClick={handleJoin}
                      disabled={joining || !joinCode.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {joining ? "Joining…" : "Join Race"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Waiting room */
              <Card className="border-white/[0.06] bg-white/[0.02]">
                <CardContent className="space-y-6 p-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold">Room: <span className="text-emerald-400">{room.roomId}</span></h2>
                    <p className="mt-1 text-sm text-zinc-500">Share this code with your opponent</p>
                    <p className="mt-2 text-sm text-zinc-400">Laps: {room.lapCount}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Player 1 */}
                    <div className={`rounded-xl border p-4 ${room.player1Ready ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏎️</span>
                        <div>
                          <p className="font-semibold">{room.player1Id === user?.id ? "You" : "Player 1"}</p>
                          <p className="text-xs text-zinc-500">{room.player1Ready ? "✅ Ready" : "⏳ Waiting"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div className={`rounded-xl border p-4 ${room.player2Ready ? "border-blue-500/30 bg-blue-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{room.player2Id ? "🏎️" : "❓"}</span>
                        <div>
                          <p className="font-semibold">{room.player2Id ? (room.player2Id === user?.id ? "You" : "Player 2") : "Waiting for opponent…"}</p>
                          <p className="text-xs text-zinc-500">
                            {room.player2Id ? (room.player2Ready ? "✅ Ready" : "⏳ Waiting") : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {room.player2Id && (
                    <div className="text-center">
                      {((room.player1Id === user?.id && !room.player1Ready) ||
                        (room.player2Id === user?.id && !room.player2Ready)) ? (
                        <Button onClick={handleReady} className="bg-emerald-600 px-8 hover:bg-emerald-700">
                          Ready Up!
                        </Button>
                      ) : (
                        <p className="text-sm text-zinc-500">Waiting for both players to ready up…</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* --- COUNTDOWN VIEW --- */}
        {view === "countdown" && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div
                className="text-[120px] font-black transition-all"
                style={{
                  color: countdown === 0 ? "#22C55E" : "#ffffff",
                  textShadow: countdown === 0 ? "0 0 60px #22C55E" : "0 0 40px rgba(255,255,255,0.3)",
                  animation: "pulse 0.5s ease-in-out",
                }}
              >
                {countdown === 0 ? "GO!" : countdown}
              </div>
              <p className="mt-4 text-zinc-500">Get ready to race!</p>
            </div>
          </div>
        )}

        {/* --- RACING VIEW --- */}
        {view === "racing" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="block"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
            <p className="text-xs text-zinc-600">WASD or Arrow keys to drive · W = accelerate · S = brake · A/D = steer</p>
          </div>
        )}

        {/* --- RESULTS VIEW --- */}
        {view === "results" && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-6xl">🏆</div>
              <h1 className="mt-4 text-3xl font-bold">Race Complete!</h1>
            </div>

            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* My result */}
                  <div className={`rounded-xl border p-5 ${myFinishTime && (!opponentFinishTime || myFinishTime <= opponentFinishTime) ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-400">You</p>
                      <p className="mt-2 text-3xl font-bold text-emerald-400">
                        {myFinishTime ? `${myFinishTime.toFixed(2)}s` : "DNF"}
                      </p>
                      {myFinishTime && (!opponentFinishTime || myFinishTime <= opponentFinishTime) && (
                        <p className="mt-1 text-sm text-yellow-400">🥇 Winner!</p>
                      )}
                    </div>
                  </div>

                  {/* Opponent result */}
                  <div className={`rounded-xl border p-5 ${opponentFinishTime && (!myFinishTime || opponentFinishTime < myFinishTime) ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-400">Opponent</p>
                      <p className="mt-2 text-3xl font-bold text-blue-400">
                        {opponentFinishTime ? `${opponentFinishTime.toFixed(2)}s` : "DNF"}
                      </p>
                      {opponentFinishTime && (!myFinishTime || opponentFinishTime < myFinishTime) && (
                        <p className="mt-1 text-sm text-yellow-400">🥇 Winner!</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {!resultSaved && myFinishTime && (
                    <Button onClick={handleSaveResult} className="bg-yellow-600 hover:bg-yellow-700">
                      💾 Save to Leaderboard
                    </Button>
                  )}
                  {resultSaved && (
                    <span className="text-sm text-emerald-400">✅ Saved!</span>
                  )}
                  <Button onClick={handleRaceAgain} className="bg-emerald-600 hover:bg-emerald-700">
                    🔄 Race Again
                  </Button>
                  <Link href="/map">
                    <Button variant="outline" className="border-white/[0.1]">
                      🗺️ Back to Map
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
