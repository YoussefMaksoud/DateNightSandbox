import { NextRequest } from "next/server";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { NotFoundError } from "@/domain/errors";

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
