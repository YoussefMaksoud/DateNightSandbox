import {
  ScrapbookData,
  ScrapbookPageData,
  ScrapbookItemData,
  ScrapbookReactionData,
} from "@/domain/entities/Scrapbook";

export interface IScrapbookRepository {
  findByRoomId(roomId: string): Promise<ScrapbookData[]>;
  findById(id: string): Promise<ScrapbookData | null>;
  create(
    roomId: string,
    name: string,
    createdBy: string
  ): Promise<ScrapbookData>;
  addPage(
    scrapbookId: string,
    pageNumber: number,
    backgroundColor?: string
  ): Promise<ScrapbookPageData>;
  addItem(
    pageId: string,
    item: Omit<ScrapbookItemData, "id" | "pageId">
  ): Promise<ScrapbookItemData>;
  updateItem(
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
  ): Promise<ScrapbookItemData>;
  deleteItem(itemId: string): Promise<void>;
  toggleItemLock(itemId: string, locked: boolean): Promise<ScrapbookItemData>;
  addReaction(itemId: string, userId: string, emoji: string): Promise<ScrapbookReactionData>;
  removeReaction(itemId: string, userId: string): Promise<void>;
  generateShareToken(scrapbookId: string): Promise<string>;
  findByShareToken(token: string): Promise<ScrapbookData | null>;
  updatePage(pageId: string, updates: Partial<Pick<ScrapbookPageData, "backgroundColor">>): Promise<ScrapbookPageData>;
  deletePage(pageId: string): Promise<void>;
  deleteScrapbook(id: string): Promise<void>;
  updateScrapbook(id: string, updates: Partial<Pick<ScrapbookData, "canvasSize">>): Promise<ScrapbookData>;
}
