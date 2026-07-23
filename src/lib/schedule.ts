import { todaySchedule, upcomingDays, type Appointment } from "@/lib/mock-data";

export const SCHEDULE_KEY = "myhub_schedule_v1";
export const SCHEDULE_EVENT = "myhub:schedule";
export const SCHEDULE_TODAY = "2026-07-22";

export type ScheduleItem = Appointment & { date: string };

const upcomingIsoById: Record<string, string> = {
  amanha: "2026-07-23",
  sexta: "2026-07-24",
  segunda: "2026-07-27",
};

export function seedSchedule(): ScheduleItem[] {
  const today = todaySchedule.map((a) => ({ ...a, date: SCHEDULE_TODAY }));
  const upcoming = upcomingDays.flatMap((day) => {
    const date = upcomingIsoById[day.id];
    if (!date) return [];
    return day.appointments.map((a) => ({ ...a, date }));
  });
  return [...today, ...upcoming];
}

export function loadSchedule(): ScheduleItem[] {
  if (typeof window === "undefined") return seedSchedule();
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (!raw) return seedSchedule();
    const parsed = JSON.parse(raw) as ScheduleItem[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedSchedule();
  } catch {
    return seedSchedule();
  }
}

export function saveSchedule(items: ScheduleItem[]) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(SCHEDULE_EVENT));
}

export function addMinutesToTime(start: string, minutes: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function cancelAppointment(
  items: ScheduleItem[],
  id: number,
): ScheduleItem[] {
  return items.map((a) =>
    a.id === id ? { ...a, status: "cancelled" as const } : a,
  );
}

export function completeAppointment(
  items: ScheduleItem[],
  id: number,
): ScheduleItem[] {
  return items.map((a) =>
    a.id === id ? { ...a, status: "done" as const } : a,
  );
}

export function rescheduleAppointment(
  items: ScheduleItem[],
  id: number,
  patch: { date: string; start: string; end?: string },
): ScheduleItem[] {
  const end = patch.end ?? addMinutesToTime(patch.start, 50);
  return items.map((a) => {
    if (a.id !== id) return a;
    const nextStatus =
      a.status === "cancelled" || a.status === "done"
        ? ("upcoming" as const)
        : a.status === "now"
          ? ("upcoming" as const)
          : a.status;
    return {
      ...a,
      date: patch.date,
      start: patch.start,
      end,
      status: nextStatus,
    };
  });
}

export function activeAppointments(items: ScheduleItem[]) {
  return items.filter((a) => a.status !== "cancelled");
}
