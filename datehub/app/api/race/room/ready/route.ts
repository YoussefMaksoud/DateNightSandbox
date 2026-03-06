import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const readySchema = z.object({
  roomId: z.string(),
  ready: z.boolean(),
});

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { roomId, ready } = readySchema.parse(body);
    const room = await container.readyUpUseCase.execute(roomId, user.userId, ready);
    return { room };
  });
}
