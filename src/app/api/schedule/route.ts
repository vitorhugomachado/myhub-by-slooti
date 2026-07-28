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

  try {
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
    const ownedById = new Map(previous.map((a) => [a.id, a]));

    // Só preserva IDs que já existem nesta conta (evita colisão global de serial)
    const keepIds = items
      .map((a) => a.id)
      .filter((id) => Number.isFinite(id) && id > 0 && ownedById.has(id));

    await prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: {
          userId: user.id,
          ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (const a of items) {
        const prev = ownedById.get(a.id);
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

        if (prev) {
          await tx.appointment.update({
            where: { id: a.id },
            data,
          });
        } else {
          // ID gerado pelo Postgres — não reutilizar id do cliente
          await tx.appointment.create({
            data: {
              userId: user.id,
              ...data,
            },
          });
        }
      }
    });

    const rows = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: [{ date: "asc" }, { start: "asc" }],
    });

    return NextResponse.json({
      ok: true,
      count: rows.length,
      items: rows.map(toAppointment),
    });
  } catch (error) {
    console.error("[api/schedule] PUT failed", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a agenda." },
      { status: 500 },
    );
  }
}
