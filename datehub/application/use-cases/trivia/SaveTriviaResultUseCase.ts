import { ITriviaRepository } from "@/domain/repositories";
import { TriviaResultDto } from "@/application/dtos";
import { TriviaResultData } from "@/domain/entities/TriviaResult";

export class SaveTriviaResultUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(data: {
    roomId: string;
    userId: string;
    category: string;
    mode: string;
    difficulty: string;
    score: number;
    totalRounds: number;
    bestStreak: number;
    avgTime: number;
    won: boolean;
  }): Promise<TriviaResultDto> {
    const result = await this.triviaRepository.saveResult(data);
    return this.toDto(result);
  }

  private toDto(r: TriviaResultData): TriviaResultDto {
    return {
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
    };
  }
}
