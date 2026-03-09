import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const updateSchema = z.object({
  roomId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
});

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const body = await request.json();
    const { roomId, metadata } = updateSchema.parse(body);
    const room = await container.updateGameRoomUseCase.mergeMetadata(roomId, metadata);
    return { room };
  });
}
