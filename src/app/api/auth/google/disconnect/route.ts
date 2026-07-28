import { NextResponse } from "next/server";

/** Remove cookies OAuth do Google para forçar novo consentimento. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of [
    "google_access_token",
    "google_id_token",
    "google_refresh_token",
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
