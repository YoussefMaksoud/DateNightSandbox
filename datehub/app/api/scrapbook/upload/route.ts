import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

// Allow up to 5MB uploads on Vercel serverless
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const filename = `scrapbook/${randomUUID()}.${ext}`;
    const blob = await put(filename, file, { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
