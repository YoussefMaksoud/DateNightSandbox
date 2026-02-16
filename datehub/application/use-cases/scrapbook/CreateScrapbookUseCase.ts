import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookData } from "@/domain/entities/Scrapbook";

export class CreateScrapbookUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(
    roomId: string,
    name: string,
    createdBy: string
  ): Promise<ScrapbookData> {
    return this.scrapbookRepository.create(roomId, name, createdBy);
  }
}
