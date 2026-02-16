import { IVehicleBuildRepository } from "@/domain/repositories";
import { VehicleBuildDto } from "@/application/dtos";
import { VehicleBuildConfig } from "@/domain/value-objects";

export class SaveVehicleBuildUseCase {
  constructor(private readonly vehicleBuildRepository: IVehicleBuildRepository) {}

  async execute(userId: string, config: Partial<VehicleBuildDto>): Promise<VehicleBuildDto> {
    // Merge with existing or defaults
    const existing = await this.vehicleBuildRepository.findByUserId(userId);
    const merged = { ...(existing?.config ?? {}), ...config };
    const validated = VehicleBuildConfig.create(merged);
    const saved = await this.vehicleBuildRepository.save(userId, validated.toJSON());
    const savedConfig = VehicleBuildConfig.create(saved.config);
    return {
      ...savedConfig.toJSON(),
      stats: savedConfig.computeStats(),
    };
  }
}
