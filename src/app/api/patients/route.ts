import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { patientWriteData, toPatient } from "@/lib/mappers";
import type { Patient } from "@/lib/patients";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.patient.findMany({
    where: { userId: user.id },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ patients: rows.map(toPatient) });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { patients?: Patient[] };
  const patients = Array.isArray(body.patients) ? body.patients : [];

  await prisma.$transaction(async (tx) => {
    await tx.patient.deleteMany({ where: { userId: user.id } });
    if (patients.length) {
      await tx.patient.createMany({
        data: patients.map((p) => ({
          id: p.id,
          userId: user.id,
          ...patientWriteData(p),
        })),
      });
    }
  });

  return NextResponse.json({ ok: true, count: patients.length });
}
