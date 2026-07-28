"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PENDENCIES_EVENT,
  savePendencies,
  type Pendency,
  type PendencyType,
} from "@/lib/pendencies";

async function fetchPendencies(): Promise<Pendency[]> {
  const res = await fetch("/api/pendencies", { credentials: "include" });
  if (!res.ok) throw new Error("pendencies_fetch_failed");
  const data = (await res.json()) as { pendencies: Pendency[] };
  savePendencies(data.pendencies, { silent: true });
  return data.pendencies;
}

async function persistPendencies(pendencies: Pendency[]) {
  savePendencies(pendencies);
  const res = await fetch("/api/pendencies", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pendencies }),
  });
  if (!res.ok) throw new Error("pendencies_persist_failed");
}

export function usePendencies() {
  const [pendencies, setPendencies] = useState<Pendency[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const next = await fetchPendencies();
        if (!cancelled) setPendencies(next);
      } catch {
        /* keep empty until auth */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void sync();
    const onEvent = () => void sync();
    window.addEventListener(PENDENCIES_EVENT, onEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(PENDENCIES_EVENT, onEvent);
    };
  }, []);

  const addPendency = useCallback(
    async (input: {
      type: PendencyType;
      patientName: string;
      patientId?: string;
      appointmentId: number;
    }) => {
      const res = await fetch("/api/pendencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("pendency_create_failed");
      const data = (await res.json()) as { pendency: Pendency };
      setPendencies((prev) => {
        const exists = prev.some((p) => p.id === data.pendency.id);
        const next = exists
          ? prev.map((p) => (p.id === data.pendency.id ? data.pendency : p))
          : [data.pendency, ...prev];
        savePendencies(next, { silent: true });
        return next;
      });
      window.dispatchEvent(new Event(PENDENCIES_EVENT));
      return data.pendency;
    },
    [],
  );

  const markDone = useCallback(async (id: string) => {
    const res = await fetch("/api/pendencies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status: "done" }),
    });
    if (!res.ok) throw new Error("pendency_update_failed");
    setPendencies((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, status: "done" as const } : p,
      );
      savePendencies(next, { silent: true });
      return next;
    });
    window.dispatchEvent(new Event(PENDENCIES_EVENT));
  }, []);

  const setAll = useCallback(async (next: Pendency[]) => {
    setPendencies(next);
    await persistPendencies(next);
  }, []);

  const pending = pendencies.filter((p) => p.status === "pending");

  return {
    pendencies,
    pending,
    hydrated,
    addPendency,
    markDone,
    setAll,
  };
}
