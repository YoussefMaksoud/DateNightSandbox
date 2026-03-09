import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookReactionData } from "@/domain/entities/Scrapbook";

export class AddReactionUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(itemId: string, userId: string, emoji: string): Promise<ScrapbookReactionData> {
    return this.scrapbookRepository.addReaction(itemId, userId, emoji);
  }
}
