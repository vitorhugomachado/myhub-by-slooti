import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/lib/google";

export async function GET() {
  const cookieStore = await cookies();
  const connected = Boolean(cookieStore.get("google_access_token")?.value);

  return NextResponse.json({
    configured: isGoogleConfigured(),
    connected,
  });
}
