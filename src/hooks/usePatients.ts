"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PATIENTS_EVENT,
  savePatients,
  seedPatients,
  type Patient,
} from "@/lib/patients";

async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch("/api/patients", { credentials: "include" });
  if (!res.ok) throw new Error("patients_fetch_failed");
  const data = (await res.json()) as { patients: Patient[] };
  savePatients(data.patients);
  return data.patients;
}

async function persistPatients(patients: Patient[]) {
  await fetch("/api/patients", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ patients }),
  });
  window.dispatchEvent(new Event(PATIENTS_EVENT));
}

export function usePatients() {
  const [patients, setPatientsState] = useState<Patient[]>(seedPatients);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const next = await fetchPatients();
        if (!cancelled) setPatientsState(next);
      } catch {
        /* keep seed until auth ready */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void sync();
    window.addEventListener(PATIENTS_EVENT, () => void sync());
    return () => {
      cancelled = true;
    };
  }, []);

  const setPatients = useCallback(
    (updater: Patient[] | ((prev: Patient[]) => Patient[])) => {
      setPatientsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        void persistPatients(next);
        return next;
      });
    },
    [],
  );

  const findById = useCallback(
    (id: string) => patients.find((p) => p.id === id) ?? null,
    [patients],
  );

  const findByName = useCallback(
    (name: string) =>
      patients.find(
        (p) => p.fullName.toLowerCase() === name.trim().toLowerCase(),
      ) ?? null,
    [patients],
  );

  return {
    patients,
    setPatients,
    hydrated,
    findById,
    findByName,
  };
}
