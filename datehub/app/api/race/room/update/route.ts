import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const updateSchema = z.object({
  roomId: z.string(),
  status: z.string().optional(),
  lap: z.number().optional(),
  finishTime: z.number().optional(),
  position: z.number().optional(),
});

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const data = updateSchema.parse(body);

    const currentRoom = await container.getGameRoomUseCase.execute(data.roomId);
    if (!currentRoom) return { error: "Room not found" };
    const isP1 = currentRoom.player1Id === user.userId;

    if (data.position !== undefined) {
      await container.updateGameRoomUseCase.mergeMetadata(data.roomId,
        isP1 ? { player1T: data.position } : { player2T: data.position }
      );
      return { ok: true };
    }

    if (data.status) {
      const room = await container.updateGameRoomUseCase.execute(data.roomId, {
        status: data.status,
        ...(data.status === "racing" ? { startedAt: new Date() } : {}),
      });
      return { room };
    }

    if (data.lap !== undefined) {
      const room = await container.updateGameRoomUseCase.mergeMetadata(data.roomId,
        isP1 ? { player1Lap: data.lap } : { player2Lap: data.lap }
      );
      return { room };
    }

    if (data.finishTime !== undefined) {
      const meta: Record<string, unknown> = isP1 ? { player1Time: data.finishTime } : { player2Time: data.finishTime };
      const otherFinished = isP1
        ? (currentRoom.metadata.player2Time as number | null) !== null && currentRoom.metadata.player2Time !== undefined
        : (currentRoom.metadata.player1Time as number | null) !== null && currentRoom.metadata.player1Time !== undefined;
      const room = otherFinished
        ? await container.updateGameRoomUseCase.execute(data.roomId, { status: "finished", metadata: { ...currentRoom.metadata, ...meta } })
        : await container.updateGameRoomUseCase.mergeMetadata(data.roomId, meta);
      return { room };
    }

    return { error: "No update provided" };
  });
}
