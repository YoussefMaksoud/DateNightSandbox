import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const joinSchema = z.object({
  roomId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { roomId } = joinSchema.parse(body);
    const room = await container.joinTriviaRoomUseCase.execute(roomId, user.userId);
    return { room };
  });
}
