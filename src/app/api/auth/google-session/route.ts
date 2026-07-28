import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { bootstrapUserData } from "@/lib/bootstrap";
import { prisma } from "@/lib/db";
import {
  getGoogleUserInfo,
  isGoogleConfigured,
  verifyGoogleIdToken,
  type GoogleUserInfo,
} from "@/lib/google";
import { createSession, toPublicUser } from "@/lib/session";

/**
 * Cria sessão do app a partir de prova Google no servidor
 * (id_token verificado ou access_token httpOnly) — nunca confia em e-mail do client.
 */
export async function POST() {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: "Google OAuth não está configurado." },
        { status: 503 },
      );
    }

    const jar = await cookies();
    const idToken = jar.get("google_id_token")?.value;
    const accessToken = jar.get("google_access_token")?.value;

    let profile: GoogleUserInfo | null = null;

    if (idToken) {
      try {
        profile = await verifyGoogleIdToken(idToken);
      } catch {
        profile = null;
      }
    }

    if (!profile && accessToken) {
      try {
        profile = await getGoogleUserInfo(accessToken);
      } catch {
        profile = null;
      }
    }

    if (!profile?.email) {
      return NextResponse.json(
        {
          error:
            "Não foi possível validar sua identidade Google. Faça login novamente.",
        },
        { status: 401 },
      );
    }

    const email = profile.email.trim().toLowerCase();
    const name =
      profile.name?.trim() || email.split("@")[0] || "Profissional";

    let user = await prisma.user.findUnique({ where: { email } });
    let isNew = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: "",
          provider: "google",
          plan: "",
          paymentGateway: "",
        },
      });
      isNew = true;
    } else if ((!user.name || user.name === email.split("@")[0]) && name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    if (isNew) {
      await bootstrapUserData(user.id, user.name, user.email);
    }

    await createSession(user.id);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao entrar com Google." },
      { status: 500 },
    );
  }
}
