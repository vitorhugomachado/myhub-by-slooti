import { prisma } from "@/lib/db";
import { defaultProfile } from "@/lib/profile";

/** Creates an empty profile for a brand-new user (no demo data). */
export async function bootstrapUserData(
  userId: string,
  name: string,
  email: string,
) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) return;

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
}
