import { auth } from "@clerk/nextjs/server";
import { UnauthorizedError } from "@/domain/errors";
import { TokenPayload } from "@/application/ports";

export async function requireAuth(): Promise<TokenPayload> {
  const { userId } = await auth();

  if (!userId) {
    throw new UnauthorizedError();
  }

  return {
    userId,
    email: "",
  };
}
