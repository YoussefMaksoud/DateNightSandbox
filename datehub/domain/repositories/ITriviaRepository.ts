import { TriviaRoomData } from "@/domain/entities/TriviaRoom";
import { TriviaResultData } from "@/domain/entities/TriviaResult";

export interface ITriviaRepository {
  findRoom(roomId: string): Promise<TriviaRoomData | null>;
  findActiveRoomByPlayer(userId: string): Promise<TriviaRoomData | null>;
  createRoom(userId: string, options: { category: string; difficulty: string; mode: string; totalRounds: number }): Promise<TriviaRoomData>;
  joinRoom(roomId: string, userId: string): Promise<TriviaRoomData>;
  updateReady(roomId: string, userId: string, ready: boolean): Promise<TriviaRoomData>;
  updateStatus(roomId: string, status: string, startedAt?: Date): Promise<TriviaRoomData>;
  setQuestion(roomId: string, questionJson: string, round: number): Promise<TriviaRoomData>;
  submitAnswer(roomId: string, userId: string, answer: string, timeTaken: number): Promise<TriviaRoomData>;
  updateScores(roomId: string, data: Partial<TriviaRoomData>): Promise<TriviaRoomData>;
  saveResult(data: { roomId: string; userId: string; category: string; mode: string; difficulty: string; score: number; totalRounds: number; bestStreak: number; avgTime: number; won: boolean }): Promise<TriviaResultData>;
  getLeaderboard(limit?: number): Promise<TriviaResultData[]>;
  getPlayerStats(userId: string): Promise<TriviaResultData[]>;
  deleteRoom(roomId: string): Promise<void>;
}
