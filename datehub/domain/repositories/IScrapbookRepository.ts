import {
  ScrapbookData,
  ScrapbookPageData,
  ScrapbookItemData,
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
      >
    >
  ): Promise<ScrapbookItemData>;
  deleteItem(itemId: string): Promise<void>;
}
