export interface TriviaQuestionDto {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: string;
  funFact: string;
}

export interface TriviaRoomDto {
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
  currentQuestion: TriviaQuestionDto | null;
  questionSentAt: string | null;
  player1Answer: string | null;
  player2Answer: string | null;
  player1Time: number | null;
  player2Time: number | null;
  startedAt: string | null;
}

export interface TriviaResultDto {
  id: string;
  roomId: string;
  userId: string;
  category: string;
  mode: string;
  difficulty: string;
  score: number;
  totalRounds: number;
  bestStreak: number;
  avgTime: number;
  won: boolean;
  createdAt: string;
}

export interface TriviaLeaderboardEntryDto {
  userId: string;
  bestScore: number;
  totalGames: number;
  wins: number;
  bestStreak: number;
}
