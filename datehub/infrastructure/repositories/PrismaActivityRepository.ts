import { prisma } from "@/lib/db";
import { IActivityRepository } from "@/domain/repositories";
import { Activity, ActivityType } from "@/domain/entities/Activity";
import type { Activity as PrismaActivity } from "@prisma/client";

export class PrismaActivityRepository implements IActivityRepository {
  private toDomain(record: PrismaActivity): Activity {
    return Activity.reconstitute({
      id: record.id,
      title: record.title,
      description: record.description,
      type: record.type as ActivityType,
    });
  }

  async findById(id: string): Promise<Activity | null> {
    const record = await prisma.activity.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findAll(): Promise<Activity[]> {
    const records = await prisma.activity.findMany();
    return records.map((record) => this.toDomain(record));
  }

  async create(activity: Activity): Promise<Activity> {
    const record = await prisma.activity.create({
      data: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
      },
    });
    return this.toDomain(record);
  }
}
