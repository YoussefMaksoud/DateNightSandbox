import { IRaceRepository } from "@/domain/repositories";
import { RaceRoomDto } from "@/application/dtos";
import { RaceRoomData } from "@/domain/entities/RaceRoom";

export class CreateRaceRoomUseCase {
  constructor(private readonly raceRepository: IRaceRepository) {}

  async execute(userId: string, lapCount: number): Promise<RaceRoomDto> {
    const existing = await this.raceRepository.findActiveRoomByPlayer(userId);
    if (existing) {
      await this.raceRepository.deleteRoom(existing.roomId);
    }
    const room = await this.raceRepository.createRoom(userId, lapCount);
    return this.toDto(room);
  }

  private toDto(room: RaceRoomData): RaceRoomDto {
    return {
      roomId: room.roomId,
      player1Id: room.player1Id,
      player2Id: room.player2Id,
      player1Ready: room.player1Ready,
      player2Ready: room.player2Ready,
      lapCount: room.lapCount,
      status: room.status,
      player1Lap: room.player1Lap,
      player2Lap: room.player2Lap,
      player1T: room.player1T,
      player2T: room.player2T,
      player1Time: room.player1Time,
      player2Time: room.player2Time,
      startedAt: room.startedAt?.toISOString() ?? null,
    };
  }
}
