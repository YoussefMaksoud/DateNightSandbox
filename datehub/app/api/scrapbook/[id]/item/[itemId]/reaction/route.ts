import { NextRequest } from "next/server";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const { itemId } = await params;
    const { emoji } = await request.json();
    const reaction = await container.addReactionUseCase.execute(itemId, user.userId, emoji ?? "❤️");
    return { reaction };
  }, 201);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const { itemId } = await params;
    await container.removeReactionUseCase.execute(itemId, user.userId);
    return { success: true };
  });
}
