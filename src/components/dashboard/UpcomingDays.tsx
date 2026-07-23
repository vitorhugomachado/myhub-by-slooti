"use client";

import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { AGENDA_TODAY, buildUpcomingDays, type LiveUpcomingDay } from "@/lib/agenda";

export function UpcomingDays({
  onSelect,
}: {
  onSelect: (day: LiveUpcomingDay) => void;
}) {
  const { active } = useSchedule();
  const days = useMemo(
    () => buildUpcomingDays(active, AGENDA_TODAY),
    [active],
  );

  return (
    <article className="card flex flex-col p-5">
      <h2 className="mb-4 text-[15px] font-bold tracking-tight text-brand">
        Próximos Dias
      </h2>
      {days.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Nenhum dia futuro com sessões.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {days.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="inner flex w-full items-center gap-3 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-surface hover:bg-surface-soft/70 hover:shadow-[0_8px_24px_rgba(20,22,26,0.06)]"
              >
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-surface text-brand">
                  <span className="text-sm font-bold leading-none">
                    {item.date.split(" ")[0]}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium uppercase text-brand/70">
                    {item.date.split(" ")[1]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-brand">
                    {item.day}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {item.count} sessão{item.count === 1 ? "" : "ões"} ·{" "}
                    {item.range}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
