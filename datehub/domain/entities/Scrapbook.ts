export interface ScrapbookReactionData {
  id: string;
  itemId: string;
  userId: string;
  emoji: string;
}

export interface ScrapbookItemData {
  id: string;
  pageId: string;
  type: "photo" | "sticker" | "text" | "drawing";
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
  reactions: ScrapbookReactionData[];
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
  shareToken: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  pages: ScrapbookPageData[];
}
