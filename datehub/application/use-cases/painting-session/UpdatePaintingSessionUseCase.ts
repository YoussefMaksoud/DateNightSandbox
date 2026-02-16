import { IPaintingSessionRepository } from "@/domain/repositories";
import { PaintingSessionDto, UpdatePaintingSessionStatusDto } from "@/application/dtos";
import { NotFoundError } from "@/domain/errors";

export class UpdatePaintingSessionUseCase {
  constructor(private readonly paintingSessionRepository: IPaintingSessionRepository) {}

  async execute(dto: UpdatePaintingSessionStatusDto): Promise<PaintingSessionDto> {
    const session = await this.paintingSessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new NotFoundError("PaintingSession", dto.sessionId);
    }

    const updated = dto.status === "saved" ? session.saveForLater() : session.complete();
    const saved = await this.paintingSessionRepository.update(updated);

    return {
      id: saved.id,
      userId: saved.userId,
      dateNightId: saved.dateNightId,
      difficulty: saved.difficulty,
      theme: saved.theme,
      referenceUrl: saved.referenceUrl,
      palette: saved.palette,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
