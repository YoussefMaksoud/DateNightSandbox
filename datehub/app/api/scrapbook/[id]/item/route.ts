import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const addItemSchema = z.object({
  pageId: z.string(),
  type: z.enum(["photo", "sticker", "text"]),
  content: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional().default(0),
  scale: z.number().optional().default(1),
  zIndex: z.number().optional().default(0),
});

const updateItemSchema = z.object({
  itemId: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  scale: z.number().optional(),
  zIndex: z.number().optional(),
  content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const { pageId, type, content, x, y, width, height, rotation, scale, zIndex } =
      addItemSchema.parse(body);
    const item = await container.addItemUseCase.execute(pageId, {
      type,
      content,
      x,
      y,
      width,
      height,
      rotation,
      scale,
      zIndex,
      createdBy: user.userId,
    });
    return { item };
  }, 201);
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const body = await request.json();
    const { itemId, ...updates } = updateItemSchema.parse(body);
    const item = await container.updateItemUseCase.execute(itemId, updates);
    return { item };
  });
}
