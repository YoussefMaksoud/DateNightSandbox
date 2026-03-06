import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const startSchema = z.object({
  roomId: z.string().min(1),
});

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const body = await request.json();
    const { roomId } = startSchema.parse(body);

    await container.updateGameRoomUseCase.execute(roomId, {
      status: "playing",
      startedAt: new Date(),
    });

    const room = await container.getGameRoomUseCase.execute(roomId);
    if (!room) throw new Error("Room not found");
    const meta = room.metadata;

    const generated = await container.triviaAIService.generateQuestion(
      meta.category as string,
      meta.difficulty as string,
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
      currentRound: 1,
      questionSentAt: new Date().toISOString(),
      player1Answer: null,
      player2Answer: null,
      player1Time: null,
      player2Time: null,
    });

    return { room: updated, question: questionData };
  });
}
