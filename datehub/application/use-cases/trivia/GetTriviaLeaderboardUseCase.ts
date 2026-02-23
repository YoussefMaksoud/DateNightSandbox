import { ITriviaRepository } from "@/domain/repositories";
import { TriviaResultDto } from "@/application/dtos";

export class GetTriviaLeaderboardUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(limit = 20): Promise<TriviaResultDto[]> {
    const results = await this.triviaRepository.getLeaderboard(limit);
    return results.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      userId: r.userId,
      category: r.category,
      mode: r.mode,
      difficulty: r.difficulty,
      score: r.score,
      totalRounds: r.totalRounds,
      bestStreak: r.bestStreak,
      avgTime: r.avgTime,
      won: r.won,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
