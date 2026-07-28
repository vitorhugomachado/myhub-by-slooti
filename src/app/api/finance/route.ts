import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCharge } from "@/lib/mappers";
import type { FinanceCharge } from "@/lib/finance";
import { hasFinanceAccess } from "@/lib/plans";
import { getSessionUser } from "@/lib/session";

function financeForbidden() {
  return NextResponse.json(
    {
      error: "finance_plan_required",
      message: "O módulo financeiro está disponível no Plano Pro.",
    },
    { status: 403 },
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasFinanceAccess(user.plan)) {
    return financeForbidden();
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
  if (!hasFinanceAccess(user.plan)) {
    return financeForbidden();
  }

  const body = (await request.json()) as { entries?: FinanceCharge[] };
  const entries = Array.isArray(body.entries) ? body.entries : [];

  const patientIds = [
    ...new Set(
      entries
        .map((e) => e.patientId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (patientIds.length > 0) {
    const owned = await prisma.patient.findMany({
      where: { userId: user.id, id: { in: patientIds } },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((p) => p.id));
    const foreign = patientIds.filter((id) => !ownedSet.has(id));
    if (foreign.length > 0) {
      return NextResponse.json(
        {
          error: "invalid_patient",
          message: "Paciente não pertence à sua conta.",
        },
        { status: 400 },
      );
    }
  }

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
