"use client";

import { useMemo } from "react";
import {
  daysInMonth,
  parseIsoDate,
  toIsoDate,
} from "@/lib/dates";

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const selectClass =
  "w-full rounded-xl border border-line bg-bg px-3 py-3 text-[13px] leading-normal text-brand outline-none focus:border-surface";

const selectErrorClass =
  "w-full rounded-xl border border-danger/50 bg-bg px-3 py-3 text-[13px] leading-normal text-brand outline-none focus:border-danger";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  error?: boolean;
  maxYear?: number;
  minYear?: number;
};

/** Seletor dia / mês / ano (pt-BR) → ISO `YYYY-MM-DD`. */
export function BirthDateField({
  value,
  onChange,
  error,
  maxYear = new Date().getFullYear(),
  minYear = 1920,
}: Props) {
  const { year, month, day } = parseIsoDate(value);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) list.push(y);
    return list;
  }, [maxYear, minYear]);

  const days = useMemo(() => {
    const y = Number(year) || maxYear;
    const m = Number(month) || 1;
    const total = daysInMonth(y, m);
    return Array.from({ length: total }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    );
  }, [year, month, maxYear]);

  function emit(nextYear: string, nextMonth: string, nextDay: string) {
    let dayValue = nextDay;
    if (nextYear && nextMonth && nextDay) {
      const max = daysInMonth(Number(nextYear), Number(nextMonth));
      if (Number(nextDay) > max) {
        dayValue = String(max).padStart(2, "0");
      }
    }
    onChange(toIsoDate(nextYear, nextMonth, dayValue));
  }

  const cls = error ? selectErrorClass : selectClass;

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        className={cls}
        aria-label="Dia"
        value={day}
        onChange={(e) => emit(year, month, e.target.value)}
      >
        <option value="">Dia</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {Number(d)}
          </option>
        ))}
      </select>
      <select
        className={cls}
        aria-label="Mês"
        value={month}
        onChange={(e) => emit(year, e.target.value, day)}
      >
        <option value="">Mês</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        className={cls}
        aria-label="Ano"
        value={year}
        onChange={(e) => emit(e.target.value, month, day)}
      >
        <option value="">Ano</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
