import { IMusicService, Track } from "@/application/ports";

export class MockMusicAdapter implements IMusicService {
  private playlists: Map<string, Track[]> = new Map();

  private getDefaultPlaylist(): Track[] {
    return [
      { trackId: "1", title: "Thinking Out Loud", artist: "Ed Sheeran" },
      { trackId: "2", title: "Perfect", artist: "Ed Sheeran" },
      { trackId: "3", title: "All of Me", artist: "John Legend" },
    ];
  }

  async getPlaylist(userId: string): Promise<Track[]> {
    return this.playlists.get(userId) ?? this.getDefaultPlaylist();
  }

  async addTrack(userId: string, trackId: string): Promise<void> {
    const playlist = this.playlists.get(userId) ?? [
      ...this.getDefaultPlaylist(),
    ];
    playlist.push({ trackId, title: `Track ${trackId}`, artist: "Unknown" });
    this.playlists.set(userId, playlist);
  }
}
