import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const addTrackSchema = z.object({
  trackId: z.string().min(1, "Track ID is required"),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { trackId } = addTrackSchema.parse(body);
    await container.addTrackUseCase.execute({
      trackId,
      userId: user.userId,
    });
    return { message: "Track added" };
  });
}
