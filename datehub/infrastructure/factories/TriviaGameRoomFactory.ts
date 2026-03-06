import { IGameRoomFactory, GameRoomConfig } from "@/domain/factories/IGameRoomFactory";

export class TriviaGameRoomFactory implements IGameRoomFactory {
  readonly type = "trivia";

  createMetadata(config: GameRoomConfig): Record<string, unknown> {
    return {
      category: (config.category as string) ?? "general",
      difficulty: (config.difficulty as string) ?? "medium",
      mode: (config.mode as string) ?? "classic",
      currentRound: 0,
      totalRounds: (config.totalRounds as number) ?? 10,
      player1Score: 0,
      player2Score: 0,
      player1Streak: 0,
      player2Streak: 0,
      player1Lives: 3,
      player2Lives: 3,
      currentQuestion: null,
      questionSentAt: null,
      player1Answer: null,
      player2Answer: null,
      player1Time: null,
      player2Time: null,
    };
  }
}
