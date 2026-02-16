import { IVehicleBuildRepository } from "@/domain/repositories";
import { VehicleBuildDto } from "@/application/dtos";
import { VehicleBuildConfig } from "@/domain/value-objects";

export class GetVehicleBuildUseCase {
  constructor(private readonly vehicleBuildRepository: IVehicleBuildRepository) {}

  async execute(userId: string): Promise<VehicleBuildDto> {
    const record = await this.vehicleBuildRepository.findByUserId(userId);
    const config = record
      ? VehicleBuildConfig.create(record.config)
      : VehicleBuildConfig.create({});
    return {
      ...config.toJSON(),
      stats: config.computeStats(),
    };
  }
}
