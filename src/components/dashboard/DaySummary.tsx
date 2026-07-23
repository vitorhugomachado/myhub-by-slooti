"use client";

import { CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import { AGENDA_TODAY } from "@/lib/agenda";

export function DaySummary() {
  const { forDate } = useSchedule();
  const todayItems = forDate(AGENDA_TODAY, false);
  const total = todayItems.length;
  const done = todayItems.filter((a) => a.status === "done").length;
  const remaining = todayItems.filter(
    (a) => a.status === "now" || a.status === "upcoming",
  ).length;

  const items = [
    {
      label: "Hoje",
      value: total,
      icon: CalendarDays,
      tone: "bg-surface text-brand",
    },
    {
      label: "Concluídas",
      value: done,
      icon: CheckCircle2,
      tone: "bg-yellow/35 text-brand",
    },
    {
      label: "Restantes",
      value: remaining,
      icon: Clock,
      tone: "bg-pink/20 text-pink",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className="card flex flex-col items-start gap-2 p-3.5"
          >
            <span
              className={`flex size-8 items-center justify-center rounded-xl ${item.tone}`}
            >
              <Icon className="size-4" />
            </span>
            <div>
              <p className="text-xl font-bold leading-none tracking-tight text-brand">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted">
                {item.label}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
