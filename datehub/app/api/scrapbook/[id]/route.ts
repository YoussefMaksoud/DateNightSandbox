import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { NotFoundError } from "@/domain/errors";

const updateScrapbookSchema = z.object({
  canvasSize: z.number().min(0).max(3).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { id } = await params;
    const scrapbook = await container.getScrapbookUseCase.execute(id);
    if (!scrapbook) {
      throw new NotFoundError("Scrapbook", id);
    }
    return { scrapbook };
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { id } = await params;
    await container.deleteScrapbookUseCase.execute(id);
    return { success: true };
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const updates = updateScrapbookSchema.parse(body);
    const scrapbook = await container.updateScrapbookUseCase.execute(id, updates);
    return { scrapbook };
  });
}
