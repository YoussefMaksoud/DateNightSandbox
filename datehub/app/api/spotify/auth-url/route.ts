import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { spotifyService } from "@/lib/spotify";

export async function GET() {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const url = spotifyService.getAuthorizationUrl(user.userId);
    return { url };
  });
}
