import { IRaceRepository } from "@/domain/repositories";
import { RaceResultDto } from "@/application/dtos";

export class GetLeaderboardUseCase {
  constructor(private readonly raceRepository: IRaceRepository) {}

  async execute(limit = 10): Promise<RaceResultDto[]> {
    const results = await this.raceRepository.getLeaderboard(limit);
    return results.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      userId: r.userId,
      lapCount: r.lapCount,
      finishTime: r.finishTime,
      won: r.won,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
