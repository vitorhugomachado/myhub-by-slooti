"use client";

import { CalendarDays, MapPin, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { QuickPatientCard } from "@/components/dashboard/QuickPatientCard";
import { SessionsCalendar } from "@/components/sessoes/SessionsCalendar";
import {
  CancelSessionDialog,
  RescheduleDialog,
} from "@/components/sessoes/SessionManageDialogs";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import { useSchedule } from "@/hooks/useSchedule";
import { needsPackageRenewal } from "@/lib/billing";
import {
  AGENDA_TODAY,
  parseISODate,
  toLocalISODate,
  type DatedAppointment,
} from "@/lib/agenda";
import { formatFinanceDate } from "@/lib/finance";
import type { AppointmentStatus } from "@/lib/mock-data";

type Period = "hoje" | "semana" | "mes";
type StatusFilter = "todos" | AppointmentStatus;

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function inPeriod(iso: string, period: Period, today: Date) {
  const [y, m, d] = iso.split("-").map(Number);
  const entry = new Date(y, m - 1, d);
  const todayStr = toLocalISODate(today);

  if (period === "hoje") return iso === todayStr;

  if (period === "semana") {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return entry >= start && entry <= end;
  }

  return (
    entry.getMonth() === today.getMonth() &&
    entry.getFullYear() === today.getFullYear()
  );
}

const statusLabel: Record<AppointmentStatus, string> = {
  done: "Concluída",
  now: "Agora",
  upcoming: "Próxima",
  cancelled: "Cancelada",
};

export function SessoesPage() {
  const { paid, patientByName } = useFinance();
  const { items, cancel, reschedule } = useSchedule();
  const [period, setPeriod] = useState<Period>("mes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selected, setSelected] = useState<DatedAppointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<DatedAppointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DatedAppointment | null>(
    null,
  );

  const referenceToday = useMemo(() => parseISODate(AGENDA_TODAY), []);

  const filtered = useMemo(() => {
    return items
      .filter((a) => inPeriod(a.date, period, referenceToday))
      .filter((a) =>
        statusFilter === "todos" ? true : a.status === statusFilter,
      )
      .sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return a.start.localeCompare(b.start);
      });
  }, [items, period, statusFilter, referenceToday]);

  const periodAppointments = useMemo(
    () =>
      items.filter(
        (a) =>
          a.status !== "cancelled" &&
          inPeriod(a.date, period, referenceToday),
      ),
    [items, period, referenceToday],
  );

  const doneCount = periodAppointments.filter((a) => a.status === "done").length;
  const upcomingCount = periodAppointments.filter(
    (a) => a.status === "upcoming" || a.status === "now",
  ).length;

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <Header />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Agenda
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Calendário de atendimentos — cancele ou remarque sessões
            </p>
          </div>

          <div className="flex rounded-full border border-line bg-card p-1">
            {(
              [
                { id: "hoje" as const, label: "Hoje" },
                { id: "semana" as const, label: "Semana" },
                { id: "mes" as const, label: "Mês" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${
                  period === p.id
                    ? "bg-surface text-brand"
                    : "text-muted hover:text-brand"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="No período"
            value={String(periodAppointments.length)}
            hint="atendimentos"
          />
          <SummaryCard
            label="Concluídas"
            value={String(doneCount)}
            hint="sessões finalizadas"
          />
          <SummaryCard
            label="A realizar"
            value={String(upcomingCount)}
            hint="próximas e em andamento"
          />
        </div>

        <SessionsCalendar onSelect={setSelected} />

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-bold text-brand">Pacientes</h2>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "todos" as const, label: "Todos" },
                  { id: "done" as const, label: "Concluídas" },
                  { id: "now" as const, label: "Agora" },
                  { id: "upcoming" as const, label: "Próximas" },
                  { id: "cancelled" as const, label: "Canceladas" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    statusFilter === f.id
                      ? "bg-surface text-brand"
                      : "bg-bg text-muted hover:text-brand"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-muted">
              Nenhum atendimento neste filtro.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((appt) => {
                const isPaid = paid(appt.id, {
                  date: appt.date,
                  patientName: appt.patient,
                });
                const renew = needsPackageRenewal(patientByName(appt.patient));
                const isCancelled = appt.status === "cancelled";

                return (
                  <li
                    key={`${appt.date}-${appt.id}`}
                    className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                      isCancelled ? "opacity-55" : "hover:bg-bg"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !isCancelled && setSelected(appt)}
                      disabled={isCancelled}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                    >
                      <Image
                        src={appt.avatar}
                        alt={appt.patient}
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-brand">
                            {appt.patient}
                          </p>
                          {isPaid && !isCancelled && <PaidMark />}
                          {renew && !isCancelled && <RenewalPill />}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              appt.status === "now"
                                ? "bg-orange text-brand"
                                : appt.status === "done"
                                  ? "bg-surface text-brand"
                                  : appt.status === "cancelled"
                                    ? "bg-danger/15 text-danger"
                                    : "bg-yellow/30 text-brand"
                            }`}
                          >
                            {statusLabel[appt.status]}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted">
                          <span className="truncate">{appt.type}</span>
                          <span className="text-muted/40">·</span>
                          <span className="inline-flex items-center gap-0.5">
                            {appt.mode === "Online" ? (
                              <Video className="size-3" />
                            ) : (
                              <MapPin className="size-3" />
                            )}
                            {appt.mode}
                          </span>
                        </p>
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <div className="mr-1 text-right">
                        <p className="text-[14px] font-bold text-brand">
                          {appt.start}
                        </p>
                        <p className="text-[11px] text-muted">
                          {formatFinanceDate(appt.date)}
                        </p>
                      </div>
                      {!isCancelled && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRescheduleTarget(appt)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-2 text-[12px] font-semibold text-brand hover:bg-surface-soft"
                          >
                            <CalendarDays className="size-3.5" />
                            Remarcar
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelTarget(appt)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-2 text-[12px] font-semibold text-danger hover:bg-danger/10"
                          >
                            <X className="size-3.5" />
                            Cancelar
                          </button>
                          <Link
                            href={`/sessao/${appt.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-line bg-bg px-3.5 py-2 text-[12px] font-semibold text-brand hover:bg-surface-soft"
                          >
                            Abrir
                          </Link>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {selected && (
        <QuickPatientCard
          appointment={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {rescheduleTarget && (
        <RescheduleDialog
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSave={(patch) => {
            reschedule(rescheduleTarget.id, patch);
            setRescheduleTarget(null);
          }}
        />
      )}

      {cancelTarget && (
        <CancelSessionDialog
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => {
            cancel(cancelTarget.id);
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-brand">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
    </article>
  );
}
