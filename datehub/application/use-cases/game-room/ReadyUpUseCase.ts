import { IGameRoomRepository } from "@/domain/repositories";
import { GameRoomDto } from "@/application/dtos";
import { GameRoomData } from "@/domain/entities/GameRoom";

export class ReadyUpUseCase {
  constructor(private readonly repo: IGameRoomRepository) {}

  async execute(roomId: string, userId: string, ready: boolean): Promise<GameRoomDto> {
    const room = await this.repo.findByRoomId(roomId);
    if (!room) throw new Error("Room not found");

    const isP1 = room.player1Id === userId;
    const updated = await this.repo.update(roomId, isP1 ? { player1Ready: ready } : { player2Ready: ready });
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
