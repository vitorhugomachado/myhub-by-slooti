import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/session";

export async function requireApiUser(): Promise<
  SessionUser | NextResponse
> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return user;
}

export function isApiUser(
  value: SessionUser | NextResponse,
): value is SessionUser {
  return !(value instanceof NextResponse) && "id" in value;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
