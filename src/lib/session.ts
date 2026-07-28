import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "myhub_session";

const DEV_SESSION_FALLBACK = "myhub-dev-secret-change-me";
const SCRYPT_PREFIX = "scrypt$";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  provider: string;
  plan: string;
  paymentGateway: string;
};

function sessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    const weak =
      !secret ||
      secret === DEV_SESSION_FALLBACK ||
      secret === "change-me-in-production" ||
      secret.length < 24;
    if (weak) {
      throw new Error(
        "SESSION_SECRET deve ser forte em produção (mín. 24 chars aleatórios; recomendado 32+).",
      );
    }
    return secret;
  }
  return secret || DEV_SESSION_FALLBACK;
}

function passwordPepper() {
  // Pepper dedicado; cai no SESSION_SECRET para hashes legados já gravados.
  return (
    process.env.PASSWORD_PEPPER?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    DEV_SESSION_FALLBACK
  );
}

function legacyHashPassword(password: string) {
  return createHash("sha256")
    .update(`${passwordPepper()}:${password}`)
    .digest("hex");
}

/** Hash de senha com scrypt (novo). Mantém compatibilidade com SHA256 legado. */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${SCRYPT_PREFIX}${salt}$${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  if (!passwordHash) return false;

  if (passwordHash.startsWith(SCRYPT_PREFIX)) {
    const parts = passwordHash.split("$");
    const salt = parts[1];
    const expected = parts[2];
    if (!salt || !expected) return false;
    const next = scryptSync(password, salt, 64);
    const a = Buffer.from(expected, "hex");
    if (a.length !== next.length) return false;
    return timingSafeEqual(a, next);
  }

  // Legado SHA256 (usuários criados antes do upgrade)
  const legacy = legacyHashPassword(password);
  const a = Buffer.from(legacy);
  const b = Buffer.from(passwordHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True se o hash ainda é o formato antigo e deve ser regravado no login. */
export function needsPasswordRehash(passwordHash: string) {
  return Boolean(passwordHash) && !passwordHash.startsWith(SCRYPT_PREFIX);
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
