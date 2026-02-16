import { IScrapbookRepository } from "@/domain/repositories";

export class DeleteItemUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(itemId: string): Promise<void> {
    return this.scrapbookRepository.deleteItem(itemId);
  }
}
