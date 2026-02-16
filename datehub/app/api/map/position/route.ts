import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

const updatePositionSchema = z.object({
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(2000),
});

export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    const where = since ? { updatedAt: { gte: new Date(since) } } : {};

    const positions = await prisma.mapPosition.findMany({
      where,
      select: {
        userId: true,
        x: true,
        y: true,
        updatedAt: true,
      },
    });

    // Ensure current user's position is always included
    const hasCurrentUser = positions.some((p) => p.userId === user.userId);
    if (since && !hasCurrentUser) {
      const own = await prisma.mapPosition.findUnique({
        where: { userId: user.userId },
        select: { userId: true, x: true, y: true, updatedAt: true },
      });
      if (own) positions.push(own);
    }

    // Fetch avatar configs for all users with positions
    const userIds = positions.map((p) => p.userId);
    const avatars = await prisma.avatar.findMany({
      where: { userId: { in: userIds } },
    });

    const avatarMap = new Map(avatars.map((a) => [a.userId, {
      skinTone: a.skinTone,
      hairStyle: a.hairStyle,
      hairColor: a.hairColor,
      eyeColor: a.eyeColor,
      outfit: a.outfit,
      outfitColor: a.outfitColor,
      accessory: a.accessory,
      expression: a.expression,
      background: a.background,
      vehicle: a.vehicle,
    }]));

    return {
      players: positions.map((p) => ({
        userId: p.userId,
        x: p.x,
        y: p.y,
        avatar: avatarMap.get(p.userId) ?? null,
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  });
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { x, y } = updatePositionSchema.parse(body);

    const position = await prisma.mapPosition.upsert({
      where: { userId: user.userId },
      update: { x, y },
      create: { userId: user.userId, x, y },
    });

    return { x: position.x, y: position.y };
  });
}
