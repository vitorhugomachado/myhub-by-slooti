"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { ChargeEditDrawer } from "@/components/financeiro/ChargeEditDrawer";
import { BillingBadge, RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import type { DatedAppointment } from "@/lib/agenda";
import { billingModeLabel, needsPackageRenewal } from "@/lib/billing";
import {
  DEFAULT_SESSION_VALUE,
  formatBRL,
  kindFinanceLabel,
  type FinanceCharge,
} from "@/lib/finance";

export function SessionPaymentPanel({
  appointment,
  onDelete,
}: {
  appointment: DatedAppointment;
  onDelete?: (chargeId: string) => void;
}) {
  const {
    paid,
    entryFor,
    receiveAppointment,
    patientByName,
    saveCharge,
    removeCharge,
  } = useFinance();
  const [editOpen, setEditOpen] = useState(false);

  const patient = patientByName(appointment.patient);
  const renew = needsPackageRenewal(patient);
  const isPaid = paid(appointment.id, {
    date: appointment.date,
    patientName: appointment.patient,
  });
  const financeEntry = entryFor(appointment.id, {
    date: appointment.date,
    patientName: appointment.patient,
  });

  const amount = useMemo(() => {
    if (financeEntry?.kind === "consumo_pacote") return 0;
    return (
      financeEntry?.amount ??
      (renew
        ? Number(patient?.packagePrice || DEFAULT_SESSION_VALUE)
        : Number(patient?.sessionValue || DEFAULT_SESSION_VALUE))
    );
  }, [financeEntry, renew, patient]);

  const editCharge: FinanceCharge =
    financeEntry ??
    ({
      id: `f-appt-${appointment.id}`,
      appointmentId: appointment.id,
      patientId: patient?.id,
      patientName: appointment.patient,
      date: appointment.date,
      description: renew
        ? `Renovação de pacote — ${appointment.type}`
        : `Sessão — ${appointment.type}`,
      amount,
      method: (patient?.paymentMethod || "Pix") as FinanceCharge["method"],
      status: "pendente",
      kind: renew ? "renovacao_pacote" : "sessao_avulsa",
    } satisfies FinanceCharge);

  function handleReceive() {
    receiveAppointment(appointment, {
      amount,
      method: (patient?.paymentMethod || "Pix") as FinanceCharge["method"],
    });
  }

  return (
    <div className="space-y-4">
      {patient && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-bg px-3 py-2.5">
          <BillingBadge patient={patient} />
          {renew && <RenewalPill />}
          <span className="text-[12px] text-muted">
            Plano {billingModeLabel(patient.billingMode)}
            {patient.billingMode === "pacote"
              ? ` · ${patient.creditsLeft} crédito(s)`
              : ` · R$ ${patient.sessionValue || DEFAULT_SESSION_VALUE}/sessão`}
          </span>
        </div>
      )}

      {renew && (
        <p className="rounded-2xl border border-orange/20 bg-orange/10 px-4 py-3 text-[13px] text-brand">
          Pacote esgotado. Na próxima sessão o paciente precisa pagar a renovação
          (editável se houver imprevisto).
        </p>
      )}

      <div className="rounded-2xl border border-line bg-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {financeEntry
                ? kindFinanceLabel(financeEntry.kind)
                : renew
                  ? "Renovação de pacote"
                  : "Sessão"}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-brand">
              {appointment.type}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              {appointment.start} – {appointment.end}
              {financeEntry?.method ? ` · ${financeEntry.method}` : ""}
            </p>
          </div>
          {isPaid && <PaidMark className="size-7 text-[13px]" />}
        </div>
        <p className="mt-4 text-2xl font-bold tabular-nums text-brand">
          {financeEntry?.kind === "consumo_pacote"
            ? "1 crédito"
            : formatBRL(amount)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {!isPaid && (
          <button
            type="button"
            onClick={handleReceive}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-[13px] font-bold text-brand transition-opacity hover:opacity-90"
          >
            <Check className="size-4" />
            Registrar recebimento
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-bg py-3 text-[13px] font-semibold text-brand"
        >
          Editar recebimento
        </button>
        {isPaid && (
          <p className="text-center text-[12px] font-medium text-muted">
            Recebimento confirmado — você ainda pode editar.
          </p>
        )}
      </div>

      {editOpen && (
        <ChargeEditDrawer
          charge={editCharge}
          onClose={() => setEditOpen(false)}
          onSave={(charge) => {
            saveCharge(charge);
            setEditOpen(false);
          }}
          onDelete={
            financeEntry
              ? (id) => {
                  removeCharge(id);
                  onDelete?.(id);
                  setEditOpen(false);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
