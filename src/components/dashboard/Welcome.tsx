"use client";

import { useMemo } from "react";
import { useAgendaToday } from "@/hooks/useAgendaClock";
import { useProfile } from "@/hooks/useProfile";
import { useSchedule } from "@/hooks/useSchedule";
import {
  dayHasOpenSessions,
  resolveDashboardAgendaFocus,
} from "@/lib/agenda";
import { profileDisplayName } from "@/lib/profile";

export function Welcome() {
  const { profile } = useProfile();
  const { items, forDate } = useSchedule();
  const today = useAgendaToday();

  const focus = useMemo(
    () => resolveDashboardAgendaFocus(items, today),
    [items, today],
  );
  const dayItems = forDate(focus.date, false);
  const todayItems = forDate(today, false);
  const todayWasFinished =
    !focus.isToday &&
    todayItems.length > 0 &&
    !dayHasOpenSessions(todayItems);

  const firstName = useMemo(() => {
    const name = profileDisplayName(profile);
    return name.split(" ")[0] || "olá";
  }, [profile]);

  const nextUp = useMemo(
    () =>
      dayItems.find((a) => a.status === "now") ??
      dayItems.find((a) => a.status === "upcoming") ??
      null,
    [dayItems],
  );

  const remaining = dayItems.filter(
    (a) => a.status === "now" || a.status === "upcoming",
  ).length;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
        Olá, {firstName}.
      </h1>
      <p className="text-[13px] font-medium text-muted">
        {todayWasFinished && nextUp ? (
          <>
            Agenda de hoje concluída · próximos {remaining} atendimento
            {remaining === 1 ? "" : "s"} {focus.relativeLabel}
            {nextUp.start ? ` · às ${nextUp.start}` : ""}
          </>
        ) : nextUp ? (
          <>
            Você tem {remaining} atendimento{remaining === 1 ? "" : "s"} restante
            {remaining === 1 ? "" : "s"} {focus.relativeLabel} ·{" "}
            {focus.isToday && nextUp.status === "now"
              ? "em andamento"
              : `próximo às ${nextUp.start}`}
          </>
        ) : (
          "Nenhum atendimento restante hoje."
        )}
      </p>
    </div>
  );
}
