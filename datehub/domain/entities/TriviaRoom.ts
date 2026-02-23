export interface TriviaRoomData {
  id: string;
  roomId: string;
  player1Id: string;
  player2Id: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  category: string;
  difficulty: string;
  mode: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  player1Score: number;
  player2Score: number;
  player1Streak: number;
  player2Streak: number;
  player1Lives: number;
  player2Lives: number;
  currentQuestion: string | null;
  questionSentAt: Date | null;
  player1Answer: string | null;
  player2Answer: string | null;
  player1Time: number | null;
  player2Time: number | null;
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
