import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const scoreSchema = z.object({
  roomId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const body = await request.json();
    const { roomId } = scoreSchema.parse(body);

    const room = await container.getGameRoomUseCase.execute(roomId);
    if (!room) throw new Error("Room not found");
    const meta = room.metadata;

    let question: any = null;
    if (meta.currentQuestion) {
      try { question = JSON.parse(meta.currentQuestion as string); } catch { /* ignore */ }
    }
    if (!question) throw new Error("No current question");

    const correctAnswer = question.options[question.correctIndex];
    const isSolo = !room.player2Id;

    const p1Correct = (meta.player1Answer as string) === String(question.correctIndex);
    const p2Correct = isSolo ? false : (meta.player2Answer as string) === String(question.correctIndex);

    let p1ScoreAdd = 0;
    let p2ScoreAdd = 0;
    let p1Streak = meta.player1Streak as number;
    let p2Streak = meta.player2Streak as number;
    let p1Lives = meta.player1Lives as number;
    let p2Lives = meta.player2Lives as number;

    if (p1Correct) {
      p1Streak++;
      p1ScoreAdd = 100 + (p1Streak >= 3 ? 50 * Math.min(p1Streak - 2, 5) : 0);
      if ((meta.player1Time as number | null) !== null && (meta.player1Time as number) < 5) {
        p1ScoreAdd += Math.round((5 - (meta.player1Time as number)) * 20);
      }
    } else {
      p1Streak = 0;
      if ((meta.mode as string) === "survival") p1Lives--;
    }

    if (!isSolo) {
      if (p2Correct) {
        p2Streak++;
        p2ScoreAdd = 100 + (p2Streak >= 3 ? 50 * Math.min(p2Streak - 2, 5) : 0);
        if ((meta.player2Time as number | null) !== null && (meta.player2Time as number) < 5) {
          p2ScoreAdd += Math.round((5 - (meta.player2Time as number)) * 20);
        }
      } else {
        p2Streak = 0;
        if ((meta.mode as string) === "survival") p2Lives--;
      }
    }

    const currentRound = meta.currentRound as number;
    const totalRounds = meta.totalRounds as number;
    const isLastRound = currentRound >= totalRounds;
    const survivalOver = (meta.mode as string) === "survival" && (p1Lives <= 0 || (!isSolo && p2Lives <= 0));
    const gameOver = isLastRound || survivalOver;

    const scoreUpdates: Record<string, unknown> = {
      player1Score: (meta.player1Score as number) + p1ScoreAdd,
      player2Score: (meta.player2Score as number) + p2ScoreAdd,
      player1Streak: p1Streak,
      player2Streak: p2Streak,
      player1Lives: p1Lives,
      player2Lives: p2Lives,
    };

    let updated;
    if (gameOver) {
      updated = await container.updateGameRoomUseCase.execute(roomId, {
        status: "finished",
        metadata: { ...meta, ...scoreUpdates },
      });
    } else {
      updated = await container.updateGameRoomUseCase.mergeMetadata(roomId, scoreUpdates);
    }

    return {
      room: updated,
      player1Correct: p1Correct,
      player2Correct: p2Correct,
      correctAnswer,
      funFact: question.funFact,
      roundOver: true,
      gameOver,
    };
  });
}
