"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export interface GameRoomDto {
  roomId: string;
  type: string;
  player1Id: string;
  player2Id: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  status: string;
  metadata: Record<string, unknown>;
  startedAt: string | null;
}

type RoomPhase = "idle" | "lobby" | "countdown" | "playing" | "finished";

interface UseGameRoomOptions {
  onGameStart?: (room: GameRoomDto) => void;
  countdownSeconds?: number;
  pollInterval?: number;
}

export function useGameRoom(type: string, options: UseGameRoomOptions = {}) {
  const { user, isLoaded } = useUser();
  const { onGameStart, countdownSeconds = 3, pollInterval = 500 } = options;

  const [room, setRoom] = useState<GameRoomDto | null>(null);
  const [phase, setPhase] = useState<RoomPhase>("idle");
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const onGameStartRef = useRef(onGameStart);
  onGameStartRef.current = onGameStart;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Poll room state in lobby
  useEffect(() => {
    if (!room || phase !== "lobby") return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/room?roomId=${room.roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setRoom(data.room);
            // Check if both players are ready
            if (data.room.player2Id && data.room.player1Ready && data.room.player2Ready) {
              clearInterval(pollRef.current);
              startCountdown(data.room);
            }
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }, pollInterval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [room?.roomId, phase, pollInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCountdown = useCallback(
    (roomData: GameRoomDto) => {
      setPhase("countdown");
      setCountdown(countdownSeconds);
      let count = countdownSeconds;

      countdownRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else if (count === 0) {
          setCountdown(0);
        } else {
          clearInterval(countdownRef.current);
          setPhase("playing");
          setRoom(roomData);
          onGameStartRef.current?.(roomData);
        }
      }, 1000);
    },
    [countdownSeconds]
  );

  const createRoom = useCallback(
    async (config: Record<string, unknown> = {}) => {
      setCreating(true);
      setError(null);
      try {
        const res = await fetch("/api/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, config }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create room");
        }
        const data = await res.json();
        setRoom(data.room);
        setPhase("lobby");
        return data.room as GameRoomDto;
      } catch (e: any) {
        setError(e.message);
        return null;
      } finally {
        setCreating(false);
      }
    },
    [type]
  );

  const joinRoom = useCallback(async (roomId: string) => {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to join room");
      }
      const data = await res.json();
      setRoom(data.room);
      setPhase("lobby");
      return data.room as GameRoomDto;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setJoining(false);
    }
  }, []);

  const readyUp = useCallback(async () => {
    if (!room) return;
    setError(null);
    try {
      const res = await fetch("/api/room/ready", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.roomId, ready: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [room]);

  const startSolo = useCallback(
    async (config: Record<string, unknown> = {}) => {
      setCreating(true);
      setError(null);
      try {
        const res = await fetch("/api/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, config }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create room");
        }
        const data = await res.json();
        setRoom(data.room);
        startCountdown(data.room);
        return data.room as GameRoomDto;
      } catch (e: any) {
        setError(e.message);
        return null;
      } finally {
        setCreating(false);
      }
    },
    [type, startCountdown]
  );

  const updateMetadata = useCallback(
    async (metadata: Record<string, unknown>) => {
      if (!room) return null;
      try {
        const res = await fetch("/api/room/metadata", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.roomId, metadata }),
        });
        if (res.ok) {
          const data = await res.json();
          setRoom(data.room);
          return data.room as GameRoomDto;
        }
      } catch {
        // silent
      }
      return null;
    },
    [room]
  );

  const refreshRoom = useCallback(async () => {
    if (!room) return null;
    try {
      const res = await fetch(`/api/room?roomId=${room.roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          setRoom(data.room);
          return data.room as GameRoomDto;
        }
      }
    } catch {
      // silent
    }
    return null;
  }, [room]);

  const resetRoom = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRoom(null);
    setPhase("idle");
    setCountdown(countdownSeconds);
    setError(null);
    setCreating(false);
    setJoining(false);
  }, [countdownSeconds]);

  const isPlayer1 = room?.player1Id === user?.id;

  return {
    // State
    room,
    phase,
    countdown,
    creating,
    joining,
    error,
    isLoaded,
    userId: user?.id ?? null,
    isPlayer1,

    // Actions
    createRoom,
    joinRoom,
    readyUp,
    startSolo,
    updateMetadata,
    refreshRoom,
    resetRoom,
    setRoom,
    setPhase,
  };
}
