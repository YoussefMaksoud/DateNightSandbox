import { v4 as uuidv4 } from "uuid";
import { IPaintingSessionRepository } from "@/domain/repositories";
import { IPaintingAIService } from "@/application/ports";
import { PaintingSession } from "@/domain/entities/PaintingSession";
import { CreatePaintingSessionDto, PaintingSessionDto } from "@/application/dtos";

export class CreatePaintingSessionUseCase {
  constructor(
    private readonly paintingSessionRepository: IPaintingSessionRepository,
    private readonly paintingAIService: IPaintingAIService,
  ) {}

  async execute(dto: CreatePaintingSessionDto): Promise<PaintingSessionDto> {
    const theme = dto.theme || "landscape";
    const difficulty = dto.difficulty || "beginner";

    const { imageUrl, palette } = await this.paintingAIService.generateReference(difficulty, theme);

    const session = PaintingSession.create({
      id: uuidv4(),
      userId: dto.userId,
      dateNightId: null,
      difficulty,
      theme,
      referenceUrl: imageUrl,
      palette,
      status: "active",
    });

    const saved = await this.paintingSessionRepository.create(session);

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
