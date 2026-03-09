import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookData } from "@/domain/entities/Scrapbook";

export class GetSharedScrapbookUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(token: string): Promise<ScrapbookData | null> {
    return this.scrapbookRepository.findByShareToken(token);
  }
}
