import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toAppointment } from "@/lib/mappers";
import type { ScheduleItem } from "@/lib/schedule";
import { getSessionUser } from "@/lib/session";

type ScheduleWriteItem = ScheduleItem & {
  meetUri?: string;
  meetSpaceName?: string;
  meetMock?: boolean;
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.appointment.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "asc" }, { start: "asc" }],
  });
  return NextResponse.json({ items: rows.map(toAppointment) });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { items?: ScheduleWriteItem[] };
  const items = Array.isArray(body.items) ? body.items : [];

  const patientIds = [
    ...new Set(
      items
        .map((a) => a.patientId?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (patientIds.length) {
    const owned = await prisma.patient.findMany({
      where: { userId: user.id, id: { in: patientIds } },
      select: { id: true },
    });
    if (owned.length !== patientIds.length) {
      return NextResponse.json(
        { error: "Paciente inválido no agendamento." },
        { status: 400 },
      );
    }
  }

  const previous = await prisma.appointment.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      meetUri: true,
      meetSpaceName: true,
      meetMock: true,
      patientId: true,
    },
  });
  const meetById = new Map(previous.map((a) => [a.id, a]));
  const incomingIds = items
    .map((a) => a.id)
    .filter((id) => Number.isFinite(id) && id > 0);

  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({
      where: {
        userId: user.id,
        ...(incomingIds.length
          ? { id: { notIn: incomingIds } }
          : {}),
      },
    });

    for (const a of items) {
      const prev = meetById.get(a.id);
      const data = {
        date: a.date,
        start: a.start,
        end: a.end,
        patient: a.patient,
        patientId: a.patientId?.trim() || prev?.patientId || null,
        type: a.type,
        mode: a.mode,
        status: a.status,
        avatar: a.avatar,
        meetUri: a.meetUri ?? prev?.meetUri ?? "",
        meetSpaceName: a.meetSpaceName ?? prev?.meetSpaceName ?? "",
        meetMock: a.meetMock ?? prev?.meetMock ?? false,
      };

      if (Number.isFinite(a.id) && a.id > 0 && meetById.has(a.id)) {
        await tx.appointment.update({
          where: { id: a.id },
          data,
        });
      } else {
        await tx.appointment.create({
          data: {
            ...(Number.isFinite(a.id) && a.id > 0 ? { id: a.id } : {}),
            userId: user.id,
            ...data,
          },
        });
      }
    }
  });

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Appointment"', 'id'), COALESCE((SELECT MAX(id) FROM "Appointment"), 1))`,
  );

  return NextResponse.json({ ok: true, count: items.length });
}
