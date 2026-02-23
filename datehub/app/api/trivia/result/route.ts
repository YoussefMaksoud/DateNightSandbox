import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const resultSchema = z.object({
  roomId: z.string().min(1),
  category: z.string(),
  mode: z.string(),
  difficulty: z.string(),
  score: z.number(),
  totalRounds: z.number(),
  bestStreak: z.number().default(0),
  avgTime: z.number().default(0),
  won: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const data = resultSchema.parse(body);
    const result = await container.saveTriviaResultUseCase.execute({
      ...data,
      userId: user.userId,
    });
    return { result };
  }, 201);
}
