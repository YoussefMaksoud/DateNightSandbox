import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET() {
  return handleApiRequest(async () => {
    await requireAuth();
    const leaderboard = await container.getTriviaLeaderboardUseCase.execute();
    return { leaderboard };
  });
}
