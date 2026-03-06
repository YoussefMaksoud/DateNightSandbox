import { IGameRoomFactory, GameRoomConfig } from "@/domain/factories/IGameRoomFactory";

export class RaceGameRoomFactory implements IGameRoomFactory {
  readonly type = "race";

  createMetadata(config: GameRoomConfig): Record<string, unknown> {
    return {
      lapCount: (config.lapCount as number) ?? 3,
      player1Lap: 0,
      player2Lap: 0,
      player1T: 0,
      player2T: 0,
      player1Time: null,
      player2Time: null,
    };
  }
}
