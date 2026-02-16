import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookData } from "@/domain/entities/Scrapbook";

export class GetScrapbooksUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(roomId: string): Promise<ScrapbookData[]> {
    return this.scrapbookRepository.findByRoomId(roomId);
  }
}
