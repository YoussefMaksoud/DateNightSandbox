import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const generateSchema = z.object({
  roomId: z.string().min(1),
  previousQuestions: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const body = await request.json();
    const { roomId, previousQuestions } = generateSchema.parse(body);

    const room = await container.getGameRoomUseCase.execute(roomId);
    if (!room) throw new Error("Room not found");
    const meta = room.metadata;

    const generated = await container.triviaAIService.generateQuestion(
      meta.category as string,
      meta.difficulty as string,
      previousQuestions,
    );

    const questionData = {
      question: generated.question,
      options: generated.options,
      correctIndex: generated.correctIndex,
      category: meta.category as string,
      difficulty: meta.difficulty as string,
      funFact: generated.funFact,
    };

    const updated = await container.updateGameRoomUseCase.mergeMetadata(roomId, {
      currentQuestion: JSON.stringify(questionData),
      currentRound: (meta.currentRound as number ?? 0) + 1,
      questionSentAt: new Date().toISOString(),
      player1Answer: null,
      player2Answer: null,
      player1Time: null,
      player2Time: null,
    });

    return { room: updated, question: questionData };
  });
}
