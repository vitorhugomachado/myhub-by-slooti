"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AGENDA_TODAY,
  getDatedAppointments,
  parseISODate,
  toLocalISODate,
} from "@/lib/agenda";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export function useAgendaMonth(initialSelected = AGENDA_TODAY) {
  const reference = useMemo(() => parseISODate(AGENDA_TODAY), []);
  const [cursor, setCursor] = useState(
    () => new Date(reference.getFullYear(), reference.getMonth(), 1),
  );
  const [selected, setSelected] = useState(initialSelected);

  const appointmentDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of getDatedAppointments()) {
      map.set(a.date, (map.get(a.date) ?? 0) + 1);
    }
    return map;
  }, []);

  function goToday() {
    setCursor(new Date(reference.getFullYear(), reference.getMonth(), 1));
    setSelected(AGENDA_TODAY);
  }

  return {
    reference,
    cursor,
    setCursor,
    selected,
    setSelected,
    appointmentDates,
    goToday,
  };
}

export function AgendaMonthGrid({
  cursor,
  selected,
  appointmentDates,
  dayMarks,
  onSelect,
  onPrev,
  onNext,
  onToday,
}: {
  cursor: Date;
  selected: string;
  appointmentDates: Map<string, number>;
  dayMarks?: Map<string, boolean>;
  onSelect: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const cells = monthMatrix(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <article className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold capitalize text-brand">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={onPrev}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-bg hover:text-brand"
          >
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={onNext}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:text-brand"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const iso = toLocalISODate(date);
          const count = appointmentDates.get(iso) ?? 0;
          const isSelected = iso === selected;
          const isToday = iso === AGENDA_TODAY;
          const marked = dayMarks?.get(iso) && count > 0;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-[13px] font-semibold transition-colors ${
                isSelected
                  ? "bg-surface text-brand"
                  : isToday
                    ? "bg-surface-soft text-brand"
                    : "text-brand hover:bg-bg"
              }`}
            >
              {date.getDate()}
              {count > 0 && (
                <span className="mt-0.5 flex items-center gap-0.5">
                  <span
                    className={`size-1 rounded-full ${
                      isSelected ? "bg-brand" : "bg-accent-deep"
                    }`}
                  />
                  {marked && (
                    <span className="text-[8px] font-bold leading-none opacity-70">
                      $
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}
