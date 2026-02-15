import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const startSchema = z.object({
  activityId: z.string().min(1, "Activity ID is required"),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { activityId } = startSchema.parse(body);
    return container.startActivityUseCase.execute({
      activityId,
      userId: user.userId,
    });
  });
}
