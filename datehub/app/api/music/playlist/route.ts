import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET() {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const playlist = await container.getPlaylistUseCase.execute(user.userId);
    return { playlist };
  });
}
