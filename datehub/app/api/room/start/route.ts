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
    const room = await container.updateGameRoomUseCase.execute(roomId, {
      status: "playing",
      startedAt: new Date(),
    });
    return { room };
  });
}
