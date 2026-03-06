import { IGameRoomRepository } from "@/domain/repositories";
import { GameRoomDto } from "@/application/dtos";
import { GameRoomData } from "@/domain/entities/GameRoom";

export class GetGameRoomUseCase {
  constructor(private readonly repo: IGameRoomRepository) {}

  async execute(roomId: string): Promise<GameRoomDto | null> {
    const room = await this.repo.findByRoomId(roomId);
    if (!room) return null;
    return this.toDto(room);
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
