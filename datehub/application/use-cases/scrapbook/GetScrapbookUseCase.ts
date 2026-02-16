import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookData } from "@/domain/entities/Scrapbook";

export class GetScrapbookUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(id: string): Promise<ScrapbookData | null> {
    return this.scrapbookRepository.findById(id);
  }
}
