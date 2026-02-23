export interface GeneratedTriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  funFact: string;
}

export interface ITriviaAIService {
  generateQuestion(category: string, difficulty: string, previousQuestions?: string[]): Promise<GeneratedTriviaQuestion>;
  checkAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{ correct: boolean; explanation: string }>;
}
