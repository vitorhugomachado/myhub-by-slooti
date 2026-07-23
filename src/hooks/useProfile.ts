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
  await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ profile }),
  });
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

  const update = useCallback((next: PsychologistProfile) => {
    setProfile(next);
    void persistProfile(next);
  }, []);

  return { profile, hydrated, update };
}
