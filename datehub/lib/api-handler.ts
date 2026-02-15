import { NextResponse } from "next/server";
import { DomainError } from "@/domain/errors";
import { ZodError } from "zod";

export async function handleApiRequest<T>(
  fn: () => Promise<T>,
  successStatus = 200
): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json(result, { status: successStatus });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.httpStatus }
      );
    }
    console.error("[API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
