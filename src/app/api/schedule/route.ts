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

  const body = (await request.json()) as {
    items?: Array<
      ScheduleItem & {
        meetUri?: string;
        meetSpaceName?: string;
        meetMock?: boolean;
      }
    >;
  };
  const items = Array.isArray(body.items) ? body.items : [];

  const previous = await prisma.appointment.findMany({
    where: { userId: user.id },
    select: { id: true, meetUri: true, meetSpaceName: true, meetMock: true },
  });
  const meetById = new Map(previous.map((a) => [a.id, a]));

  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({ where: { userId: user.id } });
    if (items.length) {
      await tx.appointment.createMany({
        data: items.map((a) => {
          const prev = meetById.get(a.id);
          return {
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
            meetUri: a.meetUri ?? prev?.meetUri ?? "",
            meetSpaceName: a.meetSpaceName ?? prev?.meetSpaceName ?? "",
            meetMock: a.meetMock ?? prev?.meetMock ?? false,
          };
        }),
      });
    }
  });

  // Keep serial in sync after explicit IDs
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Appointment"', 'id'), COALESCE((SELECT MAX(id) FROM "Appointment"), 1))`,
  );

  return NextResponse.json({ ok: true, count: items.length });
}
