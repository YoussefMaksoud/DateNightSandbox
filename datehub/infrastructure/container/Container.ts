import {
  IActivityRepository,
  IDateNightRepository,
} from "@/domain/repositories";
import { IMusicService, IPaintingAIService } from "@/application/ports";
import { PrismaActivityRepository } from "@/infrastructure/repositories/PrismaActivityRepository";
import { PrismaDateNightRepository } from "@/infrastructure/repositories/PrismaDateNightRepository";
import { MockMusicAdapter } from "@/infrastructure/adapters/MockMusicAdapter";
import { GetActivitiesUseCase } from "@/application/use-cases/activity/GetActivitiesUseCase";
import { StartActivityUseCase } from "@/application/use-cases/activity/StartActivityUseCase";
import { GetPlaylistUseCase } from "@/application/use-cases/music/GetPlaylistUseCase";
import { AddTrackUseCase } from "@/application/use-cases/music/AddTrackUseCase";
import { IAvatarRepository, IScrapbookRepository, IVehicleBuildRepository, IPaintingSessionRepository } from "@/domain/repositories";
import { PrismaAvatarRepository } from "@/infrastructure/repositories/PrismaAvatarRepository";
import { PrismaScrapbookRepository } from "@/infrastructure/repositories/PrismaScrapbookRepository";
import { PrismaVehicleBuildRepository } from "@/infrastructure/repositories/PrismaVehicleBuildRepository";
import { GetVehicleBuildUseCase } from "@/application/use-cases/vehicle-build/GetVehicleBuildUseCase";
import { SaveVehicleBuildUseCase } from "@/application/use-cases/vehicle-build/SaveVehicleBuildUseCase";
import { GetAvatarUseCase } from "@/application/use-cases/avatar/GetAvatarUseCase";
import { SaveAvatarUseCase } from "@/application/use-cases/avatar/SaveAvatarUseCase";
import { GetScrapbooksUseCase } from "@/application/use-cases/scrapbook/GetScrapbooksUseCase";
import { GetScrapbookUseCase } from "@/application/use-cases/scrapbook/GetScrapbookUseCase";
import { CreateScrapbookUseCase } from "@/application/use-cases/scrapbook/CreateScrapbookUseCase";
import { AddPageUseCase } from "@/application/use-cases/scrapbook/AddPageUseCase";
import { AddItemUseCase } from "@/application/use-cases/scrapbook/AddItemUseCase";
import { UpdateItemUseCase } from "@/application/use-cases/scrapbook/UpdateItemUseCase";
import { DeleteItemUseCase } from "@/application/use-cases/scrapbook/DeleteItemUseCase";
import { PrismaPaintingSessionRepository } from "@/infrastructure/repositories/PrismaPaintingSessionRepository";
import { OpenAIPaintingAdapter } from "@/infrastructure/adapters/OpenAIPaintingAdapter";
import { CreatePaintingSessionUseCase } from "@/application/use-cases/painting-session/CreatePaintingSessionUseCase";
import { GetPaintingSessionsUseCase } from "@/application/use-cases/painting-session/GetPaintingSessionsUseCase";
import { UpdatePaintingSessionUseCase } from "@/application/use-cases/painting-session/UpdatePaintingSessionUseCase";
import { IRaceRepository } from "@/domain/repositories";
import { PrismaRaceRepository } from "@/infrastructure/repositories/PrismaRaceRepository";
import { CreateRaceRoomUseCase } from "@/application/use-cases/race/CreateRaceRoomUseCase";
import { JoinRaceRoomUseCase } from "@/application/use-cases/race/JoinRaceRoomUseCase";
import { GetRaceRoomUseCase } from "@/application/use-cases/race/GetRaceRoomUseCase";
import { UpdateRaceUseCase } from "@/application/use-cases/race/UpdateRaceUseCase";
import { RecordRaceResultUseCase } from "@/application/use-cases/race/RecordRaceResultUseCase";
import { GetLeaderboardUseCase } from "@/application/use-cases/race/GetLeaderboardUseCase";
import { ITriviaRepository } from "@/domain/repositories";
import { PrismaTriviaRepository } from "@/infrastructure/repositories/PrismaTriviaRepository";
import { OpenAITriviaAdapter } from "@/infrastructure/adapters/OpenAITriviaAdapter";
import { ITriviaAIService } from "@/application/ports";
import { CreateTriviaRoomUseCase } from "@/application/use-cases/trivia/CreateTriviaRoomUseCase";
import { JoinTriviaRoomUseCase } from "@/application/use-cases/trivia/JoinTriviaRoomUseCase";
import { GetTriviaRoomUseCase } from "@/application/use-cases/trivia/GetTriviaRoomUseCase";
import { UpdateTriviaRoomUseCase } from "@/application/use-cases/trivia/UpdateTriviaRoomUseCase";
import { GenerateQuestionUseCase } from "@/application/use-cases/trivia/GenerateQuestionUseCase";
import { SubmitAnswerUseCase } from "@/application/use-cases/trivia/SubmitAnswerUseCase";
import { ScoreRoundUseCase } from "@/application/use-cases/trivia/ScoreRoundUseCase";
import { SaveTriviaResultUseCase } from "@/application/use-cases/trivia/SaveTriviaResultUseCase";
import { GetTriviaLeaderboardUseCase } from "@/application/use-cases/trivia/GetTriviaLeaderboardUseCase";

