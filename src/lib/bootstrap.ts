import { prisma } from "@/lib/db";
import { seedPatients } from "@/lib/patients";
import { seedFinance } from "@/lib/finance";
import { seedSchedule } from "@/lib/schedule";
import { defaultProfile } from "@/lib/profile";
import { patientWriteData } from "@/lib/mappers";

/** Seeds demo data for a brand-new user account. */
export async function bootstrapUserData(userId: string, name: string, email: string) {
  const existing = await prisma.patient.count({ where: { userId } });
  if (existing > 0) return;

  await prisma.profile.create({
    data: {
      userId,
      data: {
        ...defaultProfile(),
        fullName: name,
        email,
        signatureName: name,
      },
    },
  });

  for (const p of seedPatients) {
    await prisma.patient.create({
      data: {
        id: p.id,
        userId,
        ...patientWriteData(p),
      },
    });
  }

  for (const c of seedFinance) {
    await prisma.financeCharge.create({
      data: {
        id: c.id,
        userId,
        patientId: c.patientId ?? null,
        patientName: c.patientName,
        appointmentId: c.appointmentId ?? null,
        date: c.date,
        description: c.description,
        amount: c.amount,
        method: c.method,
        status: c.status,
        kind: c.kind,
        note: c.note ?? "",
        isPackageLastSession: Boolean(c.isPackageLastSession),
      },
    });
  }

  for (const a of seedSchedule()) {
    await prisma.appointment.create({
      data: {
        id: a.id,
        userId,
        date: a.date,
        start: a.start,
        end: a.end,
        patient: a.patient,
        type: a.type,
        mode: a.mode,
        status: a.status,
        avatar: a.avatar,
      },
    });
  }
}
