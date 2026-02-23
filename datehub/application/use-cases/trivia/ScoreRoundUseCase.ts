import { ITriviaRepository } from "@/domain/repositories";
import { TriviaRoomDto, TriviaQuestionDto } from "@/application/dtos";
import { toDto } from "./CreateTriviaRoomUseCase";

interface RoundResult {
  room: TriviaRoomDto;
  player1Correct: boolean;
  player2Correct: boolean;
  correctAnswer: string;
  funFact: string;
  roundOver: boolean;
  gameOver: boolean;
}

export class ScoreRoundUseCase {
  constructor(private readonly triviaRepository: ITriviaRepository) {}

  async execute(roomId: string): Promise<RoundResult> {
    const room = await this.triviaRepository.findRoom(roomId);
    if (!room) throw new Error("Room not found");

    let question: TriviaQuestionDto | null = null;
    if (room.currentQuestion) {
      try { question = JSON.parse(room.currentQuestion); } catch { /* ignore */ }
    }
    if (!question) throw new Error("No current question");

    const correctAnswer = question.options[question.correctIndex];
    const isSolo = !room.player2Id;

    // Check answers
    const p1Correct = room.player1Answer === String(question.correctIndex);
    const p2Correct = isSolo ? false : room.player2Answer === String(question.correctIndex);

    // Calculate scores
    let p1ScoreAdd = 0;
    let p2ScoreAdd = 0;
    let p1Streak = room.player1Streak;
    let p2Streak = room.player2Streak;
    let p1Lives = room.player1Lives;
    let p2Lives = room.player2Lives;

    // Base points + streak bonus
    if (p1Correct) {
      p1Streak++;
      p1ScoreAdd = 100 + (p1Streak >= 3 ? 50 * Math.min(p1Streak - 2, 5) : 0);
      // Speed bonus (under 5 seconds)
      if (room.player1Time !== null && room.player1Time < 5) {
        p1ScoreAdd += Math.round((5 - room.player1Time) * 20);
      }
    } else {
      p1Streak = 0;
      if (room.mode === "survival") p1Lives--;
    }

    if (!isSolo) {
      if (p2Correct) {
        p2Streak++;
        p2ScoreAdd = 100 + (p2Streak >= 3 ? 50 * Math.min(p2Streak - 2, 5) : 0);
        if (room.player2Time !== null && room.player2Time < 5) {
          p2ScoreAdd += Math.round((5 - room.player2Time) * 20);
        }
      } else {
        p2Streak = 0;
        if (room.mode === "survival") p2Lives--;
      }
    }

    // Check game over conditions
    const isLastRound = room.currentRound >= room.totalRounds;
    const survivalOver = room.mode === "survival" && (p1Lives <= 0 || (!isSolo && p2Lives <= 0));
    const gameOver = isLastRound || survivalOver;

    const updated = await this.triviaRepository.updateScores(roomId, {
      player1Score: room.player1Score + p1ScoreAdd,
      player2Score: room.player2Score + p2ScoreAdd,
      player1Streak: p1Streak,
      player2Streak: p2Streak,
      player1Lives: p1Lives,
      player2Lives: p2Lives,
      ...(gameOver ? { status: "finished" } : {}),
    });

    return {
      room: toDto(updated),
      player1Correct: p1Correct,
      player2Correct: p2Correct,
      correctAnswer,
      funFact: question.funFact,
      roundOver: true,
      gameOver,
    };
  }
}
