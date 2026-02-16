import { NextRequest } from "next/server";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const roomId =
      request.nextUrl.searchParams.get("roomId") ?? "default-room";
    const since = request.nextUrl.searchParams.get("since");

    if (!since) {
      return { changed: false };
    }

    const state = await prisma.playbackState.findUnique({
      where: { roomId },
    });

    if (
      state &&
      state.updatedAt > new Date(since) &&
      state.updatedBy !== user.userId
    ) {
      return { changed: true, state };
    }

    return { changed: false };
  });
}
