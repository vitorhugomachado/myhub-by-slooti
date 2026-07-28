"use client";

import { useEffect, useState } from "react";
import { toLocalISODate } from "@/lib/agenda";
import { agendaNow } from "@/lib/session-timing";

/** Atualiza o relógio da agenda a cada segundo (para contadores de atraso). */
export function useAgendaClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => agendaNow());

  useEffect(() => {
    setNow(agendaNow());
    const id = window.setInterval(() => setNow(agendaNow()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

/** ISO de hoje no fuso local, alinhado ao relógio (atualiza a cada minuto). */
export function useAgendaToday(intervalMs = 60_000) {
  const now = useAgendaClock(intervalMs);
  return toLocalISODate(now);
}
