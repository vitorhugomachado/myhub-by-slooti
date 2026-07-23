import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPendency } from "@/lib/mappers";
import type { Pendency, PendencyType } from "@/lib/pendencies";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.pendency.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ pendencies: rows.map(toPendency) });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { pendencies?: Pendency[] };
  const pendencies = Array.isArray(body.pendencies) ? body.pendencies : [];

  await prisma.$transaction(async (tx) => {
    await tx.pendency.deleteMany({ where: { userId: user.id } });
    if (pendencies.length) {
      await tx.pendency.createMany({
        data: pendencies.map((p) => ({
          id: p.id,
          userId: user.id,
          type: p.type,
          patientName: p.patientName,
          patientId: p.patientId ?? null,
          appointmentId: p.appointmentId,
          status: p.status,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        })),
      });
    }
  });

  return NextResponse.json({ ok: true, count: pendencies.length });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type?: PendencyType;
    patientName?: string;
    patientId?: string;
    appointmentId?: number;
  };

  if (!body.type || !body.patientName || body.appointmentId == null) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const existing = await prisma.pendency.findFirst({
    where: {
      userId: user.id,
      status: "pending",
      type: body.type,
      appointmentId: body.appointmentId,
    },
  });
  if (existing) {
    return NextResponse.json({ pendency: toPendency(existing) });
  }

  const created = await prisma.pendency.create({
    data: {
      userId: user.id,
      type: body.type,
      patientName: body.patientName,
      patientId: body.patientId ?? null,
      appointmentId: body.appointmentId,
      status: "pending",
    },
  });

  return NextResponse.json({ pendency: toPendency(created) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; status?: "pending" | "done" };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const updated = await prisma.pendency.updateMany({
    where: { id: body.id, userId: user.id },
    data: { status: body.status },
  });
  if (!updated.count) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const row = await prisma.pendency.findFirst({
    where: { id: body.id, userId: user.id },
  });
  return NextResponse.json({ pendency: row ? toPendency(row) : null });
}
