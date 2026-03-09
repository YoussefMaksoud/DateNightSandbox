import { NextRequest } from "next/server";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { id } = await params;
    const token = await container.generateShareTokenUseCase.execute(id);
    return { token, url: `/scrapbook/shared/${token}` };
  }, 201);
}
