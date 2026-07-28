"use client";

import { CalendarDays, CalendarPlus, MapPin, Plus, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddAppointmentDialog } from "@/components/sessoes/AddAppointmentDialog";
import {
  CancelSessionDialog,
  RescheduleDialog,
} from "@/components/sessoes/SessionManageDialogs";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import {
  AgendaMonthGrid,
  useAgendaMonth,
} from "@/components/shared/AgendaMonthGrid";
import { useFinance } from "@/hooks/useFinance";
import { useSchedule } from "@/hooks/useSchedule";
import { needsPackageRenewal } from "@/lib/billing";
import { dayAgendaHeading, type DatedAppointment } from "@/lib/agenda";
import type { AppointmentStatus } from "@/lib/mock-data";
import { buildDaySlotRows } from "@/lib/schedule";

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
  const { forDate, appointmentDates, add, cancel, reschedule } = useSchedule();
  const {
    today,
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
  const [addPrefill, setAddPrefill] = useState<{
    date: string;
    start?: string;
  } | null>(null);

  const visibleDay = forDate(selected, true);
  const activeDay = useMemo(
    () => visibleDay.filter((a) => a.status !== "cancelled"),
    [visibleDay],
  );
  const slotRows = useMemo(
    () => buildDaySlotRows(activeDay),
    [activeDay],
  );
  const freeCount = slotRows.filter((s) => !s.occupant).length;
  const busyCount = slotRows.filter((s) => s.occupant).length;
  const dayHeading = dayAgendaHeading(selected, today);

  return (
    <>
      <div className="grid items-start gap-3 lg:grid-cols-[1.1fr_1fr]">
        <AgendaMonthGrid
          cursor={cursor}
          selected={selected}
          today={today}
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

        <article className="card flex max-h-[min(70vh,720px)] min-h-[420px] flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold capitalize text-brand">
                {dayHeading}
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                {busyCount === 0
                  ? `${freeCount} horários disponíveis`
                  : `${busyCount} ocupado${busyCount === 1 ? "" : "s"} · ${freeCount} livre${freeCount === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddPrefill({ date: selected })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange px-3.5 py-2 text-[12px] font-bold text-brand"
            >
              <CalendarPlus className="size-3.5" />
              Nova sessão
            </button>
          </div>

          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {slotRows.map((slot) => {
              const appt = slot.occupant;

              if (!appt) {
                return (
                  <li key={`free-${slot.start}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setAddPrefill({ date: selected, start: slot.start })
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-bg/60 px-3.5 py-3 text-left transition-colors hover:border-surface hover:bg-surface-soft/50"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-brand">
                          {slot.start} – {slot.end}
                        </p>
                        <p className="text-[11px] text-muted">Horário livre</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-accent-deep">
                        <Plus className="size-3.5" />
                        Adicionar
                      </span>
                    </button>
                  </li>
                );
              }

              const isPaid = paid(appt.id, {
                date: appt.date,
                patientName: appt.patient,
              });
              const renew = needsPackageRenewal(patientByName(appt.patient));

              return (
                <li
                  key={`busy-${appt.id}`}
                  className="rounded-2xl border border-line bg-card px-3.5 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => onSelect?.(appt)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                          {isPaid && <PaidMark />}
                          {renew && <RenewalPill />}
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
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </div>

      {addPrefill && (
        <AddAppointmentDialog
          prefill={addPrefill}
          onClose={() => setAddPrefill(null)}
          onSave={async (input) => {
            await add(input);
            setSelected(input.date);
            setAddPrefill(null);
          }}
        />
      )}

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
