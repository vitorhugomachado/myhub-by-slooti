"use client";

import { Check, Pencil } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import {
  AgendaMonthGrid,
  useAgendaMonth,
} from "@/components/shared/AgendaMonthGrid";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { needsPackageRenewal } from "@/lib/billing";
import {
  formatDayLabel,
  getAppointmentsForDate,
  getDatedAppointments,
  type DatedAppointment,
} from "@/lib/agenda";
import {
  DEFAULT_SESSION_VALUE,
  formatBRL,
  isChargeSettled,
  kindFinanceLabel,
  showsFinanceMoneyIcon,
  type FinanceCharge,
} from "@/lib/finance";
import type { Patient } from "@/lib/patients";

export function FinanceCalendar({
  entries,
  patients,
  onReceive,
  onEdit,
}: {
  entries: FinanceCharge[];
  patients: Patient[];
  onReceive: (appointment: DatedAppointment) => void;
  onEdit: (charge: FinanceCharge, appointment?: DatedAppointment) => void;
}) {
  const {
    cursor,
    setCursor,
    selected,
    setSelected,
    appointmentDates,
    goToday,
  } = useAgendaMonth();

  function patientFor(name: string) {
    return patients.find(
      (p) => p.fullName.toLowerCase() === name.toLowerCase(),
    );
  }

  function entryFor(appt: DatedAppointment) {
    return entries.find(
      (e) =>
        e.appointmentId === appt.id ||
        (e.date === appt.date && e.patientName === appt.patient),
    );
  }

  const moneyDates = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const appt of getDatedAppointments()) {
      const patient = patients.find(
        (p) => p.fullName.toLowerCase() === appt.patient.toLowerCase(),
      );
      const entry = entries.find(
        (e) =>
          e.appointmentId === appt.id ||
          (e.date === appt.date && e.patientName === appt.patient),
      );
      if (showsFinanceMoneyIcon(patient, entry)) {
        map.set(appt.date, true);
      }
    }
    return map;
  }, [entries, patients]);

  const dayAppointments = useMemo(
    () => getAppointmentsForDate(selected),
    [selected],
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
      <AgendaMonthGrid
        cursor={cursor}
        selected={selected}
        appointmentDates={appointmentDates}
        dayMarks={moneyDates}
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
            {dayAppointments.length === 0
              ? "Nenhum atendimento neste dia"
              : `${dayAppointments.length} atendimento${dayAppointments.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {dayAppointments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-[13px] text-muted">
            Selecione um dia com sessões para registrar ou editar recebimentos.
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {dayAppointments.map((appt) => {
              const entry = entryFor(appt);
              const settled = isChargeSettled(entry);
              const amount = entry?.amount ?? DEFAULT_SESSION_VALUE;
              const patient = patientFor(appt.patient);
              const renew = needsPackageRenewal(patient);
              const showMoney = showsFinanceMoneyIcon(patient, entry);

              return (
                <li
                  key={appt.id}
                  className="flex flex-col gap-3 px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src={appt.avatar}
                      alt={appt.patient}
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-[13px] font-semibold text-brand">
                          {appt.patient}
                        </p>
                        {showMoney && <PaidMark />}
                        {renew && <RenewalPill />}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
                        <span>
                          {appt.start} – {appt.end}
                        </span>
                        <span className="text-muted/40">·</span>
                        <span className="truncate">{appt.type}</span>
                        {entry && (
                          <>
                            <span className="text-muted/40">·</span>
                            <span className="truncate">
                              {kindFinanceLabel(entry.kind)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-[13px] font-bold tabular-nums text-brand">
                      {entry?.kind === "consumo_pacote" && !showMoney
                        ? "Crédito"
                        : formatBRL(
                            showMoney && entry?.kind === "consumo_pacote"
                              ? Number(
                                  patient?.packagePrice ||
                                    patient?.sessionValue ||
                                    DEFAULT_SESSION_VALUE,
                                )
                              : amount,
                          )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (entry) {
                          onEdit(entry, appt);
                          return;
                        }
                        onEdit(
                          {
                            id: `f-appt-${appt.id}`,
                            appointmentId: appt.id,
                            patientId: patient?.id,
                            patientName: appt.patient,
                            date: appt.date,
                            description: renew
                              ? `Renovação de pacote — ${appt.type}`
                              : `Sessão — ${appt.type}`,
                            amount: renew
                              ? Number(patient?.packagePrice || amount)
                              : amount,
                            method: (patient?.paymentMethod ||
                              "Pix") as FinanceCharge["method"],
                            status: "pendente",
                            kind: renew ? "renovacao_pacote" : "sessao_avulsa",
                            isPackageLastSession:
                              patient?.billingMode === "pacote" &&
                              Number(patient.creditsLeft || 0) <= 1,
                          },
                          appt,
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-2 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft"
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </button>
                    {!settled && showMoney && (
                      <button
                        type="button"
                        onClick={() => onReceive(appt)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[12px] font-bold text-brand transition-opacity hover:opacity-90"
                      >
                        <Check className="size-3.5" />
                        Recebi
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
