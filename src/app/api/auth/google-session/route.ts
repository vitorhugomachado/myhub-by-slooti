import { NextResponse } from "next/server";
import { bootstrapUserData } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      picture?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";
    const name = body.name?.trim() || email.split("@")[0] || "Profissional";

    if (!email) {
      return NextResponse.json(
        { error: "Não foi possível obter o e-mail do Google." },
        { status: 400 },
      );
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isNew = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: "",
          provider: "google",
        },
      });
      isNew = true;
    } else if (!user.name && name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    if (isNew) {
      await bootstrapUserData(user.id, user.name, user.email);
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao entrar com Google." },
      { status: 500 },
    );
  }
}
