import { RaceRoomData } from "@/domain/entities/RaceRoom";
import { RaceResultData } from "@/domain/entities/RaceResult";

export interface IRaceRepository {
  findRoom(roomId: string): Promise<RaceRoomData | null>;
  findActiveRoomByPlayer(userId: string): Promise<RaceRoomData | null>;
  createRoom(userId: string, lapCount: number): Promise<RaceRoomData>;
  joinRoom(roomId: string, userId: string): Promise<RaceRoomData>;
  updateReady(roomId: string, userId: string, ready: boolean): Promise<RaceRoomData>;
  updateStatus(roomId: string, status: string, startedAt?: Date): Promise<RaceRoomData>;
  updateLap(roomId: string, userId: string, lap: number): Promise<RaceRoomData>;
  updateFinish(roomId: string, userId: string, finishTime: number): Promise<RaceRoomData>;
  saveResult(data: { roomId: string; userId: string; lapCount: number; finishTime: number; won: boolean }): Promise<RaceResultData>;
  getLeaderboard(limit?: number): Promise<RaceResultData[]>;
  deleteRoom(roomId: string): Promise<void>;
}
