import { IMusicService, Track } from "@/application/ports";

export class GetPlaylistUseCase {
  constructor(private readonly musicService: IMusicService) {}

  async execute(userId: string): Promise<Track[]> {
    return this.musicService.getPlaylist(userId);
  }
}
