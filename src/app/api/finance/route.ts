import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCharge } from "@/lib/mappers";
import type { FinanceCharge } from "@/lib/finance";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.financeCharge.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ entries: rows.map(toCharge) });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { entries?: FinanceCharge[] };
  const entries = Array.isArray(body.entries) ? body.entries : [];

  await prisma.$transaction(async (tx) => {
    await tx.financeCharge.deleteMany({ where: { userId: user.id } });
    if (entries.length) {
      await tx.financeCharge.createMany({
        data: entries.map((e) => ({
          id: e.id,
          userId: user.id,
          patientId: e.patientId ?? null,
          patientName: e.patientName,
          appointmentId: e.appointmentId ?? null,
          date: e.date,
          description: e.description,
          amount: e.amount,
          method: e.method,
          status: e.status,
          kind: e.kind,
          note: e.note ?? "",
          isPackageLastSession: Boolean(e.isPackageLastSession),
        })),
      });
    }
  });

  return NextResponse.json({ ok: true, count: entries.length });
}
