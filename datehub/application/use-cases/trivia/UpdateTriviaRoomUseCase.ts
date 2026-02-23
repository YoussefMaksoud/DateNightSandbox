import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomDto } from "@/application/dtos";
import { toDto } from "./CreateTriviaRoomUseCase";

export class UpdateTriviaRoomUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(roomId: string, userId: string, ready: boolean): Promise<TriviaRoomDto> {
    const room = await this.triviaRepository.updateReady(roomId, userId, ready);
    return toDto(room);
  }
}
