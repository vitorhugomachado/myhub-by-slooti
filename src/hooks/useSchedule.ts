"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DatedAppointment } from "@/lib/agenda";
import {
  activeAppointments,
  cancelAppointment,
  loadSchedule,
  rescheduleAppointment,
  saveSchedule,
  SCHEDULE_EVENT,
  seedSchedule,
} from "@/lib/schedule";

export function useSchedule() {
  const [items, setItems] = useState<DatedAppointment[]>(seedSchedule);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function sync() {
      setItems(loadSchedule());
    }
    sync();
    setHydrated(true);
    window.addEventListener(SCHEDULE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCHEDULE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const commit = useCallback((next: DatedAppointment[]) => {
    setItems(next);
    saveSchedule(next);
  }, []);

  const cancel = useCallback(
    (id: number) => {
      setItems((prev) => {
        const next = cancelAppointment(prev, id);
        saveSchedule(next);
        return next;
      });
    },
    [],
  );

  const reschedule = useCallback(
    (id: number, patch: { date: string; start: string; end?: string }) => {
      setItems((prev) => {
        const next = rescheduleAppointment(prev, id, patch);
        saveSchedule(next);
        return next;
      });
    },
    [],
  );

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
    cancel,
    reschedule,
    forDate,
    appointmentDates,
  };
}
