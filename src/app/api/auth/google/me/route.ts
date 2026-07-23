import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getGoogleUserInfo, isGoogleConfigured } from "@/lib/google";

export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "google_not_configured" },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("google_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "google_not_connected" },
      { status: 401 },
    );
  }

  try {
    const user = await getGoogleUserInfo(accessToken);
    return NextResponse.json({
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  } catch {
    return NextResponse.json({ error: "google_userinfo_failed" }, { status: 502 });
  }
}
