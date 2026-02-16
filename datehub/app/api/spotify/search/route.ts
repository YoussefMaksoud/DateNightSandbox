import { NextRequest } from "next/server";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { spotifyService } from "@/lib/spotify";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
});

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const { q } = searchSchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });
    const tracks = await spotifyService.searchTracks(q);
    return { tracks };
  });
}
