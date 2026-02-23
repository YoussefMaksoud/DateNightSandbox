import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const resultSchema = z.object({
  roomId: z.string(),
  lapCount: z.number(),
  finishTime: z.number(),
  won: z.boolean(),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const data = resultSchema.parse(body);
    const result = await container.recordRaceResultUseCase.execute({
      ...data,
      userId: user.userId,
    });
    return { result };
  }, 201);
}
