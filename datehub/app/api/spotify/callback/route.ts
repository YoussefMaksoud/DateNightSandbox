import { NextRequest, NextResponse } from "next/server";
import { spotifyService } from "@/lib/spotify";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_params", request.url)
    );
  }

  try {
    const tokens = await spotifyService.exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    await prisma.spotifyToken.upsert({
      where: { userId: state },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
      create: {
        userId: state,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard?spotify=connected", request.url)
    );
  } catch (error) {
    console.error("[Spotify Callback Error]", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=spotify_auth_failed", request.url)
    );
  }
}
