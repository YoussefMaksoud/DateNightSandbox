import { IRaceRepository } from "@/domain/repositories";
import { RaceRoomDto } from "@/application/dtos";

export class JoinRaceRoomUseCase {
  constructor(private readonly raceRepository: IRaceRepository) {}

  async execute(roomId: string, userId: string): Promise<RaceRoomDto> {
    const room = await this.raceRepository.joinRoom(roomId, userId);
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
