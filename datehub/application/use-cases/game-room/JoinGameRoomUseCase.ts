import { IGameRoomRepository } from "@/domain/repositories";
import { GameRoomDto } from "@/application/dtos";
import { GameRoomData } from "@/domain/entities/GameRoom";

export class JoinGameRoomUseCase {
  constructor(private readonly repo: IGameRoomRepository) {}

  async execute(roomId: string, userId: string): Promise<GameRoomDto> {
    const room = await this.repo.findByRoomId(roomId);
    if (!room) throw new Error("Room not found");
    if (room.player2Id) throw new Error("Room is full");
    if (room.player1Id === userId) throw new Error("Cannot join your own room");

    const updated = await this.repo.update(roomId, { player2Id: userId });
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
