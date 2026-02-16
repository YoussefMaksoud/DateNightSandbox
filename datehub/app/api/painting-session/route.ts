import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const createSessionSchema = z.object({
  difficulty: z.string(),
  theme: z.string(),
});

const updateStatusSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["saved", "completed"]),
});

export async function GET() {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const sessions = await container.getPaintingSessionsUseCase.execute(user.userId);
    return { sessions };
  });
}

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const data = createSessionSchema.parse(body);
    const session = await container.createPaintingSessionUseCase.execute({
      userId: user.userId,
      difficulty: data.difficulty,
      theme: data.theme,
    });
    return { session };
  }, 201);
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const data = updateStatusSchema.parse(body);
    const session = await container.updatePaintingSessionUseCase.execute({
      userId: user.userId,
      sessionId: data.sessionId,
      status: data.status,
    });
    return { session };
  });
}
