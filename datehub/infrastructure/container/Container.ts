import {
  IActivityRepository,
  IDateNightRepository,
} from "@/domain/repositories";
import { IMusicService } from "@/application/ports";
import { PrismaActivityRepository } from "@/infrastructure/repositories/PrismaActivityRepository";
import { PrismaDateNightRepository } from "@/infrastructure/repositories/PrismaDateNightRepository";
import { MockMusicAdapter } from "@/infrastructure/adapters/MockMusicAdapter";
import { GetActivitiesUseCase } from "@/application/use-cases/activity/GetActivitiesUseCase";
import { StartActivityUseCase } from "@/application/use-cases/activity/StartActivityUseCase";
import { GetPlaylistUseCase } from "@/application/use-cases/music/GetPlaylistUseCase";
import { AddTrackUseCase } from "@/application/use-cases/music/AddTrackUseCase";

class Container {
  private _activityRepository?: IActivityRepository;
  private _dateNightRepository?: IDateNightRepository;
  private _musicService?: IMusicService;

  get activityRepository(): IActivityRepository {
    if (!this._activityRepository) {
      this._activityRepository = new PrismaActivityRepository();
    }
    return this._activityRepository;
  }

  get dateNightRepository(): IDateNightRepository {
    if (!this._dateNightRepository) {
      this._dateNightRepository = new PrismaDateNightRepository();
    }
    return this._dateNightRepository;
  }

  get musicService(): IMusicService {
    if (!this._musicService) {
      this._musicService = new MockMusicAdapter();
    }
    return this._musicService;
  }

  get getActivitiesUseCase(): GetActivitiesUseCase {
    return new GetActivitiesUseCase(this.activityRepository);
  }

  get startActivityUseCase(): StartActivityUseCase {
    return new StartActivityUseCase(
      this.activityRepository,
      this.dateNightRepository
    );
  }

  get getPlaylistUseCase(): GetPlaylistUseCase {
    return new GetPlaylistUseCase(this.musicService);
  }

  get addTrackUseCase(): AddTrackUseCase {
    return new AddTrackUseCase(this.musicService);
  }
}

// Singleton container for the application
const globalForContainer = globalThis as unknown as {
  container: Container | undefined;
};
export const container =
  globalForContainer.container ?? new Container();
if (process.env.NODE_ENV !== "production") {
  globalForContainer.container = container;
}
