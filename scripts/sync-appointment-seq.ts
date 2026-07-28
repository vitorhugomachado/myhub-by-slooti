import { prisma } from "../src/lib/db";

async function main() {
  await prisma.$executeRawUnsafe(
    `SELECT setval(
      pg_get_serial_sequence('"Appointment"', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "Appointment"), 1), 1),
      true
    )`,
  );
  const max = await prisma.$queryRawUnsafe<Array<{ max: number | null }>>(
    `SELECT MAX(id)::int AS max FROM "Appointment"`,
  );
  console.log("Appointment max id:", max[0]?.max ?? 0);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
