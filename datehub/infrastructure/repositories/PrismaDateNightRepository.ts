import { prisma } from "@/lib/db";
import { IDateNightRepository } from "@/domain/repositories";
import { DateNight } from "@/domain/entities/DateNight";

export class PrismaDateNightRepository implements IDateNightRepository {
  async findById(id: string): Promise<DateNight | null> {
    const record = await prisma.dateNight.findUnique({ where: { id } });
    if (!record) return null;
    return DateNight.reconstitute({
      id: record.id,
      user1Id: record.user1Id,
      user2Id: record.user2Id,
      activityId: record.activityId,
      startTime: record.startTime,
      endTime: record.endTime,
      createdAt: record.createdAt,
    });
  }

  async findByUserId(userId: string): Promise<DateNight[]> {
    const records = await prisma.dateNight.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });
    return records.map((record) =>
      DateNight.reconstitute({
        id: record.id,
        user1Id: record.user1Id,
        user2Id: record.user2Id,
        activityId: record.activityId,
        startTime: record.startTime,
        endTime: record.endTime,
        createdAt: record.createdAt,
      })
    );
  }

  async create(dateNight: DateNight): Promise<DateNight> {
    const record = await prisma.dateNight.create({
      data: {
        id: dateNight.id,
        user1Id: dateNight.user1Id,
        user2Id: dateNight.user2Id,
        activityId: dateNight.activityId,
        startTime: dateNight.startTime,
        endTime: dateNight.endTime,
        createdAt: dateNight.createdAt,
      },
    });
    return DateNight.reconstitute({
      id: record.id,
      user1Id: record.user1Id,
      user2Id: record.user2Id,
      activityId: record.activityId,
      startTime: record.startTime,
      endTime: record.endTime,
      createdAt: record.createdAt,
    });
  }

  async update(dateNight: DateNight): Promise<DateNight> {
    const record = await prisma.dateNight.update({
      where: { id: dateNight.id },
      data: {
        user1Id: dateNight.user1Id,
        user2Id: dateNight.user2Id,
        activityId: dateNight.activityId,
        startTime: dateNight.startTime,
        endTime: dateNight.endTime,
      },
    });
    return DateNight.reconstitute({
      id: record.id,
      user1Id: record.user1Id,
      user2Id: record.user2Id,
      activityId: record.activityId,
      startTime: record.startTime,
      endTime: record.endTime,
      createdAt: record.createdAt,
    });
  }
}
