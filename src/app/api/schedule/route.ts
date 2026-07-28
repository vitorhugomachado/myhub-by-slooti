import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toAppointment } from "@/lib/mappers";
import { addMinutesToTime, SESSION_MINUTES, type ScheduleItem } from "@/lib/schedule";
import { getSessionUser } from "@/lib/session";

type ScheduleWriteItem = ScheduleItem & {
  meetUri?: string;
  meetSpaceName?: string;
  meetMock?: boolean;
};

/** Sequência fica atrás quando IDs foram inseridos manualmente — realinha antes de create. */
async function syncAppointmentIdSequence() {
  await prisma.$executeRawUnsafe(
    `SELECT setval(
      pg_get_serial_sequence('"Appointment"', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "Appointment"), 1), 1),
      true
    )`,
  );
}

function appointmentFields(a: {
  date: string;
  start: string;
  end: string;
  patient: string;
  patientId?: string | null;
  type: string;
  mode: string;
  status: string;
  avatar: string;
  meetUri?: string;
  meetSpaceName?: string;
  meetMock?: boolean;
}) {
  return {
    date: a.date,
    start: a.start,
    end: a.end,
    patient: a.patient,
    patientId: a.patientId?.trim() || null,
    type: a.type || "Sessão",
    mode: a.mode,
    status: a.status || "upcoming",
    avatar: a.avatar || "",
    meetUri: a.meetUri ?? "",
    meetSpaceName: a.meetSpaceName ?? "",
    meetMock: a.meetMock ?? false,
  };
}

async function assertPatientOwned(
  userId: string,
  patientId: string | null | undefined,
): Promise<string | null> {
  const id = patientId?.trim();
  if (!id) return null;
  const owned = await prisma.patient.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) return "Paciente inválido no agendamento.";
  return null;
}

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

/** Cria uma sessão (ID gerado pelo banco). */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      date?: string;
      start?: string;
      end?: string;
      patient?: string;
      patientId?: string;
      avatar?: string;
      type?: string;
      mode?: string;
    };

    if (!body.date || !body.start || !body.patient?.trim()) {
      return NextResponse.json(
        { error: "Data, horário e paciente são obrigatórios." },
        { status: 400 },
      );
    }

    const patientError = await assertPatientOwned(user.id, body.patientId);
    if (patientError) {
      return NextResponse.json({ error: patientError }, { status: 400 });
    }

    const end =
      body.end?.trim() || addMinutesToTime(body.start, SESSION_MINUTES);

    const conflict = await prisma.appointment.findFirst({
      where: {
        userId: user.id,
        date: body.date,
        status: { not: "cancelled" },
        start: { lt: end },
        end: { gt: body.start },
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Já existe uma sessão neste horário." },
        { status: 409 },
      );
    }

    await syncAppointmentIdSequence();

    const row = await prisma.appointment.create({
      data: {
        userId: user.id,
        ...appointmentFields({
          date: body.date,
          start: body.start,
          end,
          patient: body.patient.trim(),
          patientId: body.patientId,
          type: body.type?.trim() || "Sessão",
          mode: body.mode || "Online",
          status: "upcoming",
          avatar: body.avatar || "",
        }),
      },
    });

    return NextResponse.json({ item: toAppointment(row) });
  } catch (error) {
    console.error("[api/schedule] POST failed", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a agenda." },
      { status: 500 },
    );
  }
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

    const keepIds = items
      .map((a) => a.id)
      .filter((id) => Number.isFinite(id) && id > 0 && ownedById.has(id));

    const toCreate = items.filter((a) => !ownedById.has(a.id) || a.id <= 0);
    if (toCreate.length) {
      await syncAppointmentIdSequence();
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: {
          userId: user.id,
          ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
        },
      });

      for (const a of items) {
        const prev = a.id > 0 ? ownedById.get(a.id) : undefined;
        const data = appointmentFields({
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
        });

        if (prev) {
          await tx.appointment.update({
            where: { id: a.id },
            data,
          });
        } else {
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
