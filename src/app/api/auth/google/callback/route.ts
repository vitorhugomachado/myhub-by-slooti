import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  isGoogleConfigured,
} from "@/lib/google";

function safeReturnTo(raw: string | null) {
  if (!raw) return "/auth/callback";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    /* ignore */
  }
  return "/auth/callback";
}

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/login?google=missing", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const returnTo = safeReturnTo(state);

  if (!code) {
    return NextResponse.redirect(new URL("/login?google=denied", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const target = new URL(returnTo, request.url);
    if (returnTo.startsWith("/auth/callback") || returnTo.startsWith("/login")) {
      target.searchParams.set("google", "ok");
    }

    const response = NextResponse.redirect(target);

    response.cookies.set("google_access_token", tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: tokens.expires_in ?? 3600,
    });

    if (tokens.id_token) {
      response.cookies.set("google_id_token", tokens.id_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: tokens.expires_in ?? 3600,
      });
    }

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
    return NextResponse.redirect(new URL("/login?google=error", request.url));
  }
}
