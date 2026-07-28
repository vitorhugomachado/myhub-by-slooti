import { prisma } from "../src/lib/db";

/**
 * Repara pacientes em pacote com créditos zerados por padrão
 * e vincula agendamentos ao patientId pelo nome.
 */
async function main() {
  const patients = await prisma.patient.findMany();
  let fixedCredits = 0;

  for (const p of patients) {
    if (p.billingMode !== "pacote") continue;

    const credits = Number(p.creditsLeft || 0);
    const size = Number(p.packageSize || 4);
    const packageSize = Number.isFinite(size) && size > 0 ? size : 4;

    // Pacote com 0 crédito e sem marcar renovação de propósito:
    // quase sempre cadastro que nunca inicializou créditos.
    if (credits <= 0 && !p.renewalDue) {
      await prisma.patient.update({
        where: { id: p.id },
        data: {
          creditsLeft: String(packageSize),
          packageSize: String(packageSize),
          renewalDue: false,
        },
      });
      fixedCredits++;
      console.log(`créditos restaurados: ${p.fullName} → ${packageSize}`);
    } else if (credits > 0 && p.renewalDue) {
      await prisma.patient.update({
        where: { id: p.id },
        data: { renewalDue: false },
      });
      console.log(`renewalDue limpo: ${p.fullName} (ainda tem ${credits})`);
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: { OR: [{ patientId: null }, { patientId: "" }] },
  });
  const allPatients = await prisma.patient.findMany({
    select: { id: true, userId: true, fullName: true },
  });

  let linked = 0;
  for (const a of appointments) {
    const match = allPatients.find(
      (p) =>
        p.userId === a.userId &&
        p.fullName.trim().toLowerCase() === a.patient.trim().toLowerCase(),
    );
    if (!match) continue;
    await prisma.appointment.update({
      where: { id: a.id },
      data: { patientId: match.id },
    });
    linked++;
    console.log(`vinculado: ${a.patient} → ${match.id.slice(0, 8)}`);
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(
      pg_get_serial_sequence('"Appointment"', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "Appointment"), 1), 1),
      true
    )`,
  );

  console.log(
    `\nOK: ${fixedCredits} pacotes com créditos restaurados, ${linked} agendamentos vinculados.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
