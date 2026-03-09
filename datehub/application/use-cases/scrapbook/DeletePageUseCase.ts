import { IScrapbookRepository } from "@/domain/repositories";

export class DeletePageUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(pageId: string): Promise<void> {
    return this.scrapbookRepository.deletePage(pageId);
  }
}
