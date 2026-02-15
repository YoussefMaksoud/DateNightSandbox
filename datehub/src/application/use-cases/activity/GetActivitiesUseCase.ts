import { IActivityRepository } from "@/domain/repositories";
import { ActivityDto } from "@/application/dtos";

export class GetActivitiesUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(): Promise<ActivityDto[]> {
    const activities = await this.activityRepository.findAll();
    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
    }));
  }
}
