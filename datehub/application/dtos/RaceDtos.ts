export interface RaceRoomDto {
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
  startedAt: string | null;
}

export interface RaceResultDto {
  id: string;
  roomId: string;
  userId: string;
  lapCount: number;
  finishTime: number;
  won: boolean;
  createdAt: string;
}

export interface LeaderboardEntryDto {
  userId: string;
  bestTime: number;
  lapCount: number;
  wins: number;
  createdAt: string;
}
