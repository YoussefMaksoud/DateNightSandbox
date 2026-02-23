import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomDto } from "@/application/dtos";
import { TriviaRoomData } from "@/domain/entities/TriviaRoom";

export class CreateTriviaRoomUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(userId: string, options: { category: string; difficulty: string; mode: string; totalRounds: number }): Promise<TriviaRoomDto> {
    const existing = await this.triviaRepository.findActiveRoomByPlayer(userId);
    if (existing) {
      await this.triviaRepository.deleteRoom(existing.roomId);
    }
    const room = await this.triviaRepository.createRoom(userId, options);
    return toDto(room);
  }
}

export function toDto(room: TriviaRoomData): TriviaRoomDto {
  let currentQuestion = null;
  if (room.currentQuestion) {
    try {
      currentQuestion = JSON.parse(room.currentQuestion);
    } catch {
      currentQuestion = null;
    }
  }
  return {
    roomId: room.roomId,
    player1Id: room.player1Id,
    player2Id: room.player2Id,
    player1Ready: room.player1Ready,
    player2Ready: room.player2Ready,
    category: room.category,
    difficulty: room.difficulty,
    mode: room.mode,
    status: room.status,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    player1Score: room.player1Score,
    player2Score: room.player2Score,
    player1Streak: room.player1Streak,
    player2Streak: room.player2Streak,
    player1Lives: room.player1Lives,
    player2Lives: room.player2Lives,
    currentQuestion,
    questionSentAt: room.questionSentAt?.toISOString() ?? null,
    player1Answer: room.player1Answer,
    player2Answer: room.player2Answer,
    player1Time: room.player1Time,
    player2Time: room.player2Time,
    startedAt: room.startedAt?.toISOString() ?? null,
  };
}
