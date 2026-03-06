export interface GameRoomDto {
  roomId: string;
  type: string;
  player1Id: string;
  player2Id: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  status: string;
  metadata: Record<string, unknown>;
  startedAt: string | null;
}

export interface CreateGameRoomDto {
  type: string;
  config: Record<string, unknown>;
}
