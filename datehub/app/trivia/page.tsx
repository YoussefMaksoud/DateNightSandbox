"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameRoom, GameRoomDto } from "@/hooks/useGameRoom";

// --- Types ---

interface TriviaQuestionDto {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: string;
  funFact: string;
}

type GameView = "playing" | "round-result" | "game-over";

// --- Constants ---

const CATEGORIES = [
  { id: "general", label: "General", emoji: "🌍" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "history", label: "History", emoji: "📜" },
  { id: "pop-culture", label: "Pop Culture", emoji: "⭐" },
  { id: "geography", label: "Geography", emoji: "🗺️" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "movies-tv", label: "Movies & TV", emoji: "🎬" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "food-drink", label: "Food & Drink", emoji: "🍕" },
  { id: "animals", label: "Animals", emoji: "🐾" },
  { id: "couples", label: "Couples", emoji: "💕" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", emoji: "😊", desc: "Casual & fun" },
  { id: "medium", label: "Medium", emoji: "🤔", desc: "A fair challenge" },
  { id: "hard", label: "Hard", emoji: "🧠", desc: "Expert level" },
];

const MODES = [
  { id: "classic", label: "Classic", emoji: "🎯", desc: "Answer all rounds, highest score wins", timeLimit: 20 },
  { id: "speed", label: "Speed Round", emoji: "⚡", desc: "Half the time! Quick thinking only", timeLimit: 10 },
  { id: "survival", label: "Survival", emoji: "❤️", desc: "3 lives — wrong answer costs a life", timeLimit: 20 },
];

// --- Main ---

export default function TriviaPage() {
  const {
    room, phase, countdown, creating, joining, error,
    isLoaded, userId, isPlayer1,
    createRoom, joinRoom, readyUp, startSolo, refreshRoom, resetRoom,
  } = useGameRoom("trivia", {
    onGameStart: (roomData) => startGame(roomData),
  });

  const [category, setCategory] = useState("general");
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode] = useState("classic");
  const [totalRounds, setTotalRounds] = useState(10);
  const [joinCode, setJoinCode] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gameView, setGameView] = useState<GameView | null>(null);

  // Game state
  const [question, setQuestion] = useState<TriviaQuestionDto | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Round result state
  const [roundResult, setRoundResult] = useState<{
    player1Correct: boolean;
    player2Correct: boolean;
    correctAnswer: string;
    funFact: string;
    gameOver: boolean;
  } | null>(null);

  // Stats tracking
  const [myBestStreak, setMyBestStreak] = useState(0);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [resultSaved, setResultSaved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const questionTimeRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Metadata helper
  const meta = room?.metadata ?? {};

  const getTimeLimit = useCallback(() => {
    const currentMode = (meta.mode as string) ?? mode;
    const m = MODES.find((md) => md.id === currentMode);
    return m?.timeLimit ?? 20;
  }, [meta.mode, mode]);

  // --- Lobby handlers ---

  async function handleCreateSolo() {
    await startSolo({ category, difficulty, mode, totalRounds });
  }

  async function handleCreate() {
    await createRoom({ category, difficulty, mode, totalRounds });
  }

  async function handleJoinRoom() {
    if (!joinCode.trim()) return;
    await joinRoom(joinCode.trim());
  }

  async function handleReady() {
    await readyUp();
  }

  // --- Game ---

  async function startGame(roomData: GameRoomDto) {
    setGameView("playing");
    setPreviousQuestions([]);
    setMyBestStreak(0);
    setAnswerTimes([]);

    await fetch("/api/trivia/room/start", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: roomData.roomId }),
    });

    await loadNextQuestion(roomData.roomId, []);
  }

  async function loadNextQuestion(roomId: string, prevQs: string[]) {
    setLoading(true);
    setSelectedAnswer(null);
    setAnswered(false);
    setRoundResult(null);

    const res = await fetch("/api/trivia/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, previousQuestions: prevQs }),
    });

    if (res.ok) {
      const data = await res.json();
      setQuestion(data.question);
      questionTimeRef.current = performance.now();

      const limit = getTimeLimit();
      setTimeLeft(limit);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp(roomId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setLoading(false);
  }

  function handleTimeUp(roomId: string) {
    if (answered) return;
    setAnswered(true);
    const timeTaken = getTimeLimit();
    submitAndScore(roomId, "-1", timeTaken);
  }

  async function handleAnswer(index: number) {
    if (answered || !room || !question) return;
    setSelectedAnswer(index);
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = (performance.now() - questionTimeRef.current) / 1000;
    setAnswerTimes((prev) => [...prev, timeTaken]);

    await submitAndScore(room.roomId, String(index), timeTaken);
  }

  async function submitAndScore(roomId: string, answer: string, timeTaken: number) {
    await fetch("/api/trivia/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, answer, timeTaken }),
    });

    const isSolo = !room?.player2Id;

    if (isSolo) {
      await scoreRound(roomId);
    } else {
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/room?roomId=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            const m = data.room.metadata;
            if (m.player1Answer !== null && m.player2Answer !== null) {
              clearInterval(pollRef.current);
              await scoreRound(roomId);
            }
          }
        }
      }, 500);
    }
  }

  async function scoreRound(roomId: string) {
    const res = await fetch("/api/trivia/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });

    if (res.ok) {
      const data = await res.json();
      await refreshRoom();

      setRoundResult({
        player1Correct: data.player1Correct,
        player2Correct: data.player2Correct,
        correctAnswer: data.correctAnswer,
        funFact: data.funFact,
        gameOver: data.gameOver,
      });

      const m = data.room.metadata;
      const streak = isPlayer1 ? (m.player1Streak as number) : (m.player2Streak as number);
      if (streak > myBestStreak) setMyBestStreak(streak);

      if (question) {
        setPreviousQuestions((prev) => [...prev, question.question]);
      }

      setGameView("round-result");

      if (data.gameOver) {
        setTimeout(() => setGameView("game-over"), 3000);
      }
    }
  }

  function handleNextRound() {
    if (!room) return;
    setGameView("playing");
    loadNextQuestion(room.roomId, previousQuestions);
  }

  async function handleSaveResult() {
    if (!room || resultSaved) return;
    const score = isPlayer1 ? (meta.player1Score as number) : (meta.player2Score as number);
    const opp = isPlayer1 ? (meta.player2Score as number) : (meta.player1Score as number);
    const avgTime = answerTimes.length > 0 ? answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length : 0;

    await fetch("/api/trivia/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: room.roomId,
        category: meta.category as string,
        mode: meta.mode as string,
        difficulty: meta.difficulty as string,
        score,
        totalRounds: meta.currentRound as number,
        bestStreak: myBestStreak,
        avgTime: Math.round(avgTime * 100) / 100,
        won: !room.player2Id || score > opp,
      }),
    });
    setResultSaved(true);
  }

  function handlePlayAgain() {
    resetRoom();
    setGameView(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setAnswered(false);
    setRoundResult(null);
    setPreviousQuestions([]);
    setMyBestStreak(0);
    setAnswerTimes([]);
    setResultSaved(false);
    setTimeLeft(20);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // --- Loading ---

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-orange-500/30 border-t-orange-500" />
      </div>
    );
  }

  // --- Computed ---

  const myScore = meta.player1Score !== undefined
    ? (isPlayer1 ? (meta.player1Score as number) : (meta.player2Score as number))
    : 0;
  const oppScore = meta.player1Score !== undefined
    ? (isPlayer1 ? (meta.player2Score as number) : (meta.player1Score as number))
    : 0;
  const myStreak = isPlayer1 ? ((meta.player1Streak as number) ?? 0) : ((meta.player2Streak as number) ?? 0);
  const myLives = isPlayer1 ? ((meta.player1Lives as number) ?? 3) : ((meta.player2Lives as number) ?? 3);
  const myCorrect = roundResult ? (isPlayer1 ? roundResult.player1Correct : roundResult.player2Correct) : false;
  const timeLimit = getTimeLimit();

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-orange-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/[0.02] blur-[80px]" />
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
            <span className="text-lg font-bold">🧩 Trivia Tower</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* --- LOBBY VIEW --- */}
        {(phase === "idle" || phase === "lobby") && !gameView && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">🧩 Trivia Tower</h1>
              <p className="mt-2 text-zinc-500">Test your knowledge with AI-generated questions</p>
            </div>

            {/* How to Play */}
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="p-0">
                <button
                  onClick={() => setShowHowToPlay(!showHowToPlay)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📖</span>
                    <span className="font-semibold">How to Play</span>
                  </div>
                  <span className={`text-zinc-500 transition-transform ${showHowToPlay ? "rotate-180" : ""}`}>▼</span>
                </button>
                {showHowToPlay && (
                  <div className="space-y-4 border-t border-white/[0.06] px-5 pb-5 pt-4 text-sm text-zinc-400">
                    <div>
                      <h3 className="mb-1 font-semibold text-white">🎯 Game Modes</h3>
                      <ul className="ml-4 list-disc space-y-1">
                        <li><span className="text-orange-400">Classic</span> — Answer all rounds at your own pace (20s per question). Highest score wins!</li>
                        <li><span className="text-yellow-400">Speed Round</span> — Only 10 seconds per question! Think fast, answer faster.</li>
                        <li><span className="text-red-400">Survival</span> — You get 3 lives (❤️). Each wrong answer costs one. How far can you go?</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">📊 Scoring</h3>
                      <ul className="ml-4 list-disc space-y-1">
                        <li><span className="text-emerald-400">+100 points</span> for each correct answer</li>
                        <li><span className="text-orange-400">🔥 Streak Bonus</span> — Get 3+ correct in a row for +50 bonus per extra streak (up to +250!)</li>
                        <li><span className="text-blue-400">⚡ Speed Bonus</span> — Answer under 5 seconds for up to +100 extra points</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">🤝 Multiplayer</h3>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Create a room and share the code with your partner</li>
                        <li>Both players answer each question — see who&apos;s faster and smarter!</li>
                        <li>Compare scores round by round</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">🧠 AI-Powered</h3>
                      <p>Every question is uniquely generated by AI — no repeats, no memorization, just pure trivia fun! Each question comes with a fun fact you can learn together.</p>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">📋 Categories</h3>
                      <p>Choose from 11 categories including Couples Trivia for romantic fun, or General Knowledge for a bit of everything!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!room ? (
              <>
                {/* Category selection */}
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">Category</h2>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
                          category === cat.id
                            ? "border-orange-500/50 bg-orange-500/10 text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-[11px] font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty selection */}
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">Difficulty</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDifficulty(d.id)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition-all ${
                          difficulty === d.id
                            ? "border-orange-500/50 bg-orange-500/10 text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className="text-2xl">{d.emoji}</span>
                        <span className="text-sm font-semibold">{d.label}</span>
                        <span className="text-[10px] text-zinc-600">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode selection */}
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">Game Mode</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition-all ${
                          mode === m.id
                            ? "border-orange-500/50 bg-orange-500/10 text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-sm font-semibold">{m.label}</span>
                        <span className="text-[10px] text-zinc-600">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Round count */}
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">Rounds</h2>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setTotalRounds(Math.max(5, totalRounds - 5))} className="border-white/[0.1] bg-white/[0.03]">-</Button>
                    <span className="w-12 text-center text-xl font-bold text-orange-400">{totalRounds}</span>
                    <Button variant="outline" size="sm" onClick={() => setTotalRounds(Math.min(30, totalRounds + 5))} className="border-white/[0.1] bg-white/[0.03]">+</Button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Button onClick={handleCreateSolo} disabled={creating} className="bg-orange-600 hover:bg-orange-700">
                    {creating ? "Starting…" : "🎯 Solo Play"}
                  </Button>
                  <Button onClick={handleCreate} disabled={creating} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    {creating ? "Creating…" : "🤝 Create Room"}
                  </Button>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Room code"
                      className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
                    />
                    <Button onClick={handleJoinRoom} disabled={joining || !joinCode.trim()} className="bg-blue-600 hover:bg-blue-700">
                      Join
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Waiting room */
              <Card className="border-white/[0.06] bg-white/[0.02]">
                <CardContent className="space-y-6 p-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold">Room: <span className="text-orange-400">{room.roomId}</span></h2>
                    <p className="mt-1 text-sm text-zinc-500">Share this code with your partner</p>
                    <div className="mt-3 flex items-center justify-center gap-4 text-sm text-zinc-400">
                      <span>{CATEGORIES.find((c) => c.id === (meta.category as string))?.emoji} {meta.category as string}</span>
                      <span>·</span>
                      <span>{meta.difficulty as string}</span>
                      <span>·</span>
                      <span>{meta.mode as string}</span>
                      <span>·</span>
                      <span>{meta.totalRounds as number} rounds</span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${room.player1Ready ? "border-orange-500/30 bg-orange-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🧠</span>
                        <div>
                          <p className="font-semibold">{isPlayer1 ? "You" : "Player 1"}</p>
                          <p className="text-xs text-zinc-500">{room.player1Ready ? "✅ Ready" : "⏳ Waiting"}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-xl border p-4 ${room.player2Ready ? "border-blue-500/30 bg-blue-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{room.player2Id ? "🧠" : "❓"}</span>
                        <div>
                          <p className="font-semibold">{room.player2Id ? (room.player2Id === userId ? "You" : "Player 2") : "Waiting for opponent…"}</p>
                          <p className="text-xs text-zinc-500">{room.player2Id ? (room.player2Ready ? "✅ Ready" : "⏳ Waiting") : "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {room.player2Id && (
                    <div className="text-center">
                      {((isPlayer1 && !room.player1Ready) ||
                        (room.player2Id === userId && !room.player2Ready)) ? (
                        <Button onClick={handleReady} className="bg-orange-600 px-8 hover:bg-orange-700">
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
        {phase === "countdown" && !gameView && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div
                className="text-[120px] font-black transition-all"
                style={{
                  color: countdown === 0 ? "#F97316" : "#ffffff",
                  textShadow: countdown === 0 ? "0 0 60px #F97316" : "0 0 40px rgba(255,255,255,0.3)",
                }}
              >
                {countdown === 0 ? "GO!" : countdown}
              </div>
              <p className="mt-4 text-zinc-500">Get ready for trivia!</p>
            </div>
          </div>
        )}

        {/* --- PLAYING VIEW --- */}
        {gameView === "playing" && (
          <div className="space-y-6">
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold text-orange-400">
                  Round {(meta.currentRound as number) ?? 0} / {(meta.totalRounds as number) ?? 10}
                </span>
                <span className="text-sm font-bold text-white">
                  Score: <span className="text-orange-400">{myScore}</span>
                </span>
                {room?.player2Id && (
                  <span className="text-sm text-zinc-500">
                    vs <span className="text-blue-400">{oppScore}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {myStreak >= 3 && (
                  <span className="animate-pulse text-sm font-bold text-orange-400">
                    🔥 {myStreak} streak!
                  </span>
                )}
                {(meta.mode as string) === "survival" && (
                  <span className="text-sm">
                    {Array.from({ length: Math.max(0, myLives) }).map((_, i) => <span key={i}>❤️</span>)}
                    {Array.from({ length: Math.max(0, 3 - myLives) }).map((_, i) => <span key={i} className="opacity-20">❤️</span>)}
                  </span>
                )}
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(timeLeft / timeLimit) * 100}%`,
                  backgroundColor: timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#F97316",
                }}
              />
            </div>
            <div className="text-right font-mono text-sm text-zinc-500">{timeLeft}s</div>

            {/* Question */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-orange-500/30 border-t-orange-500" />
                  <span className="text-sm text-zinc-500">Generating question…</span>
                </div>
              </div>
            ) : question ? (
              <Card className="border-white/[0.06] bg-white/[0.02]">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{CATEGORIES.find((c) => c.id === question.category)?.emoji}</span>
                    <span className="capitalize">{question.category}</span>
                    <span>·</span>
                    <span className="capitalize">{question.difficulty}</span>
                  </div>
                  <h2 className="mb-6 text-xl font-bold leading-relaxed">{question.question}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {question.options.map((option, i) => {
                      let btnClass = "border-white/[0.08] bg-white/[0.03] hover:border-orange-500/40 hover:bg-orange-500/5";
                      if (answered) {
                        if (i === question.correctIndex) {
                          btnClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                        } else if (i === selectedAnswer && i !== question.correctIndex) {
                          btnClass = "border-red-500/50 bg-red-500/10 text-red-300";
                        } else {
                          btnClass = "border-white/[0.04] bg-white/[0.01] opacity-50";
                        }
                      } else if (i === selectedAnswer) {
                        btnClass = "border-orange-500/50 bg-orange-500/10";
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(i)}
                          disabled={answered}
                          className={`rounded-xl border p-4 text-left transition-all ${btnClass}`}
                        >
                          <span className="mr-2 inline-block h-6 w-6 rounded-full border border-white/[0.15] text-center text-xs font-bold leading-6">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        {/* --- ROUND RESULT VIEW --- */}
        {gameView === "round-result" && roundResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl">{myCorrect ? "✅" : "❌"}</div>
              <h2 className="mt-3 text-2xl font-bold">
                {myCorrect ? "Correct!" : "Wrong!"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                The answer was: <span className="font-semibold text-emerald-400">{roundResult.correctAnswer}</span>
              </p>
            </div>

            {/* Fun fact */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Fun Fact</p>
                    <p className="mt-1 text-sm text-zinc-300">{roundResult.funFact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scores */}
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="p-5">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">You</p>
                    <p className="text-2xl font-bold text-orange-400">{myScore}</p>
                    {myStreak >= 3 && <p className="mt-1 text-xs text-orange-400">🔥 {myStreak} streak</p>}
                  </div>
                  {room?.player2Id && (
                    <>
                      <div className="text-zinc-700">vs</div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">Opponent</p>
                        <p className="text-2xl font-bold text-blue-400">{oppScore}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {isPlayer1
                            ? (roundResult.player2Correct ? "✅ Correct" : "❌ Wrong")
                            : (roundResult.player1Correct ? "✅ Correct" : "❌ Wrong")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {!roundResult.gameOver && (
              <div className="text-center">
                <Button onClick={handleNextRound} className="bg-orange-600 px-8 hover:bg-orange-700">
                  Next Question →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* --- GAME OVER VIEW --- */}
        {gameView === "game-over" && room && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-6xl">🏆</div>
              <h1 className="mt-4 text-3xl font-bold">Game Complete!</h1>
              {room.player2Id && (
                <p className="mt-2 text-lg">
                  {myScore > oppScore ? (
                    <span className="text-yellow-400">🎉 You Won!</span>
                  ) : myScore < oppScore ? (
                    <span className="text-blue-400">Better luck next time!</span>
                  ) : (
                    <span className="text-zinc-400">It&apos;s a tie!</span>
                  )}
                </p>
              )}
            </div>

            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={`rounded-xl border p-5 ${!room.player2Id || myScore >= oppScore ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-400">You</p>
                      <p className="mt-2 text-4xl font-bold text-orange-400">{myScore}</p>
                      <p className="mt-1 text-xs text-zinc-500">points</p>
                    </div>
                  </div>
                  {room.player2Id && (
                    <div className={`rounded-xl border p-5 ${oppScore > myScore ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-zinc-400">Opponent</p>
                        <p className="mt-2 text-4xl font-bold text-blue-400">{oppScore}</p>
                        <p className="mt-1 text-xs text-zinc-500">points</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">🔥 {myBestStreak}</p>
                    <p className="text-[11px] text-zinc-500">Best Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{(meta.currentRound as number) ?? 0}</p>
                    <p className="text-[11px] text-zinc-500">Rounds Played</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {answerTimes.length > 0 ? (answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length).toFixed(1) : "0"}s
                    </p>
                    <p className="text-[11px] text-zinc-500">Avg Time</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {!resultSaved && (
                    <Button onClick={handleSaveResult} className="bg-yellow-600 hover:bg-yellow-700">
                      💾 Save to Leaderboard
                    </Button>
                  )}
                  {resultSaved && (
                    <span className="text-sm text-emerald-400">✅ Saved!</span>
                  )}
                  <Button onClick={handlePlayAgain} className="bg-orange-600 hover:bg-orange-700">
                    🔄 Play Again
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
