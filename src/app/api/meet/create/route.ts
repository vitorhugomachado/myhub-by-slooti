import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createMeetSpace,
  isGoogleConfigured,
  refreshAccessToken,
} from "@/lib/google";
import {
  createMockMeetUri,
  getStoredMeetLink,
  setStoredMeetLink,
} from "@/lib/meet-store";
import { getAppointmentById } from "@/lib/mock-data";

export async function POST(request: Request) {
  const body = (await request.json()) as { appointmentId?: number };
  const appointmentId = body.appointmentId;

  if (!appointmentId || !getAppointmentById(appointmentId)) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  }

  const existing = getStoredMeetLink(appointmentId);
  if (existing) {
    return NextResponse.json(existing);
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("google_access_token")?.value;
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  // Sem credenciais Google: gera link mock para testar a UX
  if (!isGoogleConfigured()) {
    const data = setStoredMeetLink(appointmentId, {
      meetingUri: createMockMeetUri(),
      mock: true,
    });
    return NextResponse.json(data);
  }

  // Credenciais existem, mas psicólogo ainda não conectou o Google
  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      {
        error: "google_not_connected",
        message: "Conecte sua conta Google para gerar o link do Meet.",
      },
      { status: 401 },
    );
  }

  try {
    if (!accessToken && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
    }

    const space = await createMeetSpace(accessToken!);
    const data = setStoredMeetLink(appointmentId, {
      meetingUri: space.meetingUri,
      spaceName: space.name,
      mock: false,
    });

    const response = NextResponse.json(data);
    if (accessToken) {
      response.cookies.set("google_access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3600,
      });
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar reunião Meet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = Number(searchParams.get("appointmentId"));

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId obrigatório" }, { status: 400 });
  }

  return NextResponse.json({
    link: getStoredMeetLink(appointmentId),
    configured: isGoogleConfigured(),
  });
}
