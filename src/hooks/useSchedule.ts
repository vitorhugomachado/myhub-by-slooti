"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DatedAppointment } from "@/lib/agenda";
import {
  activeAppointments,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  saveSchedule,
  SCHEDULE_EVENT,
  type AddAppointmentInput,
} from "@/lib/schedule";

async function fetchSchedule(): Promise<DatedAppointment[]> {
  const res = await fetch("/api/schedule", { credentials: "include" });
  if (!res.ok) throw new Error("schedule_fetch_failed");
  const data = (await res.json()) as { items: DatedAppointment[] };
  saveSchedule(data.items, { silent: true });
  return data.items;
}

async function persistSchedule(items: DatedAppointment[]) {
  const res = await fetch("/api/schedule", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    items?: DatedAppointment[];
  } | null;
  if (!res.ok) {
    throw new Error(data?.error || "Falha ao salvar a agenda.");
  }
  if (Array.isArray(data?.items)) {
    saveSchedule(data.items, { silent: true });
    window.dispatchEvent(new Event(SCHEDULE_EVENT));
    return data.items;
  }
  window.dispatchEvent(new Event(SCHEDULE_EVENT));
  return items;
}

async function createAppointment(input: AddAppointmentInput) {
  const res = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    item?: DatedAppointment;
  } | null;
  if (!res.ok || !data?.item) {
    throw new Error(data?.error || "Falha ao salvar a agenda.");
  }
  return data.item;
}

export function useSchedule() {
  const [items, setItems] = useState<DatedAppointment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const next = await fetchSchedule();
        if (!cancelled) setItems(next);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void sync();
    const onEvent = () => void sync();
    window.addEventListener(SCHEDULE_EVENT, onEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_EVENT, onEvent);
    };
  }, []);

  const cancel = useCallback((id: number) => {
    setItems((prev) => {
      const next = cancelAppointment(prev, id);
      void persistSchedule(next)
        .then((saved) => setItems(saved))
        .catch(() => setItems(prev));
      return next;
    });
  }, []);

  const complete = useCallback((id: number) => {
    setItems((prev) => {
      const next = completeAppointment(prev, id);
      void persistSchedule(next)
        .then((saved) => setItems(saved))
        .catch(() => setItems(prev));
      return next;
    });
  }, []);

  const reschedule = useCallback(
    (id: number, patch: { date: string; start: string; end?: string }) => {
      setItems((prev) => {
        const next = rescheduleAppointment(prev, id, patch);
        void persistSchedule(next)
          .then((saved) => setItems(saved))
          .catch(() => setItems(prev));
        return next;
      });
    },
    [],
  );

  const add = useCallback(async (input: AddAppointmentInput) => {
    const created = await createAppointment(input);
    setItems((prev) => {
      const withoutDup = prev.filter(
        (a) =>
          !(
            a.date === created.date &&
            a.start === created.start &&
            a.patient === created.patient
          ),
      );
      const next = [...withoutDup, created].sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return a.start.localeCompare(b.start);
      });
      saveSchedule(next, { silent: true });
      return next;
    });
    window.dispatchEvent(new Event(SCHEDULE_EVENT));
    return created;
  }, []);

  const active = useMemo(() => activeAppointments(items), [items]);

  const forDate = useCallback(
    (iso: string, includeCancelled = false) => {
      const list = includeCancelled ? items : active;
      return list
        .filter((a) => a.date === iso)
        .sort((a, b) => a.start.localeCompare(b.start));
    },
    [items, active],
  );

  const appointmentDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of active) {
      map.set(a.date, (map.get(a.date) ?? 0) + 1);
    }
    return map;
  }, [active]);

  return {
    items,
    active,
    hydrated,
    add,
    cancel,
    complete,
    reschedule,
    forDate,
    appointmentDates,
  };
}
