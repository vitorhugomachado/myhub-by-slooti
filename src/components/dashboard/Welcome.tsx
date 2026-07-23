"use client";

import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useSchedule } from "@/hooks/useSchedule";
import { AGENDA_TODAY } from "@/lib/agenda";
import { profileDisplayName } from "@/lib/profile";

export function Welcome() {
  const { profile } = useProfile();
  const { forDate } = useSchedule();
  const todayItems = forDate(AGENDA_TODAY, false);

  const firstName = useMemo(() => {
    const name = profileDisplayName(profile);
    return name.split(" ")[0] || "olá";
  }, [profile]);

  const nextUp = useMemo(
    () =>
      todayItems.find((a) => a.status === "now") ??
      todayItems.find((a) => a.status === "upcoming") ??
      null,
    [todayItems],
  );

  const remaining = todayItems.filter(
    (a) => a.status === "now" || a.status === "upcoming",
  ).length;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
        Olá, {firstName}.
      </h1>
      <p className="text-[13px] font-medium text-muted">
        {nextUp ? (
          <>
            Você tem {remaining} atendimento{remaining === 1 ? "" : "s"} restante
            {remaining === 1 ? "" : "s"} hoje ·{" "}
            {nextUp.status === "now"
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
