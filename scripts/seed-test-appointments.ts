/**
 * Cria 5 agendamentos/dia em 28–30/07/2026 (nomes reais) para o usuário mais recente.
 * Uso: npx tsx scripts/seed-test-appointments.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_AVATAR = "/avatar-placeholder.svg";

const DATES = ["2026-07-28", "2026-07-29", "2026-07-30"] as const;

const SLOTS = [
  { start: "09:00", end: "09:50" },
  { start: "10:00", end: "10:50" },
  { start: "14:00", end: "14:50" },
  { start: "15:00", end: "15:50" },
  { start: "16:00", end: "16:50" },
] as const;

/** 15 nomes distintos (5 por dia). */
const PATIENTS_BY_DATE: Record<(typeof DATES)[number], string[]> = {
  "2026-07-28": [
    "Mariana Oliveira Santos",
    "Pedro Henrique Almeida",
    "Camila Ferreira Costa",
    "Lucas Gabriel Ribeiro",
    "Beatriz Souza Lima",
  ],
  "2026-07-29": [
    "Rafael Augusto Mendes",
    "Juliana Carla Nogueira",
    "Thiago Barbosa Rocha",
    "Amanda Cristina Vieira",
    "Bruno Eduardo Martins",
  ],
  "2026-07-30": [
    "Larissa Helena Duarte",
    "Felipe Rodrigues Araujo",
    "Gabriela Pinto Carvalho",
    "Diego Matheus Freitas",
    "Isabela Monteiro Campos",
  ],
};

const MODES = ["Online", "Presencial"] as const;
const TYPES = ["Sessão individual", "Retorno", "Primeira consulta"] as const;

async function main() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!user) {
    throw new Error("Nenhum usuário no banco. Faça login/cadastro antes.");
  }

  console.log(`Usuário: ${user.name} <${user.email}> (${user.id})`);

  // Remove só os agendamentos de teste nessas datas (evita duplicar ao re-rodar)
  const deleted = await prisma.appointment.deleteMany({
    where: {
      userId: user.id,
      date: { in: [...DATES] },
    },
  });
  console.log(`Removidos ${deleted.count} agendamento(s) existentes nessas datas.`);

  const rows = DATES.flatMap((date, dayIdx) =>
    PATIENTS_BY_DATE[date].map((patient, i) => {
      const slot = SLOTS[i]!;
      return {
        userId: user.id,
        date,
        start: slot.start,
        end: slot.end,
        patient,
        type: TYPES[(dayIdx + i) % TYPES.length]!,
        mode: MODES[(dayIdx + i) % MODES.length]!,
        status: "upcoming" as const,
        avatar: DEFAULT_AVATAR,
      };
    }),
  );

  await prisma.appointment.createMany({ data: rows });

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Appointment"', 'id'), COALESCE((SELECT MAX(id) FROM "Appointment"), 1))`,
  );

  const created = await prisma.appointment.findMany({
    where: { userId: user.id, date: { in: [...DATES] } },
    orderBy: [{ date: "asc" }, { start: "asc" }],
    select: { id: true, date: true, start: true, patient: true, mode: true },
  });

  console.log(`Criados ${created.length} agendamentos:\n`);
  for (const a of created) {
    console.log(`  ${a.date} ${a.start} — ${a.patient} (${a.mode}) [#${a.id}]`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
