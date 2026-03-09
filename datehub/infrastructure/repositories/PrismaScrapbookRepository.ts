import { prisma } from "@/lib/db";
import { IScrapbookRepository } from "@/domain/repositories";
import {
  ScrapbookData,
  ScrapbookPageData,
  ScrapbookItemData,
  ScrapbookReactionData,
} from "@/domain/entities/Scrapbook";

function mapItem(row: {
  id: string;
  pageId: string;
  type: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  locked: boolean;
  createdBy: string;
  reactions?: { id: string; itemId: string; userId: string; emoji: string }[];
}): ScrapbookItemData {
  return {
    id: row.id,
    pageId: row.pageId,
    type: row.type as ScrapbookItemData["type"],
    content: row.content,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    scale: row.scale,
    zIndex: row.zIndex,
    locked: row.locked,
    createdBy: row.createdBy,
    reactions: (row.reactions ?? []).map((r) => ({
      id: r.id,
      itemId: r.itemId,
      userId: r.userId,
      emoji: r.emoji,
    })),
  };
}

function mapPage(
  row: {
    id: string;
    scrapbookId: string;
    pageNumber: number;
    backgroundColor: string;
    items: Parameters<typeof mapItem>[0][];
  }
): ScrapbookPageData {
  return {
    id: row.id,
    scrapbookId: row.scrapbookId,
    pageNumber: row.pageNumber,
    backgroundColor: row.backgroundColor,
    items: row.items.map(mapItem),
  };
}

function mapScrapbook(
  row: {
    id: string;
    roomId: string;
    name: string;
    coverUrl: string | null;
    shareToken: string | null;
    canvasSize?: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    pages: Parameters<typeof mapPage>[0][];
  }
): ScrapbookData {
  return {
    id: row.id,
    roomId: row.roomId,
    name: row.name,
    coverUrl: row.coverUrl,
    shareToken: row.shareToken,
    canvasSize: row.canvasSize ?? 0,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pages: row.pages.map(mapPage),
  };
}

export class PrismaScrapbookRepository implements IScrapbookRepository {
  async findByRoomId(roomId: string): Promise<ScrapbookData[]> {
    const rows = await prisma.scrapbook.findMany({
      where: { roomId },
      include: {
        pages: {
          include: { items: { include: { reactions: true }, orderBy: { zIndex: "asc" } } },
          orderBy: { pageNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapScrapbook);
  }

  async findById(id: string): Promise<ScrapbookData | null> {
    const row = await prisma.scrapbook.findUnique({
      where: { id },
      include: {
        pages: {
          include: { items: { include: { reactions: true }, orderBy: { zIndex: "asc" } } },
          orderBy: { pageNumber: "asc" },
        },
      },
    });
    if (!row) return null;
    return mapScrapbook(row);
  }

  async create(
    roomId: string,
    name: string,
    createdBy: string
  ): Promise<ScrapbookData> {
    const row = await prisma.scrapbook.create({
      data: {
        roomId,
        name,
        createdBy,
        pages: {
          create: {
            pageNumber: 1,
            backgroundColor: "#FFF8F0",
          },
        },
      },
      include: {
        pages: {
          include: { items: { include: { reactions: true } } },
          orderBy: { pageNumber: "asc" },
        },
      },
    });
    return mapScrapbook(row);
  }

  async addPage(
    scrapbookId: string,
    pageNumber: number,
    backgroundColor = "#FFF8F0"
  ): Promise<ScrapbookPageData> {
    const row = await prisma.scrapbookPage.create({
      data: { scrapbookId, pageNumber, backgroundColor },
      include: { items: { include: { reactions: true } } },
    });
    return mapPage(row);
  }

  async addItem(
    pageId: string,
    item: Omit<ScrapbookItemData, "id" | "pageId">
  ): Promise<ScrapbookItemData> {
    const row = await prisma.scrapbookItem.create({
      data: {
        pageId,
        type: item.type,
        content: item.content,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation,
        scale: item.scale,
        zIndex: item.zIndex,
        createdBy: item.createdBy,
      },
      include: { reactions: true },
    });
    return mapItem(row);
  }

  async updateItem(
    itemId: string,
    updates: Partial<
      Pick<
        ScrapbookItemData,
        | "x"
        | "y"
        | "width"
        | "height"
        | "rotation"
        | "scale"
        | "zIndex"
        | "content"
        | "locked"
      >
    >
  ): Promise<ScrapbookItemData> {
    const row = await prisma.scrapbookItem.update({
      where: { id: itemId },
      data: updates,
      include: { reactions: true },
    });
    return mapItem(row);
  }

  async deleteItem(itemId: string): Promise<void> {
    await prisma.scrapbookItem.delete({ where: { id: itemId } });
  }

  async updatePage(
    pageId: string,
    updates: Partial<Pick<ScrapbookPageData, "backgroundColor">>
  ): Promise<ScrapbookPageData> {
    const row = await prisma.scrapbookPage.update({
      where: { id: pageId },
      data: updates,
      include: { items: { include: { reactions: true }, orderBy: { zIndex: "asc" } } },
    });
    return mapPage(row);
  }

  async deletePage(pageId: string): Promise<void> {
    await prisma.scrapbookPage.delete({ where: { id: pageId } });
  }

  async deleteScrapbook(id: string): Promise<void> {
    await prisma.scrapbook.delete({ where: { id } });
  }

  async updateScrapbook(
    id: string,
    updates: Partial<Pick<ScrapbookData, "canvasSize">>
  ): Promise<ScrapbookData> {
    const row = await prisma.scrapbook.update({
      where: { id },
      data: updates,
      include: {
        pages: {
          include: { items: { include: { reactions: true }, orderBy: { zIndex: "asc" } } },
          orderBy: { pageNumber: "asc" },
        },
      },
    });
    return mapScrapbook(row);
  }

  async toggleItemLock(itemId: string, locked: boolean): Promise<ScrapbookItemData> {
    const row = await prisma.scrapbookItem.update({
      where: { id: itemId },
      data: { locked },
      include: { reactions: true },
    });
    return mapItem(row);
  }

  async addReaction(itemId: string, userId: string, emoji: string): Promise<ScrapbookReactionData> {
    const row = await prisma.scrapbookReaction.upsert({
      where: { itemId_userId: { itemId, userId } },
      update: { emoji },
      create: { itemId, userId, emoji },
    });
    return { id: row.id, itemId: row.itemId, userId: row.userId, emoji: row.emoji };
  }

  async removeReaction(itemId: string, userId: string): Promise<void> {
    await prisma.scrapbookReaction.deleteMany({ where: { itemId, userId } });
  }

  async generateShareToken(scrapbookId: string): Promise<string> {
    const token = require("crypto").randomUUID().replace(/-/g, "").slice(0, 16);
    await prisma.scrapbook.update({ where: { id: scrapbookId }, data: { shareToken: token } });
    return token;
  }

  async findByShareToken(token: string): Promise<ScrapbookData | null> {
    const row = await prisma.scrapbook.findUnique({
      where: { shareToken: token },
      include: {
        pages: {
          include: { items: { include: { reactions: true }, orderBy: { zIndex: "asc" } } },
          orderBy: { pageNumber: "asc" },
        },
      },
    });
    if (!row) return null;
    return mapScrapbook(row);
  }
}
