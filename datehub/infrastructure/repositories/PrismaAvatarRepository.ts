import { prisma } from "@/lib/db";
import { IAvatarRepository, AvatarRecord } from "@/domain/repositories";
import { AvatarConfigProps } from "@/domain/value-objects/AvatarConfig";

export class PrismaAvatarRepository implements IAvatarRepository {
  async findByUserId(userId: string): Promise<AvatarRecord | null> {
    const row = await prisma.avatar.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      config: {
        skinTone: row.skinTone,
        hairStyle: row.hairStyle,
        hairColor: row.hairColor,
        eyeColor: row.eyeColor,
        outfit: row.outfit,
        outfitColor: row.outfitColor,
        accessory: row.accessory,
        expression: row.expression,
        background: row.background,
        vehicle: row.vehicle,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async save(userId: string, config: AvatarConfigProps): Promise<AvatarRecord> {
    const row = await prisma.avatar.upsert({
      where: { userId },
      update: {
        skinTone: config.skinTone,
        hairStyle: config.hairStyle,
        hairColor: config.hairColor,
        eyeColor: config.eyeColor,
        outfit: config.outfit,
        outfitColor: config.outfitColor,
        accessory: config.accessory,
        expression: config.expression,
        background: config.background,
        vehicle: config.vehicle,
      },
      create: {
        userId,
        skinTone: config.skinTone,
        hairStyle: config.hairStyle,
        hairColor: config.hairColor,
        eyeColor: config.eyeColor,
        outfit: config.outfit,
        outfitColor: config.outfitColor,
        accessory: config.accessory,
        expression: config.expression,
        background: config.background,
        vehicle: config.vehicle,
      },
    });
    return {
      id: row.id,
      userId: row.userId,
      config: {
        skinTone: row.skinTone,
        hairStyle: row.hairStyle,
        hairColor: row.hairColor,
        eyeColor: row.eyeColor,
        outfit: row.outfit,
        outfitColor: row.outfitColor,
        accessory: row.accessory,
        expression: row.expression,
        background: row.background,
        vehicle: row.vehicle,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
