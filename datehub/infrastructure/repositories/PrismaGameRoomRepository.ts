import { prisma } from "@/lib/db";
import { IGameRoomRepository } from "@/domain/repositories";
import { GameRoomData } from "@/domain/entities/GameRoom";

function toData(row: any): GameRoomData {
  return {
    id: row.id,
    roomId: row.roomId,
    type: row.type,
    player1Id: row.player1Id,
    player2Id: row.player2Id,
    player1Ready: row.player1Ready,
    player2Ready: row.player2Ready,
    status: row.status,
    metadata: JSON.parse(row.metadata),
    startedAt: row.startedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaGameRoomRepository implements IGameRoomRepository {
  async findByRoomId(roomId: string): Promise<GameRoomData | null> {
    const row = await prisma.gameRoom.findUnique({ where: { roomId } });
    return row ? toData(row) : null;
  }

  async findActiveByPlayer(userId: string, type: string): Promise<GameRoomData | null> {
    const row = await prisma.gameRoom.findFirst({
      where: {
        type,
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: ["waiting", "countdown", "playing"] },
      },
    });
    return row ? toData(row) : null;
  }

  async create(data: Omit<GameRoomData, "id" | "createdAt" | "updatedAt">): Promise<GameRoomData> {
    const row = await prisma.gameRoom.create({
      data: {
        roomId: data.roomId,
        type: data.type,
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        player1Ready: data.player1Ready,
        player2Ready: data.player2Ready,
        status: data.status,
        metadata: JSON.stringify(data.metadata),
        startedAt: data.startedAt,
      },
    });
    return toData(row);
  }

  async update(roomId: string, data: Partial<Pick<GameRoomData, "player2Id" | "player1Ready" | "player2Ready" | "status" | "metadata" | "startedAt">>): Promise<GameRoomData> {
    const updateData: any = {};
    if (data.player2Id !== undefined) updateData.player2Id = data.player2Id;
    if (data.player1Ready !== undefined) updateData.player1Ready = data.player1Ready;
    if (data.player2Ready !== undefined) updateData.player2Ready = data.player2Ready;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;

    const row = await prisma.gameRoom.update({
      where: { roomId },
      data: updateData,
    });
    return toData(row);
  }

  async delete(roomId: string): Promise<void> {
    await prisma.gameRoom.delete({ where: { roomId } }).catch(() => {});
  }
}
