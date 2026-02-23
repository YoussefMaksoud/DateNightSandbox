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

    // Update status to playing
    const repo = container.triviaRepository;
    await repo.updateStatus(roomId, "playing", new Date());

    // Generate first question
    const result = await container.generateQuestionUseCase.execute(roomId);
    return result;
  });
}
