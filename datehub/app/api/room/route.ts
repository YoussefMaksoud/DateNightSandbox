import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const createSchema = z.object({
  type: z.string().min(1),
  config: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { type, config } = createSchema.parse(body);
    const room = await container.createGameRoomUseCase.execute(user.userId, type, config);
    return { room };
  }, 201);
}

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) throw new Error("roomId required");
    const room = await container.getGameRoomUseCase.execute(roomId);
    return { room };
  });
}
