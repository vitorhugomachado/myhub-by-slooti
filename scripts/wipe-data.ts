import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessionReports = await prisma.sessionReport.deleteMany({});
  const pendencies = await prisma.pendency.deleteMany({});
  const finance = await prisma.financeCharge.deleteMany({});
  const appointments = await prisma.appointment.deleteMany({});
  const patients = await prisma.patient.deleteMany({});
  const profiles = await prisma.profile.deleteMany({});
  const users = await prisma.user.deleteMany({});

  console.log(
    JSON.stringify(
      {
        sessionReports: sessionReports.count,
        pendencies: pendencies.count,
        finance: finance.count,
        appointments: appointments.count,
        patients: patients.count,
        profiles: profiles.count,
        users: users.count,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
