import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createMeetSpace,
  isGoogleConfigured,
  refreshAccessToken,
} from "@/lib/google";
import { createMockMeetUri, type MeetLinkData } from "@/lib/meet-store";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

function toMeetLink(row: {
  meetUri: string;
  meetSpaceName: string;
  meetMock: boolean;
}): MeetLinkData | null {
  if (!row.meetUri) return null;
  return {
    meetingUri: row.meetUri,
    spaceName: row.meetSpaceName || undefined,
    mock: row.meetMock,
  };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { appointmentId?: number };
  const appointmentId = body.appointmentId;

  if (!appointmentId) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  }

  const existing = toMeetLink(appointment);
  if (existing) {
    return NextResponse.json(existing);
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("google_access_token")?.value;
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  if (!isGoogleConfigured()) {
    const meetingUri = createMockMeetUri();
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        meetUri: meetingUri,
        meetSpaceName: "",
        meetMock: true,
      },
    });
    return NextResponse.json(toMeetLink(updated));
  }

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
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        meetUri: space.meetingUri,
        meetSpaceName: space.name ?? "",
        meetMock: false,
      },
    });

    const response = NextResponse.json(toMeetLink(updated));
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
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appointmentId = Number(searchParams.get("appointmentId"));

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId obrigatório" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  });

  return NextResponse.json({
    link: appointment ? toMeetLink(appointment) : null,
    configured: isGoogleConfigured(),
  });
}
