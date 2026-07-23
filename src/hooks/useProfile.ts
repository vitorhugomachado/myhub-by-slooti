"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultProfile,
  PROFILE_EVENT,
  type PsychologistProfile,
} from "@/lib/profile";

async function fetchProfile(): Promise<PsychologistProfile> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) throw new Error("profile_fetch_failed");
  const data = (await res.json()) as { profile: PsychologistProfile };
  return data.profile;
}

async function persistProfile(profile: PsychologistProfile) {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) {
    throw new Error("Falha ao salvar o perfil no servidor.");
  }
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function useProfile() {
  const [profile, setProfile] = useState<PsychologistProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const next = await fetchProfile();
        if (!cancelled) setProfile(next);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void sync();
    window.addEventListener(PROFILE_EVENT, () => void sync());
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (next: PsychologistProfile) => {
    setProfile(next);
    await persistProfile(next);
  }, []);

  return { profile, hydrated, update };
}
