import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "neura",
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/health]", error);
    return NextResponse.json(
      {
        ok: false,
        service: "neura",
        error: "database_unavailable",
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
