import { prisma } from "@/lib/db";
import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomData } from "@/domain/entities/TriviaRoom";
import { TriviaResultData } from "@/domain/entities/TriviaResult";
import { v4 as uuidv4 } from "uuid";

function toRoomData(row: any): TriviaRoomData {
  return {
    id: row.id,
    roomId: row.roomId,
    player1Id: row.player1Id,
    player2Id: row.player2Id,
    player1Ready: row.player1Ready,
    player2Ready: row.player2Ready,
    category: row.category,
    difficulty: row.difficulty,
    mode: row.mode,
    status: row.status,
    currentRound: row.currentRound,
    totalRounds: row.totalRounds,
    player1Score: row.player1Score,
    player2Score: row.player2Score,
    player1Streak: row.player1Streak,
    player2Streak: row.player2Streak,
    player1Lives: row.player1Lives,
    player2Lives: row.player2Lives,
    currentQuestion: row.currentQuestion,
    questionSentAt: row.questionSentAt,
    player1Answer: row.player1Answer,
    player2Answer: row.player2Answer,
    player1Time: row.player1Time,
    player2Time: row.player2Time,
    startedAt: row.startedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTriviaRepository implements ITriviaRepository {
  async findRoom(roomId: string): Promise<TriviaRoomData | null> {
    const row = await prisma.triviaRoom.findUnique({ where: { roomId } });
    return row ? toRoomData(row) : null;
  }

  async findActiveRoomByPlayer(userId: string): Promise<TriviaRoomData | null> {
    const row = await prisma.triviaRoom.findFirst({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: ["waiting", "playing"] },
      },
    });
    return row ? toRoomData(row) : null;
  }

  async createRoom(userId: string, options: { category: string; difficulty: string; mode: string; totalRounds: number }): Promise<TriviaRoomData> {
    const row = await prisma.triviaRoom.create({
      data: {
        roomId: uuidv4().slice(0, 8),
        player1Id: userId,
        category: options.category,
        difficulty: options.difficulty,
        mode: options.mode,
        totalRounds: options.totalRounds,
        player1Lives: options.mode === "survival" ? 3 : 99,
        player2Lives: options.mode === "survival" ? 3 : 99,
        status: "waiting",
      },
    });
    return toRoomData(row);
  }

  async joinRoom(roomId: string, userId: string): Promise<TriviaRoomData> {
    const room = await prisma.triviaRoom.findUnique({ where: { roomId } });
    if (!room) throw new Error("Room not found");
    const row = await prisma.triviaRoom.update({
      where: { roomId },
      data: {
        player2Id: userId,
        player2Lives: room.mode === "survival" ? 3 : 99,
      },
    });
    return toRoomData(row);
  }

  async updateReady(roomId: string, userId: string, ready: boolean): Promise<TriviaRoomData> {
    const room = await prisma.triviaRoom.findUnique({ where: { roomId } });
    if (!room) throw new Error("Room not found");
    const isP1 = room.player1Id === userId;
    const row = await prisma.triviaRoom.update({
      where: { roomId },
      data: isP1 ? { player1Ready: ready } : { player2Ready: ready },
    });
    return toRoomData(row);
  }

  async updateStatus(roomId: string, status: string, startedAt?: Date): Promise<TriviaRoomData> {
    const row = await prisma.triviaRoom.update({
      where: { roomId },
      data: { status, ...(startedAt ? { startedAt } : {}) },
    });
    return toRoomData(row);
  }

  async setQuestion(roomId: string, question: string, round: number): Promise<TriviaRoomData> {
    const row = await prisma.triviaRoom.update({
      where: { roomId },
      data: {
        currentQuestion: question,
        currentRound: round,
        questionSentAt: new Date(),
      },
    });
    return toRoomData(row);
  }

  async submitAnswer(roomId: string, userId: string, answer: string, timeTaken: number): Promise<TriviaRoomData> {
    const room = await prisma.triviaRoom.findUnique({ where: { roomId } });
    if (!room) throw new Error("Room not found");
    const isP1 = room.player1Id === userId;
    const row = await prisma.triviaRoom.update({
      where: { roomId },
      data: isP1
        ? { player1Answer: answer, player1Time: timeTaken }
        : { player2Answer: answer, player2Time: timeTaken },
    });
    return toRoomData(row);
  }

  async updateScores(roomId: string, data: {
    player1Score?: number;
    player2Score?: number;
    player1Streak?: number;
    player2Streak?: number;
    player1Lives?: number;
    player2Lives?: number;
    player1Answer?: string | null;
    player2Answer?: string | null;
    player1Time?: number | null;
    player2Time?: number | null;
    currentQuestion?: string | null;
    currentRound?: number;
    status?: string;
  }): Promise<TriviaRoomData> {
    const row = await prisma.triviaRoom.update({
      where: { roomId },
      data,
    });
    return toRoomData(row);
  }

  async saveResult(data: {
    roomId: string;
    userId: string;
    category: string;
    mode: string;
    difficulty: string;
    score: number;
    totalRounds: number;
    bestStreak: number;
    avgTime: number;
    won: boolean;
  }): Promise<TriviaResultData> {
    const row = await prisma.triviaResult.create({ data });
    return {
      id: row.id,
      roomId: row.roomId,
      userId: row.userId,
      category: row.category,
      mode: row.mode,
      difficulty: row.difficulty,
      score: row.score,
      totalRounds: row.totalRounds,
      bestStreak: row.bestStreak,
      avgTime: row.avgTime,
      won: row.won,
      createdAt: row.createdAt,
    };
  }

  async getLeaderboard(limit = 20): Promise<TriviaResultData[]> {
    const rows = await prisma.triviaResult.findMany({
      orderBy: { score: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      userId: r.userId,
      category: r.category,
      mode: r.mode,
      difficulty: r.difficulty,
      score: r.score,
      totalRounds: r.totalRounds,
      bestStreak: r.bestStreak,
      avgTime: r.avgTime,
      won: r.won,
      createdAt: r.createdAt,
    }));
  }

  async getPlayerStats(userId: string): Promise<TriviaResultData[]> {
    const rows = await prisma.triviaResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      userId: r.userId,
      category: r.category,
      mode: r.mode,
      difficulty: r.difficulty,
      score: r.score,
      totalRounds: r.totalRounds,
      bestStreak: r.bestStreak,
      avgTime: r.avgTime,
      won: r.won,
      createdAt: r.createdAt,
    }));
  }

  async deleteRoom(roomId: string): Promise<void> {
    await prisma.triviaRoom.delete({ where: { roomId } }).catch(() => {});
  }
}
