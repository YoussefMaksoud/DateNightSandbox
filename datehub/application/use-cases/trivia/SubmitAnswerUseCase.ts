import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomDto } from "@/application/dtos";
import { toDto } from "./CreateTriviaRoomUseCase";

export class SubmitAnswerUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(roomId: string, userId: string, answer: string, timeTaken: number): Promise<TriviaRoomDto> {
    const room = await this.triviaRepository.submitAnswer(roomId, userId, answer, timeTaken);
    return toDto(room);
  }
}
