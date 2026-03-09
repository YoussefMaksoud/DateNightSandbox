import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const addPageSchema = z.object({
  pageNumber: z.number(),
  backgroundColor: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { pageNumber, backgroundColor } = addPageSchema.parse(body);
    const page = await container.addPageUseCase.execute(
      id,
      pageNumber,
      backgroundColor
    );
    return { page };
  }, 201);
}

const updatePageSchema = z.object({
  pageId: z.string(),
  backgroundColor: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const body = await request.json();
    const { pageId, ...updates } = updatePageSchema.parse(body);
    const page = await container.updatePageUseCase.execute(pageId, updates);
    return { page };
  });
}

export async function DELETE(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { pageId } = await request.json();
    await container.deletePageUseCase.execute(pageId);
    return { success: true };
  });
}
