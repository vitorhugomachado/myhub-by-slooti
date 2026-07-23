import { NextResponse } from "next/server";
import { bootstrapUserData } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import {
  createSession,
  hashPassword,
  toPublicUser,
} from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!name) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        provider: "email",
        plan: "",
        paymentGateway: "",
      },
    });

    await bootstrapUserData(user.id, user.name, user.email);
    await createSession(user.id);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao criar conta." }, { status: 500 });
  }
}
