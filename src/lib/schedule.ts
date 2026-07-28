import { todaySchedule, upcomingDays, type Appointment } from "@/lib/mock-data";
import { readUserStorage, writeUserStorage } from "@/lib/user-storage";

export const SCHEDULE_KEY = "myhub_schedule_v1";
export const SCHEDULE_EVENT = "myhub:schedule";

/** Duração padrão de uma sessão (minutos). */
export const SESSION_MINUTES = 50;

/** Horários de trabalho padrão. */
export const DAY_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export type DaySlot = (typeof DAY_SLOTS)[number];

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Data de referência da agenda (hoje no fuso local). */
export const SCHEDULE_TODAY = localISODate();

export type ScheduleItem = Appointment & { date: string };

export type AddAppointmentInput = {
  date: string;
  start: string;
  end?: string;
  patient: string;
  avatar: string;
  type?: string;
  mode: Appointment["mode"];
};

const upcomingIsoById: Record<string, string> = {
  amanha: "2026-07-23",
  sexta: "2026-07-24",
  segunda: "2026-07-27",
};

/** @deprecated Demo only — not used for new accounts. */
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
  if (typeof window === "undefined") return [];
  try {
    const raw = readUserStorage(SCHEDULE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScheduleItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSchedule(
  items: ScheduleItem[],
  opts?: { silent?: boolean },
) {
  writeUserStorage(SCHEDULE_KEY, JSON.stringify(items));
  if (!opts?.silent) {
    window.dispatchEvent(new Event(SCHEDULE_EVENT));
  }
}

export function addMinutesToTime(start: string, minutes: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function slotsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart)
  );
}

export type DaySlotRow = {
  start: string;
  end: string;
  occupant: ScheduleItem | null;
};

/** Monta a grade do dia: slots padrão + extras fora da grade. */
export function buildDaySlotRows(
  appointments: ScheduleItem[],
  opts?: { excludeId?: number },
): DaySlotRow[] {
  const list = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      (opts?.excludeId == null || a.id !== opts.excludeId),
  );

  const extras = list.filter(
    (a) =>
      !DAY_SLOTS.some((slot) =>
        slotsOverlap(
          a.start,
          a.end,
          slot,
          addMinutesToTime(slot, SESSION_MINUTES),
        ),
      ),
  );

  const base = DAY_SLOTS.map((slotStart) => {
    const slotEnd = addMinutesToTime(slotStart, SESSION_MINUTES);
    const occupant =
      list.find((a) => slotsOverlap(a.start, a.end, slotStart, slotEnd)) ??
      null;
    return { start: slotStart, end: slotEnd, occupant };
  });

  const extraRows = extras.map((a) => ({
    start: a.start,
    end: a.end,
    occupant: a,
  }));

  return [...base, ...extraRows].sort((a, b) => a.start.localeCompare(b.start));
}

export function nextAppointmentId(items: ScheduleItem[]) {
  let max = 0;
  for (const item of items) {
    if (item.id > max) max = item.id;
  }
  return max + 1;
}

export function addAppointment(
  items: ScheduleItem[],
  input: AddAppointmentInput,
): ScheduleItem[] {
  const end = input.end ?? addMinutesToTime(input.start, SESSION_MINUTES);
  const conflict = activeAppointments(items).some(
    (a) =>
      a.date === input.date && slotsOverlap(a.start, a.end, input.start, end),
  );
  if (conflict) {
    throw new Error("Já existe uma sessão neste horário.");
  }

  const next: ScheduleItem = {
    id: nextAppointmentId(items),
    date: input.date,
    start: input.start,
    end,
    patient: input.patient,
    avatar: input.avatar,
    type: input.type?.trim() || "Sessão",
    mode: input.mode,
    status: "upcoming",
  };

  return [...items, next].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.start.localeCompare(b.start);
  });
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
  const end = patch.end ?? addMinutesToTime(patch.start, SESSION_MINUTES);
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
