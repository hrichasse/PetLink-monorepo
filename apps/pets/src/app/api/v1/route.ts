import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: "PetLink pets API",
    version: "v1",
    status: "ok"
  });
}
