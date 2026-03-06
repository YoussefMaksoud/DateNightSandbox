import { GameRoomData } from "@/domain/entities/GameRoom";

export interface IGameRoomRepository {
  findByRoomId(roomId: string): Promise<GameRoomData | null>;
  findActiveByPlayer(userId: string, type: string): Promise<GameRoomData | null>;
  create(data: Omit<GameRoomData, "id" | "createdAt" | "updatedAt">): Promise<GameRoomData>;
  update(roomId: string, data: Partial<Pick<GameRoomData, "player2Id" | "player1Ready" | "player2Ready" | "status" | "metadata" | "startedAt">>): Promise<GameRoomData>;
  delete(roomId: string): Promise<void>;
}
