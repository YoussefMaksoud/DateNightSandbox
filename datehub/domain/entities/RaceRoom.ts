export interface RaceRoomData {
  id: string;
  roomId: string;
  player1Id: string;
  player2Id: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  lapCount: number;
  status: string;
  player1Lap: number;
  player2Lap: number;
  player1T: number;
  player2T: number;
  player1Time: number | null;
  player2Time: number | null;
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
