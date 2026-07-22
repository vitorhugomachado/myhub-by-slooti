import { NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/google";

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth não configurado. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no .env.local",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") ?? "/";
  const url = getGoogleAuthUrl(encodeURIComponent(returnTo));

  return NextResponse.redirect(url);
}
