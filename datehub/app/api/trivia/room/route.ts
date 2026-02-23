import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const createSchema = z.object({
  category: z.string().default("general"),
  difficulty: z.string().default("medium"),
  mode: z.string().default("classic"),
  totalRounds: z.number().min(5).max(30).default(10),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const options = createSchema.parse(body);
    const room = await container.createTriviaRoomUseCase.execute(user.userId, options);
    return { room };
  }, 201);
}

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) throw new Error("roomId required");
    const room = await container.getTriviaRoomUseCase.execute(roomId);
    return { room };
  });
}
