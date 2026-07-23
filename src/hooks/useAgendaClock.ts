"use client";

import { useEffect, useState } from "react";
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
