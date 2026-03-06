import { v4 as uuidv4 } from "uuid";
import { IGameRoomRepository } from "@/domain/repositories";
import { IGameRoomFactory } from "@/domain/factories/IGameRoomFactory";
import { GameRoomDto } from "@/application/dtos";
import { GameRoomData } from "@/domain/entities/GameRoom";

export class CreateGameRoomUseCase {
  constructor(
    private readonly repo: IGameRoomRepository,
    private readonly factories: Map<string, IGameRoomFactory>,
  ) {}

  async execute(userId: string, type: string, config: Record<string, unknown>): Promise<GameRoomDto> {
    const factory = this.factories.get(type);
    if (!factory) throw new Error(`Unknown room type: ${type}`);

    // Clean up any existing active room for this player+type
    const existing = await this.repo.findActiveByPlayer(userId, type);
    if (existing) {
      await this.repo.delete(existing.roomId);
    }

    const metadata = factory.createMetadata(config);
    const room = await this.repo.create({
      roomId: uuidv4().slice(0, 8),
      type,
      player1Id: userId,
      player2Id: null,
      player1Ready: false,
      player2Ready: false,
      status: "waiting",
      metadata,
      startedAt: null,
    });

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
