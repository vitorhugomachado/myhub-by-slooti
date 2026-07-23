import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toProfile } from "@/lib/mappers";
import { defaultProfile, type PsychologistProfile } from "@/lib/profile";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const row = await prisma.profile.findUnique({ where: { userId: user.id } });
  const profile = row
    ? toProfile(row.data)
    : {
        ...defaultProfile(),
        fullName: user.name,
        email: user.email,
        signatureName: user.name,
      };

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { profile?: PsychologistProfile };
  const profile = body.profile ?? defaultProfile();

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, data: profile },
    update: { data: profile },
  });

  return NextResponse.json({ ok: true, profile });
}
