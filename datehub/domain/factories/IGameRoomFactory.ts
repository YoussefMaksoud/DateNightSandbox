export interface GameRoomConfig {
  [key: string]: unknown;
}

export interface IGameRoomFactory {
  readonly type: string;
  createMetadata(config: GameRoomConfig): Record<string, unknown>;
}
