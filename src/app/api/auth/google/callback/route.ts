import { NextResponse } from "next/server";
import { exchangeCodeForTokens, isGoogleConfigured } from "@/lib/google";

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/?google=missing", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const returnTo = state ? decodeURIComponent(state) : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/?google=denied", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    response.cookies.set("google_access_token", tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: tokens.expires_in ?? 3600,
    });

    if (tokens.refresh_token) {
      response.cookies.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
}
