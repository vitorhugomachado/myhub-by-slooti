import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toReport } from "@/lib/mappers";
import type { SessionReport } from "@/lib/session-reports";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientName = searchParams.get("patient");
  const appointmentId = searchParams.get("appointmentId");

  const rows = await prisma.sessionReport.findMany({
    where: {
      userId: user.id,
      ...(patientName
        ? { patientName: { equals: patientName, mode: "insensitive" } }
        : {}),
      ...(appointmentId
        ? { appointmentId: Number(appointmentId) }
        : {}),
    },
    orderBy: [{ date: "desc" }, { start: "desc" }],
  });

  return NextResponse.json({ reports: rows.map(toReport) });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { reports?: SessionReport[] };
  const reports = Array.isArray(body.reports) ? body.reports : [];

  await prisma.$transaction(async (tx) => {
    await tx.sessionReport.deleteMany({ where: { userId: user.id } });
    if (reports.length) {
      await tx.sessionReport.createMany({
        data: reports.map((r) => ({
          id: r.id,
          userId: user.id,
          appointmentId: r.appointmentId || null,
          patientName: r.patientName,
          date: r.date,
          start: r.start,
          end: r.end ?? "",
          summary: r.summary ?? "",
          evolution: r.evolution ?? "",
          nextSteps: r.nextSteps ?? "",
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        })),
      });
    }
  });

  return NextResponse.json({ ok: true, count: reports.length });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SessionReport> & {
    patientName?: string;
    date?: string;
  };

  if (!body.patientName || !body.date) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const appointmentId = body.appointmentId ?? 0;
  const existing =
    appointmentId > 0
      ? await prisma.sessionReport.findFirst({
          where: { userId: user.id, appointmentId },
        })
      : body.id
        ? await prisma.sessionReport.findFirst({
            where: { id: body.id, userId: user.id },
          })
        : null;

  const data = {
    appointmentId: appointmentId || null,
    patientName: body.patientName,
    date: body.date,
    start: body.start ?? "",
    end: body.end ?? "",
    summary: body.summary ?? "",
    evolution: body.evolution ?? "",
    nextSteps: body.nextSteps ?? "",
  };

  const row = existing
    ? await prisma.sessionReport.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.sessionReport.create({
        data: {
          ...(body.id ? { id: body.id } : {}),
          userId: user.id,
          ...data,
        },
      });

  return NextResponse.json({ report: toReport(row) }, { status: existing ? 200 : 201 });
}
