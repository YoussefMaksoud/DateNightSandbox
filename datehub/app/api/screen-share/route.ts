import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiRequest } from "@/lib/api-handler";
import { requireAuth } from "@/lib/auth-middleware";

const createSchema = z.object({
  roomId: z.string(),
  offer: z.string(),
});

const answerSchema = z.object({
  roomId: z.string(),
  answer: z.string(),
});

const candidateSchema = z.object({
  roomId: z.string(),
  candidate: z.string(),
  role: z.enum(["host", "viewer"]),
});

// GET — poll session state
export async function GET(request: NextRequest) {
  return handleApiRequest(async () => {
    await requireAuth();
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) return { session: null };
    const session = await prisma.screenShare.findUnique({ where: { roomId } });
    if (!session || !session.isActive) return { session: null };
    return {
      session: {
        roomId: session.roomId,
        hostUserId: session.hostUserId,
        offer: session.offer,
        answer: session.answer,
        hostCandidates: JSON.parse(session.hostCandidates),
        viewerCandidates: JSON.parse(session.viewerCandidates),
        isActive: session.isActive,
      },
    };
  });
}

// POST — create session (host starts sharing) or add candidate
export async function POST(request: NextRequest) {
  return handleApiRequest(async () => {
    const user = await requireAuth();
    const body = await request.json();
    const action = body.action as string;

    if (action === "create") {
      const { roomId, offer } = createSchema.parse(body);
      const session = await prisma.screenShare.upsert({
        where: { roomId },
        update: {
          hostUserId: user.userId,
          offer,
          answer: null,
          hostCandidates: "[]",
          viewerCandidates: "[]",
          isActive: true,
        },
        create: {
          roomId,
          hostUserId: user.userId,
          offer,
          answer: null,
          hostCandidates: "[]",
          viewerCandidates: "[]",
          isActive: true,
        },
      });
      return { session: { roomId: session.roomId } };
    }

    if (action === "answer") {
      const { roomId, answer } = answerSchema.parse(body);
      await prisma.screenShare.update({
        where: { roomId },
        data: { answer },
      });
      return { ok: true };
    }

    if (action === "candidate") {
      const { roomId, candidate, role } = candidateSchema.parse(body);
      const session = await prisma.screenShare.findUnique({ where: { roomId } });
      if (!session) return { ok: false };
      if (role === "host") {
        const existing = JSON.parse(session.hostCandidates) as string[];
        existing.push(candidate);
        await prisma.screenShare.update({
          where: { roomId },
          data: { hostCandidates: JSON.stringify(existing) },
        });
      } else {
        const existing = JSON.parse(session.viewerCandidates) as string[];
        existing.push(candidate);
        await prisma.screenShare.update({
          where: { roomId },
          data: { viewerCandidates: JSON.stringify(existing) },
        });
      }
      return { ok: true };
    }

    if (action === "stop") {
      const roomId = body.roomId as string;
      if (roomId) {
        await prisma.screenShare.updateMany({
          where: { roomId },
          data: { isActive: false },
        });
      }
      return { ok: true };
    }

    return { error: "Unknown action" };
  });
}
