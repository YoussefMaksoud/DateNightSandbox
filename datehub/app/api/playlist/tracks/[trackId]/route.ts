import { NextRequest } from "next/server";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { trackId } = await params;
    await prisma.playlistTrack.delete({
      where: { id: trackId },
    });
    return { message: "Track removed" };
  });
}
