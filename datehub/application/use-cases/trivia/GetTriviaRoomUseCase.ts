import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomDto } from "@/application/dtos";
import { toDto } from "./CreateTriviaRoomUseCase";

export class GetTriviaRoomUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(roomId: string): Promise<TriviaRoomDto | null> {
    const room = await this.triviaRepository.findRoom(roomId);
    return room ? toDto(room) : null;
  }
}
