import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomDto } from "@/application/dtos";
import { toDto } from "./CreateTriviaRoomUseCase";

export class JoinTriviaRoomUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(roomId: string, userId: string): Promise<TriviaRoomDto> {
    const room = await this.triviaRepository.joinRoom(roomId, userId);
    return toDto(room);
  }
}
