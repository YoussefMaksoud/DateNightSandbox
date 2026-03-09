import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookData } from "@/domain/entities/Scrapbook";

export class UpdateScrapbookUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(
    id: string,
    updates: Partial<Pick<ScrapbookData, "canvasSize">>
  ): Promise<ScrapbookData> {
    return this.scrapbookRepository.updateScrapbook(id, updates);
  }
}
