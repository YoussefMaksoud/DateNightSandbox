import { ITriviaRepository } from "@/domain/repositories";
import { ITriviaAIService } from "@/application/ports";
import { TriviaRoomDto, TriviaQuestionDto } from "@/application/dtos";
import { toDto } from "./CreateTriviaRoomUseCase";

export class GenerateQuestionUseCase {
  constructor(
    private readonly triviaRepository: ITriviaRepository,
    private readonly triviaAIService: ITriviaAIService,
  ) {}

  async execute(roomId: string, previousQuestions?: string[]): Promise<{ room: TriviaRoomDto; question: TriviaQuestionDto }> {
    const room = await this.triviaRepository.findRoom(roomId);
    if (!room) throw new Error("Room not found");

    const generated = await this.triviaAIService.generateQuestion(
      room.category,
      room.difficulty,
      previousQuestions,
    );

    const questionData: TriviaQuestionDto = {
      question: generated.question,
      options: generated.options,
      correctIndex: generated.correctIndex,
      category: room.category,
      difficulty: room.difficulty,
      funFact: generated.funFact,
    };

    const updated = await this.triviaRepository.setQuestion(
      roomId,
      JSON.stringify(questionData),
      room.currentRound + 1,
    );

    // Clear previous answers
    const cleared = await this.triviaRepository.updateScores(roomId, {
      player1Answer: null,
      player2Answer: null,
      player1Time: null,
      player2Time: null,
    });

    return { room: toDto(cleared), question: questionData };
  }
}
