import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { spotifyService } from "@/lib/spotify";
import { NotFoundError } from "@/domain/errors";

const addTrackSchema = z.object({
  roomId: z.string().min(1).default("default-room"),
  spotifyTrackId: z.string().min(1, "Spotify track ID is required"),
});

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId =
      request.nextUrl.searchParams.get("roomId") ?? "default-room";
    const tracks = await prisma.playlistTrack.findMany({
      where: { roomId },
      orderBy: { position: "asc" },
    });
    return { tracks };
  });
}

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { roomId, spotifyTrackId } = addTrackSchema.parse(body);

    const track = await spotifyService.getTrack(spotifyTrackId);
    if (!track) {
      throw new NotFoundError("Track", spotifyTrackId);
    }

    const maxPosition = await prisma.playlistTrack.aggregate({
      where: { roomId },
      _max: { position: true },
    });

    const created = await prisma.playlistTrack.create({
      data: {
        roomId,
        spotifyTrackId,
        spotifyUri: track.spotifyUri,
        title: track.title,
        artist: track.artist,
        albumName: track.albumName,
        albumArt: track.albumArt,
        durationMs: track.durationMs,
        addedBy: user.userId,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return created;
  }, 201);
}
