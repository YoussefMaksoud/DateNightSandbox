import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookItemData } from "@/domain/entities/Scrapbook";

export class AddItemUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(
    pageId: string,
    item: Omit<ScrapbookItemData, "id" | "pageId">
  ): Promise<ScrapbookItemData> {
    return this.scrapbookRepository.addItem(pageId, item);
  }
}
