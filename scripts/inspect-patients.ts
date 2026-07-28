import { prisma } from "../src/lib/db";

async function main() {
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      userId: true,
      fullName: true,
      billingMode: true,
      creditsLeft: true,
      renewalDue: true,
      packageSize: true,
    },
    orderBy: { fullName: "asc" },
  });

  const appointments = await prisma.appointment.findMany({
    select: {
      id: true,
      userId: true,
      patient: true,
      patientId: true,
      date: true,
      start: true,
    },
    orderBy: { id: "asc" },
  });

  console.log("--- Pacientes ---");
  for (const p of patients) {
    const credits = Number(p.creditsLeft || 0);
    const inconsistent =
      p.billingMode === "pacote" && p.renewalDue && credits > 0;
    console.log(
      JSON.stringify({
        name: p.fullName,
        mode: p.billingMode,
        credits: p.creditsLeft,
        renewalDue: p.renewalDue,
        inconsistent,
        id: p.id.slice(0, 8),
      }),
    );
  }

  console.log("\n--- Agendamentos sem patientId ---");
  const missing = appointments.filter((a) => !a.patientId);
  console.log(`total appointments: ${appointments.length}`);
  console.log(`sem patientId: ${missing.length}`);
  for (const a of missing.slice(0, 20)) {
    console.log(`${a.date} ${a.start} · ${a.patient}`);
  }

  console.log("\n--- Match nome→paciente ---");
  let linked = 0;
  let unmatched = 0;
  for (const a of appointments.filter((x) => !x.patientId)) {
    const match = patients.find(
      (p) =>
        p.userId === a.userId &&
        p.fullName.trim().toLowerCase() === a.patient.trim().toLowerCase(),
    );
    if (match) linked++;
    else unmatched++;
  }
  console.log(`podem vincular por nome: ${linked}`);
  console.log(`sem cadastro correspondente: ${unmatched}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
