import { PaintingSession } from "@/domain/entities/PaintingSession";

export interface IPaintingSessionRepository {
  findById(id: string): Promise<PaintingSession | null>;
  findByUserId(userId: string): Promise<PaintingSession[]>;
  create(session: PaintingSession): Promise<PaintingSession>;
  update(session: PaintingSession): Promise<PaintingSession>;
}
