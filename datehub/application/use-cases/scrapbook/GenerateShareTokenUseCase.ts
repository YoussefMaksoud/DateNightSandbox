import { IScrapbookRepository } from "@/domain/repositories";

export class GenerateShareTokenUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(scrapbookId: string): Promise<string> {
    return this.scrapbookRepository.generateShareToken(scrapbookId);
  }
}
