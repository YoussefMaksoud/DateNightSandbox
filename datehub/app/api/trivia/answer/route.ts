import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const answerSchema = z.object({
  roomId: z.string().min(1),
  answer: z.string(),
  timeTaken: z.number(),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { roomId, answer, timeTaken } = answerSchema.parse(body);

    const room = await container.getGameRoomUseCase.execute(roomId);
    if (!room) throw new Error("Room not found");
    const isP1 = room.player1Id === user.userId;

    const updates = isP1
      ? { player1Answer: answer, player1Time: timeTaken }
      : { player2Answer: answer, player2Time: timeTaken };

    const updated = await container.updateGameRoomUseCase.mergeMetadata(roomId, updates);
    return { room: updated };
  });
}
