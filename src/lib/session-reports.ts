export type SessionReport = {
  id: string;
  appointmentId: number;
  patientName: string;
  date: string;
  start: string;
  end: string;
  summary: string;
  evolution: string;
  nextSteps: string;
  createdAt: string;
  updatedAt: string;
};

export const SESSION_REPORTS_KEY = "myhub_session_reports_v1";
export const SESSION_REPORTS_EVENT = "myhub:session-reports";

export function loadSessionReports(): SessionReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSION_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessionReports(items: SessionReport[]) {
  localStorage.setItem(SESSION_REPORTS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(SESSION_REPORTS_EVENT));
}

export function getReportByAppointment(appointmentId: number) {
  return loadSessionReports().find((r) => r.appointmentId === appointmentId);
}

export function getReportsForPatient(patientName: string) {
  return loadSessionReports()
    .filter(
      (r) => r.patientName.toLowerCase() === patientName.toLowerCase(),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start));
}

export function upsertSessionReport(
  input: Omit<SessionReport, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
) {
  const items = loadSessionReports();
  const existing = items.find(
    (r) =>
      r.appointmentId === input.appointmentId ||
      (input.id && r.id === input.id),
  );
  const now = new Date().toISOString();

  if (existing) {
    const updated = items.map((r) =>
      r.id === existing.id
        ? {
            ...r,
            ...input,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
          }
        : r,
    );
    saveSessionReports(updated);
    return updated.find((r) => r.id === existing.id)!;
  }

  const next: SessionReport = {
    appointmentId: input.appointmentId,
    patientName: input.patientName,
    date: input.date,
    start: input.start,
    end: input.end,
    summary: input.summary,
    evolution: input.evolution,
    nextSteps: input.nextSteps,
    id: `report-${input.appointmentId}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  saveSessionReports([next, ...items]);
  return next;
}
