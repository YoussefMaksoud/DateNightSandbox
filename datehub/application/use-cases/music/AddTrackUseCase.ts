import { IMusicService } from "@/application/ports";
import { AddTrackDto } from "@/application/dtos";

export class AddTrackUseCase {
  constructor(private readonly musicService: IMusicService) {}

  async execute(dto: AddTrackDto): Promise<void> {
    await this.musicService.addTrack(dto.userId, dto.trackId);
  }
}
