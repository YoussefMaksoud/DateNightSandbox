export interface ScrapbookItemData {
  id: string;
  pageId: string;
  type: "photo" | "sticker" | "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  createdBy: string;
}

export interface ScrapbookPageData {
  id: string;
  scrapbookId: string;
  pageNumber: number;
  backgroundColor: string;
  items: ScrapbookItemData[];
}

export interface ScrapbookData {
  id: string;
  roomId: string;
  name: string;
  coverUrl: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  pages: ScrapbookPageData[];
}
