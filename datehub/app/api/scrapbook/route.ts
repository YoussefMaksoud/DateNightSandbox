import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const createScrapbookSchema = z.object({
  name: z.string().min(1),
  roomId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId =
      request.nextUrl.searchParams.get("roomId") ?? "default-room";
    const scrapbooks = await container.getScrapbooksUseCase.execute(roomId);
    return { scrapbooks };
  });
}

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { name, roomId } = createScrapbookSchema.parse(body);
    const scrapbook = await container.createScrapbookUseCase.execute(
      roomId ?? "default-room",
      name,
      user.userId
    );
    return { scrapbook };
  }, 201);
}
