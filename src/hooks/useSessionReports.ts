"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getReportByAppointment as getLocalByAppointment,
  getReportsForPatient as getLocalForPatient,
  saveSessionReports,
  SESSION_REPORTS_EVENT,
  type SessionReport,
} from "@/lib/session-reports";

async function fetchReports(params?: {
  patient?: string;
  appointmentId?: number;
}): Promise<SessionReport[]> {
  const qs = new URLSearchParams();
  if (params?.patient) qs.set("patient", params.patient);
  if (params?.appointmentId != null) {
    qs.set("appointmentId", String(params.appointmentId));
  }
  const url = qs.size
    ? `/api/session-reports?${qs.toString()}`
    : "/api/session-reports";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("session_reports_fetch_failed");
  const data = (await res.json()) as { reports: SessionReport[] };
  if (!params?.patient && params?.appointmentId == null) {
    saveSessionReports(data.reports);
  }
  return data.reports;
}

export function useSessionReports(opts?: { patientName?: string }) {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const next = await fetchReports(
          opts?.patientName ? { patient: opts.patientName } : undefined,
        );
        if (!cancelled) setReports(next);
      } catch {
        /* ignore until auth */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void sync();
    const onEvent = () => void sync();
    window.addEventListener(SESSION_REPORTS_EVENT, onEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_REPORTS_EVENT, onEvent);
    };
  }, [opts?.patientName]);

  const upsertReport = useCallback(
    async (
      input: Omit<SessionReport, "id" | "createdAt" | "updatedAt"> & {
        id?: string;
      },
    ) => {
      const res = await fetch("/api/session-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("session_report_save_failed");
      const data = (await res.json()) as { report: SessionReport };
      setReports((prev) => {
        const idx = prev.findIndex(
          (r) =>
            r.id === data.report.id ||
            (data.report.appointmentId > 0 &&
              r.appointmentId === data.report.appointmentId),
        );
        const next =
          idx >= 0
            ? prev.map((r, i) => (i === idx ? data.report : r))
            : [data.report, ...prev];
        saveSessionReports(next);
        return next;
      });
      window.dispatchEvent(new Event(SESSION_REPORTS_EVENT));
      return data.report;
    },
    [],
  );

  const reportByAppointment = useCallback(
    (appointmentId: number) =>
      reports.find((r) => r.appointmentId === appointmentId) ??
      getLocalByAppointment(appointmentId),
    [reports],
  );

  const reportsForPatient = useCallback(
    (patientName: string) => {
      const filtered = reports.filter(
        (r) => r.patientName.toLowerCase() === patientName.toLowerCase(),
      );
      return filtered.length ? filtered : getLocalForPatient(patientName);
    },
    [reports],
  );

  return {
    reports,
    hydrated,
    upsertReport,
    reportByAppointment,
    reportsForPatient,
  };
}
