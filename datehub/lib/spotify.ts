import { SpotifyService } from "@/infrastructure/services/SpotifyService";

const globalForSpotify = globalThis as unknown as {
  spotifyService: SpotifyService | undefined;
};

export const spotifyService =
  globalForSpotify.spotifyService ?? new SpotifyService();

if (process.env.NODE_ENV !== "production") {
  globalForSpotify.spotifyService = spotifyService;
}
