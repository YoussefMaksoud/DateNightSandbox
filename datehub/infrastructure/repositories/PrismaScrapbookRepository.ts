import { prisma } from "@/lib/db";
import { IScrapbookRepository } from "@/domain/repositories";
import {
  ScrapbookData,
  ScrapbookPageData,
  ScrapbookItemData,
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
  createdBy: string;
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
    createdBy: row.createdBy,
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
          include: { items: { orderBy: { zIndex: "asc" } } },
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
          include: { items: { orderBy: { zIndex: "asc" } } },
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
          include: { items: true },
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
      include: { items: true },
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
      >
    >
  ): Promise<ScrapbookItemData> {
    const row = await prisma.scrapbookItem.update({
      where: { id: itemId },
      data: updates,
    });
    return mapItem(row);
  }

  async deleteItem(itemId: string): Promise<void> {
    await prisma.scrapbookItem.delete({ where: { id: itemId } });
  }
}
