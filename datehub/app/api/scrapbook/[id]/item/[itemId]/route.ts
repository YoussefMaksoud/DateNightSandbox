import { NextRequest } from "next/server";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { itemId } = await params;
    await container.deleteItemUseCase.execute(itemId);
    return { success: true };
  });
}
