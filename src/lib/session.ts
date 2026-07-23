import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "myhub_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  provider: string;
  plan: string;
  paymentGateway: string;
};

function sessionSecret() {
  return process.env.SESSION_SECRET || "myhub-dev-secret-change-me";
}

export function hashPassword(password: string) {
  return createHash("sha256")
    .update(`${sessionSecret()}:${password}`)
    .digest("hex");
}

export function verifyPassword(password: string, passwordHash: string) {
  const next = hashPassword(password);
  const a = Buffer.from(next);
  const b = Buffer.from(passwordHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(value: string) {
  const sig = createHash("sha256")
    .update(`${value}.${sessionSecret()}`)
    .digest("hex")
    .slice(0, 32);
  return `${value}.${sig}`;
}

function unsign(signed: string) {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHash("sha256")
    .update(`${value}.${sessionSecret()}`)
    .digest("hex")
    .slice(0, 32);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const token = sign(`${userId}.${randomBytes(8).toString("hex")}`);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  provider: string;
  plan: string;
  paymentGateway: string;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    plan: user.plan,
    paymentGateway: user.paymentGateway,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const value = unsign(raw);
  if (!value) return null;
  const userId = value.split(".")[0];
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return toPublicUser(user);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
