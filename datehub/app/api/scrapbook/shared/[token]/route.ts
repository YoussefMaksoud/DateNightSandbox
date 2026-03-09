import { NextRequest } from "next/server";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { NotFoundError } from "@/domain/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleApiRequest(async () => {
    const { token } = await params;
    const scrapbook = await container.getSharedScrapbookUseCase.execute(token);
    if (!scrapbook) throw new NotFoundError("Scrapbook", token);
    return { scrapbook };
  });
}
