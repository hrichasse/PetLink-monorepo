import { NextResponse } from "next/server";
import { prisma } from "@petlink/database";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", app: "pets", db: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "degraded", app: "pets", db: message }, { status: 503 });
  }
}
