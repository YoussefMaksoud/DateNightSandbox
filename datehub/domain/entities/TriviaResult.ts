export interface TriviaResultData {
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
  createdAt: Date;
}