class Container {
  private _activityRepository?: IActivityRepository;
  private _dateNightRepository?: IDateNightRepository;
  private _musicService?: IMusicService;
  private _avatarRepository?: IAvatarRepository;
  private _scrapbookRepository?: IScrapbookRepository;
  private _vehicleBuildRepository?: IVehicleBuildRepository;
  private _paintingSessionRepository?: IPaintingSessionRepository;
  private _paintingAIService?: IPaintingAIService;
  private _raceRepository?: IRaceRepository;
  private _triviaRepository?: ITriviaRepository;
  private _triviaAIService?: ITriviaAIService;

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

  get avatarRepository(): IAvatarRepository {
    if (!this._avatarRepository) {
      this._avatarRepository = new PrismaAvatarRepository();
    }
    return this._avatarRepository;
  }

  get scrapbookRepository(): IScrapbookRepository {
    if (!this._scrapbookRepository) {
      this._scrapbookRepository = new PrismaScrapbookRepository();
    }
    return this._scrapbookRepository;
  }

  get vehicleBuildRepository(): IVehicleBuildRepository {
    if (!this._vehicleBuildRepository) {
      this._vehicleBuildRepository = new PrismaVehicleBuildRepository();
    }
    return this._vehicleBuildRepository;
  }

  get paintingSessionRepository(): IPaintingSessionRepository {
    if (!this._paintingSessionRepository) {
      this._paintingSessionRepository = new PrismaPaintingSessionRepository();
    }
    return this._paintingSessionRepository;
  }

  get paintingAIService(): IPaintingAIService {
    if (!this._paintingAIService) {
      this._paintingAIService = new OpenAIPaintingAdapter();
    }
    return this._paintingAIService;
  }

  get raceRepository(): IRaceRepository {
    if (!this._raceRepository) {
      this._raceRepository = new PrismaRaceRepository();
    }
    return this._raceRepository;
  }

  get triviaRepository(): ITriviaRepository {
    if (!this._triviaRepository) {
      this._triviaRepository = new PrismaTriviaRepository();
    }
    return this._triviaRepository;
  }

  get triviaAIService(): ITriviaAIService {
    if (!this._triviaAIService) {
      this._triviaAIService = new OpenAITriviaAdapter();
    }
    return this._triviaAIService;
  }

  get getAvatarUseCase(): GetAvatarUseCase {
    return new GetAvatarUseCase(this.avatarRepository);
  }

  get saveAvatarUseCase(): SaveAvatarUseCase {
    return new SaveAvatarUseCase(this.avatarRepository);
  }

  get getScrapbooksUseCase(): GetScrapbooksUseCase {
    return new GetScrapbooksUseCase(this.scrapbookRepository);
  }

