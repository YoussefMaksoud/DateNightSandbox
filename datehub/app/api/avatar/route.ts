import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";
import { AVATAR_OPTIONS } from "@/domain/value-objects";

const avatarUpdateSchema = z.object({
  skinTone: z.string().optional(),
  hairStyle: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  outfit: z.string().optional(),
  outfitColor: z.string().optional(),
  accessory: z.string().optional(),
  expression: z.string().optional(),
  background: z.string().optional(),
  vehicle: z.string().optional(),
});

export async function GET() {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const avatar = await container.getAvatarUseCase.execute(user.userId);
    return { avatar };
  });
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const config = avatarUpdateSchema.parse(body);
    const avatar = await container.saveAvatarUseCase.execute(user.userId, config);
    return { avatar };
  });
}
