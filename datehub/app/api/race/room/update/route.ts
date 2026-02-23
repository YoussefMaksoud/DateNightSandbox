import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

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

    if (data.position !== undefined) {
      const room = await prisma.raceRoom.findUnique({ where: { roomId: data.roomId } });
      if (!room) return { error: "Room not found" };
      const isP1 = room.player1Id === user.userId;
      await prisma.raceRoom.update({
        where: { roomId: data.roomId },
        data: isP1 ? { player1T: data.position } : { player2T: data.position },
      });
      return { ok: true };
    }

    if (data.status) {
      const room = await container.updateRaceUseCase.updateStatus(
        data.roomId,
        data.status,
        data.status === "racing" ? new Date() : undefined
      );
      return { room };
    }

    if (data.lap !== undefined) {
      const room = await container.updateRaceUseCase.updateLap(data.roomId, user.userId, data.lap);
      return { room };
    }

    if (data.finishTime !== undefined) {
      const room = await container.updateRaceUseCase.finish(data.roomId, user.userId, data.finishTime);
      return { room };
    }

    return { error: "No update provided" };
  });
}
