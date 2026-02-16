const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:3000/api/spotify/callback";

export interface SpotifyTrackResult {
  spotifyTrackId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumName: string;
  albumArt: string | null;
  durationMs: number;
  previewUrl: string | null;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class SpotifyService {
  private clientAccessToken: string | null = null;
  private clientTokenExpiry: number = 0;

  // --- Client Credentials (for search, no user auth needed) ---

  private async getClientToken(): Promise<string> {
    if (this.clientAccessToken && Date.now() < this.clientTokenExpiry) {
      return this.clientAccessToken;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get Spotify client token");
    }

    const data = await response.json();
    this.clientAccessToken = data.access_token;
    this.clientTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return data.access_token;
  }

  async searchTracks(query: string, limit = 10): Promise<SpotifyTrackResult[]> {
    const token = await this.getClientToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error("Spotify search failed");
    }

    const data = await response.json();
    return (data.tracks?.items ?? []).map((track: any) => ({
      spotifyTrackId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      albumName: track.album?.name ?? "",
      albumArt: track.album?.images?.[0]?.url ?? null,
      durationMs: track.duration_ms,
      previewUrl: track.preview_url ?? null,
    }));
  }

  async getTrack(trackId: string): Promise<SpotifyTrackResult | null> {
    const token = await this.getClientToken();
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) return null;

    const track = await response.json();
    return {
      spotifyTrackId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      albumName: track.album?.name ?? "",
      albumArt: track.album?.images?.[0]?.url ?? null,
      durationMs: track.duration_ms,
      previewUrl: track.preview_url ?? null,
    };
  }

  // --- Authorization Code Flow (for user auth) ---

  getAuthorizationUrl(state: string): string {
    const scopes = "streaming user-read-playback-state user-modify-playback-state";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope: scopes,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state,
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<SpotifyTokens> {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange Spotify authorization code");
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Spotify token");
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in,
    };
  }
}
