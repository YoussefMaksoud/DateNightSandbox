export interface GameRoomData {
  id: string;
  roomId: string;
  type: string;
  player1Id: string;
  player2Id: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  status: string;
  metadata: Record<string, unknown>;
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
