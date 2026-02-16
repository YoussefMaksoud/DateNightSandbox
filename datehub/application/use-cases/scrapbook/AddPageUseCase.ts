import { IScrapbookRepository } from "@/domain/repositories";
import { ScrapbookPageData } from "@/domain/entities/Scrapbook";

export class AddPageUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(
    scrapbookId: string,
    pageNumber: number,
    backgroundColor?: string
  ): Promise<ScrapbookPageData> {
    return this.scrapbookRepository.addPage(
      scrapbookId,
      pageNumber,
      backgroundColor
    );
  }
}
