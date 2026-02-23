import { prisma } from "@/lib/db";
import { IRaceRepository } from "@/domain/repositories";
import { RaceRoomData } from "@/domain/entities/RaceRoom";
import { RaceResultData } from "@/domain/entities/RaceResult";
import { v4 as uuidv4 } from "uuid";

function toRoomData(row: any): RaceRoomData {
  return {
    id: row.id,
    roomId: row.roomId,
    player1Id: row.player1Id,
    player2Id: row.player2Id,
    player1Ready: row.player1Ready,
    player2Ready: row.player2Ready,
    lapCount: row.lapCount,
    status: row.status,
    player1Lap: row.player1Lap,
    player2Lap: row.player2Lap,
    player1T: row.player1T,
    player2T: row.player2T,
    player1Time: row.player1Time,
    player2Time: row.player2Time,
    startedAt: row.startedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaRaceRepository implements IRaceRepository {
  async findRoom(roomId: string): Promise<RaceRoomData | null> {
    const row = await prisma.raceRoom.findUnique({ where: { roomId } });
    return row ? toRoomData(row) : null;
  }

  async findActiveRoomByPlayer(userId: string): Promise<RaceRoomData | null> {
    const row = await prisma.raceRoom.findFirst({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: ["waiting", "countdown", "racing"] },
      },
    });
    return row ? toRoomData(row) : null;
  }

  async createRoom(userId: string, lapCount: number): Promise<RaceRoomData> {
    const row = await prisma.raceRoom.create({
      data: {
        roomId: uuidv4().slice(0, 8),
        player1Id: userId,
        lapCount,
        status: "waiting",
      },
    });
    return toRoomData(row);
  }

  async joinRoom(roomId: string, userId: string): Promise<RaceRoomData> {
    const row = await prisma.raceRoom.update({
      where: { roomId },
      data: { player2Id: userId },
    });
    return toRoomData(row);
  }

  async updateReady(roomId: string, userId: string, ready: boolean): Promise<RaceRoomData> {
    const room = await prisma.raceRoom.findUnique({ where: { roomId } });
    if (!room) throw new Error("Room not found");
    const isP1 = room.player1Id === userId;
    const row = await prisma.raceRoom.update({
      where: { roomId },
      data: isP1 ? { player1Ready: ready } : { player2Ready: ready },
    });
    return toRoomData(row);
  }

  async updateStatus(roomId: string, status: string, startedAt?: Date): Promise<RaceRoomData> {
    const row = await prisma.raceRoom.update({
      where: { roomId },
      data: { status, ...(startedAt ? { startedAt } : {}) },
    });
    return toRoomData(row);
  }

  async updateLap(roomId: string, userId: string, lap: number): Promise<RaceRoomData> {
    const room = await prisma.raceRoom.findUnique({ where: { roomId } });
    if (!room) throw new Error("Room not found");
    const isP1 = room.player1Id === userId;
    const row = await prisma.raceRoom.update({
      where: { roomId },
      data: isP1 ? { player1Lap: lap } : { player2Lap: lap },
    });
    return toRoomData(row);
  }

  async updateFinish(roomId: string, userId: string, finishTime: number): Promise<RaceRoomData> {
    const room = await prisma.raceRoom.findUnique({ where: { roomId } });
    if (!room) throw new Error("Room not found");
    const isP1 = room.player1Id === userId;
    const data = isP1 ? { player1Time: finishTime } : { player2Time: finishTime };
    const otherFinished = isP1 ? room.player2Time !== null : room.player1Time !== null;
    const row = await prisma.raceRoom.update({
      where: { roomId },
      data: { ...data, ...(otherFinished ? { status: "finished" } : {}) },
    });
    return toRoomData(row);
  }

  async saveResult(data: { roomId: string; userId: string; lapCount: number; finishTime: number; won: boolean }): Promise<RaceResultData> {
    const row = await prisma.raceResult.create({ data });
    return {
      id: row.id,
      roomId: row.roomId,
      userId: row.userId,
      lapCount: row.lapCount,
      finishTime: row.finishTime,
      won: row.won,
      createdAt: row.createdAt,
    };
  }

  async getLeaderboard(limit = 10): Promise<RaceResultData[]> {
    const rows = await prisma.raceResult.findMany({
      orderBy: { finishTime: "asc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      userId: r.userId,
      lapCount: r.lapCount,
      finishTime: r.finishTime,
      won: r.won,
      createdAt: r.createdAt,
    }));
  }

  async deleteRoom(roomId: string): Promise<void> {
    await prisma.raceRoom.delete({ where: { roomId } }).catch(() => {});
  }
}
