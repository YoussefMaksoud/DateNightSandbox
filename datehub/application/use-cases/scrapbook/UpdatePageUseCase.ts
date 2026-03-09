import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookPageData } from "@/domain/entities/Scrapbook";

export class UpdatePageUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(
    pageId: string,
    updates: Partial<Pick<ScrapbookPageData, "backgroundColor">>
  ): Promise<ScrapbookPageData> {
    return this.scrapbookRepository.updatePage(pageId, updates);
  }
}
