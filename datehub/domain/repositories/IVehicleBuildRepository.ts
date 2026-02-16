import { VehicleBuildConfigProps } from "@/domain/value-objects/VehicleBuildConfig";

export interface VehicleBuildRecord {
  id: string;
  userId: string;
  config: VehicleBuildConfigProps;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicleBuildRepository {
  findByUserId(userId: string): Promise<VehicleBuildRecord | null>;
  save(userId: string, config: VehicleBuildConfigProps): Promise<VehicleBuildRecord>;
}
