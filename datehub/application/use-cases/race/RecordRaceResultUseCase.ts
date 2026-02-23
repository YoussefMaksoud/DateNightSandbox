import { IRaceRepository } from "@/domain/repositories";
import { RaceResultDto } from "@/application/dtos";

export class RecordRaceResultUseCase {
  constructor(private readonly raceRepository: IRaceRepository) {}

  async execute(data: {
    roomId: string;
    userId: string;
    lapCount: number;
    finishTime: number;
    won: boolean;
  }): Promise<RaceResultDto> {
    const result = await this.raceRepository.saveResult(data);
    return {
      id: result.id,
      roomId: result.roomId,
      userId: result.userId,
      lapCount: result.lapCount,
      finishTime: result.finishTime,
      won: result.won,
      createdAt: result.createdAt.toISOString(),
    };
  }
}
