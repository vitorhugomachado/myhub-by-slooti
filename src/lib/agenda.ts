import type { Appointment } from "@/lib/mock-data";
import {
  activeAppointments,
  loadSchedule,
  SCHEDULE_TODAY,
  seedSchedule,
  type ScheduleItem,
} from "@/lib/schedule";

/** Data de referência alinhada aos mocks da agenda. */
export const AGENDA_TODAY = SCHEDULE_TODAY;

export type DatedAppointment = ScheduleItem;

export function getDatedAppointments(opts?: {
  includeCancelled?: boolean;
}): DatedAppointment[] {
  const items =
    typeof window === "undefined" ? seedSchedule() : loadSchedule();
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

export type { Appointment };
