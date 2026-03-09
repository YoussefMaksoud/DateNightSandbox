import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookItemData } from "@/domain/entities/Scrapbook";

export class UpdateItemUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(
    itemId: string,
    updates: Partial<
      Pick<
        ScrapbookItemData,
        | "x"
        | "y"
        | "width"
        | "height"
        | "rotation"
        | "scale"
        | "zIndex"
        | "content"
        | "locked"
      >
    >
  ): Promise<ScrapbookItemData> {
    return this.scrapbookRepository.updateItem(itemId, updates);
  }
}
