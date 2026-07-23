import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toAppointment } from "@/lib/mappers";
import type { ScheduleItem } from "@/lib/schedule";
import { getSessionUser } from "@/lib/session";

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

  const body = (await request.json()) as { items?: ScheduleItem[] };
  const items = Array.isArray(body.items) ? body.items : [];

  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({ where: { userId: user.id } });
    if (items.length) {
      await tx.appointment.createMany({
        data: items.map((a) => ({
          id: a.id,
          userId: user.id,
          date: a.date,
          start: a.start,
          end: a.end,
          patient: a.patient,
          type: a.type,
          mode: a.mode,
          status: a.status,
          avatar: a.avatar,
        })),
      });
    }
  });

  // Keep serial in sync after explicit IDs
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Appointment"', 'id'), COALESCE((SELECT MAX(id) FROM "Appointment"), 1))`,
  );

  return NextResponse.json({ ok: true, count: items.length });
}
