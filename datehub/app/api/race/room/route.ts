import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const createSchema = z.object({
  lapCount: z.number().min(1).max(10).default(3),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { lapCount } = createSchema.parse(body);
    const room = await container.createRaceRoomUseCase.execute(user.userId, lapCount);
    return { room };
  }, 201);
}

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) throw new Error("roomId required");
    const room = await container.getRaceRoomUseCase.execute(roomId);
    return { room };
  });
}
