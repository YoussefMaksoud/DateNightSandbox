import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET() {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const token = await prisma.spotifyToken.findUnique({
      where: { userId: user.userId },
    });
    return { connected: !!token };
  });
}
