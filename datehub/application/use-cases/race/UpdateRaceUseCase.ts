import { IRaceRepository } from "@/domain/repositories";
import { RaceRoomDto } from "@/application/dtos";
import { RaceRoomData } from "@/domain/entities/RaceRoom";

export class UpdateRaceUseCase {
  constructor(private readonly raceRepository: IRaceRepository) {}

  async ready(roomId: string, userId: string, ready: boolean): Promise<RaceRoomDto> {
    const room = await this.raceRepository.updateReady(roomId, userId, ready);
    return this.toDto(room);
  }

  async updateStatus(roomId: string, status: string, startedAt?: Date): Promise<RaceRoomDto> {
    const room = await this.raceRepository.updateStatus(roomId, status, startedAt);
    return this.toDto(room);
  }

  async updateLap(roomId: string, userId: string, lap: number): Promise<RaceRoomDto> {
    const room = await this.raceRepository.updateLap(roomId, userId, lap);
    return this.toDto(room);
  }

  async finish(roomId: string, userId: string, finishTime: number): Promise<RaceRoomDto> {
    const room = await this.raceRepository.updateFinish(roomId, userId, finishTime);
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
