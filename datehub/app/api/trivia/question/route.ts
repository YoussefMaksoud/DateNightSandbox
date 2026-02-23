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
    const result = await container.generateQuestionUseCase.execute(roomId, previousQuestions);
    return result;
  });
}
