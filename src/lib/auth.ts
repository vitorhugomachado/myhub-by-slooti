import { postAuthPath } from "@/lib/plans";

export { postAuthPath };

export const AUTH_EVENT = "myhub:auth";

export type AuthProvider = "email" | "google";

export type AuthSessionUser = {
  id: string;
  email: string;
  name: string;
  provider: AuthProvider | string;
  plan: string;
  paymentGateway: string;
};

export type AuthResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; error: string };

let cachedUser: AuthSessionUser | null | undefined;

export function getCachedUser() {
  return cachedUser ?? null;
}

export function setCachedUser(user: AuthSessionUser | null) {
  cachedUser = user;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export async function fetchSessionUser(): Promise<AuthSessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      cachedUser = null;
      return null;
    }
    const data = (await res.json()) as { user: AuthSessionUser | null };
    cachedUser = data.user;
    return data.user;
  } catch {
    cachedUser = null;
    return null;
  }
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return cachedUser != null;
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Falha ao criar conta." };
  }
  setCachedUser(data.user);
  return { ok: true, user: data.user };
}

export async function loginWithEmail(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Falha ao entrar." };
  }
  setCachedUser(data.user);
  return { ok: true, user: data.user };
}

export async function loginWithGoogle(input: {
  email: string;
  name: string;
  picture?: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/google-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Falha ao entrar com Google." };
  }
  setCachedUser(data.user);
  return { ok: true, user: data.user };
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    setCachedUser(null);
  }
}

export async function choosePlan(input: {
  plan: "free" | "pro";
  paymentGateway?: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/plan", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Falha ao salvar o plano." };
  }
  setCachedUser(data.user);
  return { ok: true, user: data.user };
}
