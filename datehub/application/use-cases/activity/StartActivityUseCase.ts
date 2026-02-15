import { v4 as uuidv4 } from "uuid";
import { IActivityRepository, IDateNightRepository } from "@/domain/repositories";
import { DateNight } from "@/domain/entities";
import { NotFoundError } from "@/domain/errors";
import { StartActivityDto, StartActivityResultDto } from "@/application/dtos";

export class StartActivityUseCase {
  constructor(
    private readonly activityRepository: IActivityRepository,
    private readonly dateNightRepository: IDateNightRepository
  ) {}

  async execute(dto: StartActivityDto): Promise<StartActivityResultDto> {
    const activity = await this.activityRepository.findById(dto.activityId);
    if (!activity) {
      throw new NotFoundError("Activity", dto.activityId);
    }

    const dateNight = DateNight.createPending({
      id: uuidv4(),
      hostId: dto.userId,
      activityId: dto.activityId,
      startTime: new Date(),
    });

    const saved = await this.dateNightRepository.create(dateNight);
    return { sessionId: saved.id };
  }
}
