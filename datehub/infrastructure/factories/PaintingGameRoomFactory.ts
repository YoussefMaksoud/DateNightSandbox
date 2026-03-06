import { IGameRoomFactory, GameRoomConfig } from "@/domain/factories/IGameRoomFactory";

export class PaintingGameRoomFactory implements IGameRoomFactory {
  readonly type = "painting";

  createMetadata(config: GameRoomConfig): Record<string, unknown> {
    return {
      difficulty: (config.difficulty as string) ?? "beginner",
      theme: (config.theme as string) ?? "landscape",
      sessionId: null,
      referenceUrl: null,
      palette: [],
    };
  }
}
