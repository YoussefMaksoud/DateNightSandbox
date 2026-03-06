import { IGameRoomRepository } from "@/domain/repositories";
import { GameRoomDto } from "@/application/dtos";
import { GameRoomData } from "@/domain/entities/GameRoom";

export class UpdateGameRoomUseCase {
  constructor(private readonly repo: IGameRoomRepository) {}

  async execute(roomId: string, updates: { status?: string; metadata?: Record<string, unknown>; startedAt?: Date }): Promise<GameRoomDto> {
    const updated = await this.repo.update(roomId, updates);
    return this.toDto(updated);
  }

  async mergeMetadata(roomId: string, partial: Record<string, unknown>): Promise<GameRoomDto> {
    const room = await this.repo.findByRoomId(roomId);
    if (!room) throw new Error("Room not found");
    const merged = { ...room.metadata, ...partial };
    const updated = await this.repo.update(roomId, { metadata: merged });
    return this.toDto(updated);
  }

  private toDto(room: GameRoomData): GameRoomDto {
    return {
      roomId: room.roomId,
      type: room.type,
      player1Id: room.player1Id,
      player2Id: room.player2Id,
      player1Ready: room.player1Ready,
      player2Ready: room.player2Ready,
      status: room.status,
      metadata: room.metadata,
      startedAt: room.startedAt?.toISOString() ?? null,
    };
  }
}
