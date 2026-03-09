import { IScrapbookRepository } from "@/domain/repositories";

export class DeleteScrapbookUseCase {
  constructor(private readonly scrapbookRepository: IScrapbookRepository) {}

  async execute(id: string): Promise<void> {
    return this.scrapbookRepository.deleteScrapbook(id);
  }
}
