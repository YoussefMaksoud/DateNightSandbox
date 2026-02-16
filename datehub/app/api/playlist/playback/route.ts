import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

const updatePlaybackSchema = z.object({
  roomId: z.string().min(1).default("default-room"),
  trackId: z.string().optional(),
  spotifyUri: z.string().optional(),
  isPlaying: z.boolean(),
  progressMs: z.number().int().min(0),
});

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId =
      request.nextUrl.searchParams.get("roomId") ?? "default-room";

    const state = await prisma.playbackState.findUnique({
      where: { roomId },
    });

    return (
      state ?? {
        roomId,
        trackId: null,
        spotifyUri: null,
        isPlaying: false,
        progressMs: 0,
        updatedBy: null,
        updatedAt: new Date(),
      }
    );
  });
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { roomId, trackId, spotifyUri, isPlaying, progressMs } =
      updatePlaybackSchema.parse(body);

    const state = await prisma.playbackState.upsert({
      where: { roomId },
      update: {
        trackId,
        spotifyUri,
        isPlaying,
        progressMs,
        updatedBy: user.userId,
        updatedAt: new Date(),
      },
      create: {
        roomId,
        trackId,
        spotifyUri,
        isPlaying,
        progressMs,
        updatedBy: user.userId,
      },
    });

    return state;
  });
}
