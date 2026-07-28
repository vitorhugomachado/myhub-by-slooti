import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/lib/google";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("google_access_token")?.value;
  const refresh = cookieStore.get("google_refresh_token")?.value;
  const connected = Boolean(access || refresh);

  return NextResponse.json({
    configured: isGoogleConfigured(),
    connected,
  });
}
