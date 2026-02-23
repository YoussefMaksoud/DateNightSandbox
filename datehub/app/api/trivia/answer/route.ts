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
    const room = await container.submitAnswerUseCase.execute(roomId, user.userId, answer, timeTaken);
    return { room };
  });
}
