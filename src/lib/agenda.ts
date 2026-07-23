import type { Appointment } from "@/lib/mock-data";
import {
  activeAppointments,
  loadSchedule,
  SCHEDULE_TODAY,
  type ScheduleItem,
} from "@/lib/schedule";

/** Data de referência da agenda (hoje no fuso local). */
export const AGENDA_TODAY = SCHEDULE_TODAY;

export type DatedAppointment = ScheduleItem;

export function getDatedAppointments(opts?: {
  includeCancelled?: boolean;
}): DatedAppointment[] {
  const items = loadSchedule();
  return opts?.includeCancelled ? items : activeAppointments(items);
}

export function getAppointmentsForDate(
  iso: string,
  opts?: { includeCancelled?: boolean },
): DatedAppointment[] {
  return getDatedAppointments(opts)
    .filter((a) => a.date === iso)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function getAppointmentDate(id: number): string | undefined {
  return getDatedAppointments({ includeCancelled: true }).find(
    (a) => a.id === id,
  )?.date;
}

export function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(iso: string) {
  return parseISODate(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export type LiveUpcomingDay = {
  id: string;
  iso: string;
  day: string;
  date: string;
  count: number;
  range: string;
  appointments: DatedAppointment[];
};

/** Agrupa sessões ativas após a data de referência (próximos dias). */
export function buildUpcomingDays(
  items: DatedAppointment[],
  today = AGENDA_TODAY,
  limit = 5,
): LiveUpcomingDay[] {
  const byDate = new Map<string, DatedAppointment[]>();
  for (const a of items) {
    if (a.status === "cancelled") continue;
    if (a.date <= today) continue;
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, limit)
    .map(([iso, appts]) => {
      const sorted = [...appts].sort((a, b) => a.start.localeCompare(b.start));
      const d = parseISODate(iso);
      const dayName = d.toLocaleDateString("pt-BR", { weekday: "long" });
      const dayNum = String(d.getDate()).padStart(2, "0");
      const month = d
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");
      const relative =
        (() => {
          const tomorrow = parseISODate(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (iso === toLocalISODate(tomorrow)) return "Amanhã";
          return dayName.charAt(0).toUpperCase() + dayName.slice(1);
        })();

      return {
        id: iso,
        iso,
        day: relative,
        date: `${dayNum} ${month}`,
        count: sorted.length,
        range:
          sorted.length > 0
            ? `${sorted[0].start} – ${sorted[sorted.length - 1].end}`
            : "—",
        appointments: sorted,
      };
    });
}

export type { Appointment };
