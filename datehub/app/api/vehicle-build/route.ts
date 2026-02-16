import { NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/infrastructure/container/Container";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const vehicleBuildUpdateSchema = z.object({
  engine: z.string().optional(),
  tires: z.string().optional(),
  body: z.string().optional(),
  spoiler: z.string().optional(),
  nitro: z.string().optional(),
});

export async function GET() {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const build = await container.getVehicleBuildUseCase.execute(user.userId);
    return { build };
  });
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const config = vehicleBuildUpdateSchema.parse(body);
    const build = await container.saveVehicleBuildUseCase.execute(user.userId, config);
    return { build };
  });
}
