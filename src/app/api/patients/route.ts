import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { patientWriteData, toPatient } from "@/lib/mappers";
import {
  toPatientFormData,
  validatePatientFields,
} from "@/lib/patient-validation";
import type { Patient } from "@/lib/patients";
import { FREE_PATIENT_LIMIT, maxPatientsForPlan } from "@/lib/plans";
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
  return NextResponse.json({
    patients: rows.map(toPatient),
    plan: user.plan,
    limit: maxPatientsForPlan(user.plan),
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { patients?: Patient[] };
  const patients = Array.isArray(body.patients) ? body.patients : [];
  const limit = maxPatientsForPlan(user.plan);

  if (patients.length > limit) {
    return NextResponse.json(
      {
        error: `Plano gratuito permite no máximo ${FREE_PATIENT_LIMIT} pacientes. Faça upgrade para o Pro.`,
        limit: FREE_PATIENT_LIMIT,
      },
      { status: 403 },
    );
  }

  for (const patient of patients) {
    if (!patient?.id || !patient.fullName?.trim()) {
      return NextResponse.json(
        { error: "Paciente inválido: id e nome são obrigatórios." },
        { status: 400 },
      );
    }

    const result = validatePatientFields(toPatientFormData(patient));
    if (!result.ok) {
      const firstError =
        Object.values(result.errors).find(Boolean) ||
        "Dados do paciente inválidos.";
      return NextResponse.json(
        {
          error: `${patient.fullName || "Paciente"}: ${firstError}`,
          errors: result.errors,
          patientId: patient.id,
        },
        { status: 400 },
      );
    }
  }

  try {
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
  } catch (error) {
    console.error("[api/patients] PUT failed", error);
    return NextResponse.json(
      { error: "Não foi possível salvar os pacientes no banco." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, count: patients.length });
}
