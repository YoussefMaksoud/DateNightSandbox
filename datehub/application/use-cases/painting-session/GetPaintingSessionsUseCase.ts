import { IPaintingSessionRepository } from "@/domain/repositories";
import { PaintingSessionDto } from "@/application/dtos";

export class GetPaintingSessionsUseCase {
  constructor(private readonly paintingSessionRepository: IPaintingSessionRepository) {}

  async execute(userId: string): Promise<PaintingSessionDto[]> {
    const sessions = await this.paintingSessionRepository.findByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      dateNightId: s.dateNightId,
      difficulty: s.difficulty,
      theme: s.theme,
      referenceUrl: s.referenceUrl,
      palette: s.palette,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));
  }
}
