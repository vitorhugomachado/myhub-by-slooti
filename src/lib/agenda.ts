import type { Appointment } from "@/lib/mock-data";
import {
  activeAppointments,
  loadSchedule,
  type ScheduleItem,
} from "@/lib/schedule";

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

/** Hoje no fuso local — sempre a partir do `Date` informado (relógio ao vivo). */
export function agendaToday(now: Date = new Date()) {
  return toLocalISODate(now);
}

/**
 * Snapshot no import — preferir `agendaToday()` / `useAgendaToday()` no client.
 */
export const AGENDA_TODAY = agendaToday();

export function addDaysISO(iso: string, days: number) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
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

/** Título da lista ao entrar em um dia (relativo ao hoje do relógio). */
export function dayAgendaHeading(iso: string, today: string) {
  if (iso === today) return "Agenda de Hoje";
  if (iso === addDaysISO(today, 1)) return "Agenda de Amanhã";
  const label = formatDayLabel(iso);
  return label.charAt(0).toUpperCase() + label.slice(1);
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

/** Há sessão ainda não concluída (agora ou próxima). */
export function dayHasOpenSessions(items: DatedAppointment[]) {
  return items.some((a) => a.status === "now" || a.status === "upcoming");
}

export type DashboardAgendaFocus = {
  date: string;
  isToday: boolean;
  /** Título do bloco principal, ex.: "Agenda de Hoje" */
  title: string;
  /** Rótulo curto nos cards, ex.: "Hoje" / "Amanhã" */
  shortLabel: string;
  /** Para textos corridos, ex.: "hoje" / "amanhã" */
  relativeLabel: string;
};

function relativeDayLabels(iso: string, today: string) {
  if (iso === today) {
    return {
      isToday: true as const,
      title: "Agenda de Hoje",
      shortLabel: "Hoje",
      relativeLabel: "hoje",
    };
  }
  if (iso === addDaysISO(today, 1)) {
    return {
      isToday: false as const,
      title: "Agenda de Amanhã",
      shortLabel: "Amanhã",
      relativeLabel: "amanhã",
    };
  }
  const dayName = parseISODate(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
  });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return {
    isToday: false as const,
    title: `Agenda · ${capitalized}`,
    shortLabel: capitalized,
    relativeLabel: capitalized.toLowerCase(),
  };
}

/**
 * Se o dia de hoje (relógio) não tem sessões abertas (vazio ou tudo concluído),
 * o dashboard foca no próximo dia com agendamentos.
 * `today` deve vir do relógio ao vivo (`agendaToday(now)`).
 */
export function resolveDashboardAgendaFocus(
  items: DatedAppointment[],
  today: string = agendaToday(),
): DashboardAgendaFocus {
  const todayActive = items.filter(
    (a) => a.date === today && a.status !== "cancelled",
  );

  if (dayHasOpenSessions(todayActive)) {
    return { date: today, ...relativeDayLabels(today, today) };
  }

  const nextDate = [
    ...new Set(
      items
        .filter((a) => a.date > today && a.status !== "cancelled")
        .map((a) => a.date),
    ),
  ].sort()[0];

  if (!nextDate) {
    return { date: today, ...relativeDayLabels(today, today) };
  }

  return { date: nextDate, ...relativeDayLabels(nextDate, today) };
}

/** Agrupa sessões ativas após a data de referência (próximos dias). */
export function buildUpcomingDays(
  items: DatedAppointment[],
  afterDate: string = agendaToday(),
  limit = 5,
): LiveUpcomingDay[] {
  const byDate = new Map<string, DatedAppointment[]>();
  for (const a of items) {
    if (a.status === "cancelled") continue;
    if (a.date <= afterDate) continue;
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
        iso === addDaysISO(afterDate, 1)
          ? "Amanhã"
          : dayName.charAt(0).toUpperCase() + dayName.slice(1);

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
