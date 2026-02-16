import { prisma } from "@/lib/db";
import { IPaintingSessionRepository } from "@/domain/repositories";
import { PaintingSession } from "@/domain/entities/PaintingSession";

export class PrismaPaintingSessionRepository implements IPaintingSessionRepository {
  async findById(id: string): Promise<PaintingSession | null> {
    const record = await prisma.paintingSession.findUnique({ where: { id } });
    if (!record) return null;
    return PaintingSession.reconstitute({
      id: record.id,
      userId: record.userId,
      dateNightId: record.dateNightId,
      difficulty: record.difficulty,
      theme: record.theme,
      referenceUrl: record.referenceUrl,
      palette: JSON.parse(record.palette),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async findByUserId(userId: string): Promise<PaintingSession[]> {
    const records = await prisma.paintingSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) =>
      PaintingSession.reconstitute({
        id: record.id,
        userId: record.userId,
        dateNightId: record.dateNightId,
        difficulty: record.difficulty,
        theme: record.theme,
        referenceUrl: record.referenceUrl,
        palette: JSON.parse(record.palette),
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async create(session: PaintingSession): Promise<PaintingSession> {
    const record = await prisma.paintingSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        dateNightId: session.dateNightId,
        difficulty: session.difficulty,
        theme: session.theme,
        referenceUrl: session.referenceUrl,
        palette: JSON.stringify(session.palette),
        status: session.status,
      },
    });
    return PaintingSession.reconstitute({
      id: record.id,
      userId: record.userId,
      dateNightId: record.dateNightId,
      difficulty: record.difficulty,
      theme: record.theme,
      referenceUrl: record.referenceUrl,
      palette: JSON.parse(record.palette),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async update(session: PaintingSession): Promise<PaintingSession> {
    const record = await prisma.paintingSession.update({
      where: { id: session.id },
      data: {
        status: session.status,
        updatedAt: new Date(),
      },
    });
    return PaintingSession.reconstitute({
      id: record.id,
      userId: record.userId,
      dateNightId: record.dateNightId,
      difficulty: record.difficulty,
      theme: record.theme,
      referenceUrl: record.referenceUrl,
      palette: JSON.parse(record.palette),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
