import { IScrapbookRepository } from "@/domain/repositories";

export class RemoveReactionUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(itemId: string, userId: string): Promise<void> {
    return this.scrapbookRepository.removeReaction(itemId, userId);
  }
}
