/**
 * Cache local namespaced por usuário + limpeza no logout.
 * Evita vazamento de dados entre contas no mesmo navegador.
 */

import { getCachedUser } from "@/lib/auth";

export const USER_STORAGE_PREFIXES = [
  "myhub_patients_v1",
  "myhub_finance_v3",
  "myhub_finance_v2",
  "myhub_schedule_v1",
  "myhub_pendencies_v1",
  "myhub_session_reports_v1",
  "myhub_profile_v1",
  "myhub_meet_links_v1",
  "myhub_session_phase_v1",
] as const;

/** Chave localStorage scoped ao usuário logado. */
export function userStorageKey(base: string): string {
  const id = getCachedUser()?.id;
  if (!id) return `${base}:anon`;
  return `${base}:${id}`;
}

export function readUserStorage(base: string): string | null {
  if (typeof window === "undefined") return null;
  const scoped = localStorage.getItem(userStorageKey(base));
  if (scoped != null) return scoped;
  // Migração one-shot da chave legada (sem userId) para a conta atual
  const legacy = localStorage.getItem(base);
  if (legacy != null && getCachedUser()?.id) {
    localStorage.setItem(userStorageKey(base), legacy);
    localStorage.removeItem(base);
    return legacy;
  }
  return null;
}

export function writeUserStorage(base: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(userStorageKey(base), value);
}

export function removeUserStorage(base: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(userStorageKey(base));
}

/** Remove todos os caches myhub_* (logout / troca de conta). */
export function clearLocalUserData() {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith("myhub_")) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key);
  }
}
