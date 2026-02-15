export interface Track {
  trackId: string;
  title: string;
  artist: string;
}

export interface IMusicService {
  getPlaylist(userId: string): Promise<Track[]>;
  addTrack(userId: string, trackId: string): Promise<void>;
}
