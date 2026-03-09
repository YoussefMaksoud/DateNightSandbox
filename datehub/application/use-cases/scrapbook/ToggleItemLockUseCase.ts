import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookItemData } from "@/domain/entities/Scrapbook";

export class ToggleItemLockUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(itemId: string, locked: boolean): Promise<ScrapbookItemData> {
    return this.scrapbookRepository.toggleItemLock(itemId, locked);
  }
}
