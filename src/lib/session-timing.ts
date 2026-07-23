import { type DatedAppointment } from "@/lib/agenda";

/** Relógio real da agenda. */
export function agendaNow(_referenceDate?: string): Date {
  return new Date();
}

export function combineDateAndTime(isoDate: string, time: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [h, min, sec = "0"] = time.split(":");
  return new Date(y, m - 1, d, Number(h), Number(min), Number(sec), 0);
}

export function formatDelay(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  }
  if (minutes > 0) {
    return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

export type LateQueueInfo = {
  /** Sessão que passou do fim e não foi finalizada. */
  blockedBy: DatedAppointment;
  /** Próximo atendimento que já deveria ter começado. */
  late: DatedAppointment;
  /** Tempo em atraso desde o horário de início previsto. */
  lateMs: number;
};

/**
 * Se uma sessão passou do horário de fim sem ser finalizada e o próximo
 * já deveria ter iniciado, esse próximo fica em atraso.
 */
export function resolveLateQueue(
  items: DatedAppointment[],
  now: Date = agendaNow(),
): LateQueueInfo | null {
  const day = [...items]
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));

  for (let i = 0; i < day.length; i++) {
    const current = day[i];
    if (current.status === "done") continue;

    const endAt = combineDateAndTime(current.date, current.end);
    if (now.getTime() < endAt.getTime()) continue;

    const next = day.slice(i + 1).find((a) => a.status !== "done");
    if (!next) continue;

    const nextStart = combineDateAndTime(next.date, next.start);
    if (now.getTime() < nextStart.getTime()) continue;

    return {
      blockedBy: current,
      late: next,
      lateMs: now.getTime() - nextStart.getTime(),
    };
  }

  return null;
}

export function isAppointmentLate(
  item: DatedAppointment,
  late: LateQueueInfo | null,
) {
  return Boolean(late && late.late.id === item.id);
}
