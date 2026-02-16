import { prisma } from "@/lib/db";
import { IVehicleBuildRepository, VehicleBuildRecord } from "@/domain/repositories";
import { VehicleBuildConfigProps } from "@/domain/value-objects/VehicleBuildConfig";

export class PrismaVehicleBuildRepository implements IVehicleBuildRepository {
  async findByUserId(userId: string): Promise<VehicleBuildRecord | null> {
    const row = await prisma.vehicleBuild.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      config: {
        engine: row.engine,
        tires: row.tires,
        body: row.body,
        spoiler: row.spoiler,
        nitro: row.nitro,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async save(userId: string, config: VehicleBuildConfigProps): Promise<VehicleBuildRecord> {
    const row = await prisma.vehicleBuild.upsert({
      where: { userId },
      update: {
        engine: config.engine,
        tires: config.tires,
        body: config.body,
        spoiler: config.spoiler,
        nitro: config.nitro,
      },
      create: {
        userId,
        engine: config.engine,
        tires: config.tires,
        body: config.body,
        spoiler: config.spoiler,
        nitro: config.nitro,
      },
    });
    return {
      id: row.id,
      userId: row.userId,
      config: {
        engine: row.engine,
        tires: row.tires,
        body: row.body,
        spoiler: row.spoiler,
        nitro: row.nitro,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
