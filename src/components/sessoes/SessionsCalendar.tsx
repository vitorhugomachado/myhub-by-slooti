"use client";

import { CalendarDays, MapPin, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
  formatDayLabel,
  type DatedAppointment,
} from "@/lib/agenda";
import type { AppointmentStatus } from "@/lib/mock-data";
import {
  AgendaMonthGrid,
  useAgendaMonth,
} from "@/components/shared/AgendaMonthGrid";

const statusLabel: Record<AppointmentStatus, string> = {
  done: "Concluída",
  now: "Agora",
  upcoming: "Próxima",
  cancelled: "Cancelada",
};

function StatusPill({ status }: { status: AppointmentStatus }) {
  const styles =
    status === "now"
      ? "bg-orange text-brand"
      : status === "done"
        ? "bg-surface text-brand"
        : status === "cancelled"
          ? "bg-danger/15 text-danger"
          : "bg-yellow/30 text-brand";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles}`}>
      {statusLabel[status]}
    </span>
  );
}

export function SessionsCalendar({
  onSelect,
}: {
  onSelect?: (appointment: DatedAppointment) => void;
}) {
  const { paid, patientByName } = useFinance();
  const { forDate, appointmentDates, cancel, reschedule } = useSchedule();
  const {
    cursor,
    setCursor,
    selected,
    setSelected,
    goToday,
  } = useAgendaMonth();

  const [rescheduleTarget, setRescheduleTarget] =
    useState<DatedAppointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DatedAppointment | null>(
    null,
  );

  const visibleDay = forDate(selected, true);

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <AgendaMonthGrid
          cursor={cursor}
          selected={selected}
          appointmentDates={appointmentDates}
          onSelect={setSelected}
          onPrev={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
          onNext={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
          onToday={goToday}
        />

        <article className="card flex flex-col overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-bold capitalize text-brand">
              {formatDayLabel(selected)}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {visibleDay.filter((a) => a.status !== "cancelled").length === 0
                ? "Nenhum atendimento neste dia"
                : `${visibleDay.filter((a) => a.status !== "cancelled").length} atendimento${visibleDay.filter((a) => a.status !== "cancelled").length === 1 ? "" : "s"}`}
            </p>
          </div>

          {visibleDay.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-[13px] text-muted">
              Selecione um dia com sessões para ver os pacientes.
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-line overflow-y-auto">
              {visibleDay.map((appt) => {
                const isPaid = paid(appt.id, {
                  date: appt.date,
                  patientName: appt.patient,
                });
                const renew = needsPackageRenewal(patientByName(appt.patient));
                const isCancelled = appt.status === "cancelled";

                return (
                  <li
                    key={appt.id}
                    className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                      isCancelled ? "opacity-55" : "hover:bg-bg"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !isCancelled && onSelect?.(appt)}
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-[13px] font-semibold text-brand">
                            {appt.patient}
                          </p>
                          {isPaid && !isCancelled && <PaidMark />}
                          {renew && !isCancelled && <RenewalPill />}
                          <StatusPill status={appt.status} />
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
                          <span>
                            {appt.start} – {appt.end}
                          </span>
                          <span className="text-muted/40">·</span>
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
                      {!isCancelled && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRescheduleTarget(appt)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-2 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft"
                          >
                            <CalendarDays className="size-3.5" />
                            Remarcar
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelTarget(appt)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-2 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/10"
                          >
                            <X className="size-3.5" />
                            Cancelar
                          </button>
                          <Link
                            href={`/sessao/${appt.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-line bg-bg px-3.5 py-2 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft"
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
        </article>
      </div>

      {rescheduleTarget && (
        <RescheduleDialog
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSave={(patch) => {
            reschedule(rescheduleTarget.id, patch);
            setSelected(patch.date);
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
    </>
  );
}