  get getScrapbookUseCase(): GetScrapbookUseCase {
    return new GetScrapbookUseCase(this.scrapbookRepository);
  }

  get createScrapbookUseCase(): CreateScrapbookUseCase {
    return new CreateScrapbookUseCase(this.scrapbookRepository);
  }

  get addPageUseCase(): AddPageUseCase {
    return new AddPageUseCase(this.scrapbookRepository);
  }

  get addItemUseCase(): AddItemUseCase {
    return new AddItemUseCase(this.scrapbookRepository);
  }

  get updateItemUseCase(): UpdateItemUseCase {
    return new UpdateItemUseCase(this.scrapbookRepository);
  }

  get deleteItemUseCase(): DeleteItemUseCase {
    return new DeleteItemUseCase(this.scrapbookRepository);
  }

  get getVehicleBuildUseCase(): GetVehicleBuildUseCase {
    return new GetVehicleBuildUseCase(this.vehicleBuildRepository);
  }

  get saveVehicleBuildUseCase(): SaveVehicleBuildUseCase {
    return new SaveVehicleBuildUseCase(this.vehicleBuildRepository);
  }

  get createPaintingSessionUseCase(): CreatePaintingSessionUseCase {
    return new CreatePaintingSessionUseCase(this.paintingSessionRepository, this.paintingAIService);
  }

  get getPaintingSessionsUseCase(): GetPaintingSessionsUseCase {
    return new GetPaintingSessionsUseCase(this.paintingSessionRepository);
  }

  get updatePaintingSessionUseCase(): UpdatePaintingSessionUseCase {
    return new UpdatePaintingSessionUseCase(this.paintingSessionRepository);
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

  get createRaceRoomUseCase(): CreateRaceRoomUseCase {
    return new CreateRaceRoomUseCase(this.raceRepository);
  }

  get joinRaceRoomUseCase(): JoinRaceRoomUseCase {
    return new JoinRaceRoomUseCase(this.raceRepository);
  }

  get getRaceRoomUseCase(): GetRaceRoomUseCase {
    return new GetRaceRoomUseCase(this.raceRepository);
  }

  get updateRaceUseCase(): UpdateRaceUseCase {
    return new UpdateRaceUseCase(this.raceRepository);
  }

  get recordRaceResultUseCase(): RecordRaceResultUseCase {
    return new RecordRaceResultUseCase(this.raceRepository);
  }

  get getLeaderboardUseCase(): GetLeaderboardUseCase {
    return new GetLeaderboardUseCase(this.raceRepository);
  }

  get createTriviaRoomUseCase(): CreateTriviaRoomUseCase {
    return new CreateTriviaRoomUseCase(this.triviaRepository);
  }

  get joinTriviaRoomUseCase(): JoinTriviaRoomUseCase {
    return new JoinTriviaRoomUseCase(this.triviaRepository);
  }

  get getTriviaRoomUseCase(): GetTriviaRoomUseCase {
    return new GetTriviaRoomUseCase(this.triviaRepository);
  }

  get updateTriviaRoomUseCase(): UpdateTriviaRoomUseCase {
    return new UpdateTriviaRoomUseCase(this.triviaRepository);
  }

  get generateQuestionUseCase(): GenerateQuestionUseCase {
    return new GenerateQuestionUseCase(this.triviaRepository, this.triviaAIService);
  }

  get submitAnswerUseCase(): SubmitAnswerUseCase {
    return new SubmitAnswerUseCase(this.triviaRepository);
  }

  get scoreRoundUseCase(): ScoreRoundUseCase {
    return new ScoreRoundUseCase(this.triviaRepository);
  }

  get saveTriviaResultUseCase(): SaveTriviaResultUseCase {
    return new SaveTriviaResultUseCase(this.triviaRepository);
  }

  get getTriviaLeaderboardUseCase(): GetTriviaLeaderboardUseCase {
    return new GetTriviaLeaderboardUseCase(this.triviaRepository);
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
