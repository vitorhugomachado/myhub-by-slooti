"use client";

import { useCallback, useEffect, useState } from "react";
import { findPatientByName } from "@/lib/billing";
import type { DatedAppointment } from "@/lib/agenda";
import {
  applyChargeDeleteSideEffects,
  applyChargeEditSideEffects,
  applySessionBilling,
  deleteCharge,
  ensurePatientSaved,
  FINANCE_EVENT,
  findEntryForAppointment,
  isAppointmentPaid,
  markAppointmentReceived,
  saveFinance,
  seedFinance,
  upsertCharge,
  type FinanceCharge,
  type FinanceMethod,
} from "@/lib/finance";
import {
  ensurePatientByName,
  PATIENTS_EVENT,
  savePatients,
  type Patient,
} from "@/lib/patients";

async function fetchFinance(): Promise<{
  entries: FinanceCharge[];
  patients: Patient[];
}> {
  const [financeRes, patientsRes] = await Promise.all([
    fetch("/api/finance", { credentials: "include" }),
    fetch("/api/patients", { credentials: "include" }),
  ]);
  if (!financeRes.ok || !patientsRes.ok) {
    throw new Error("finance_fetch_failed");
  }
  const finance = (await financeRes.json()) as { entries: FinanceCharge[] };
  const patients = (await patientsRes.json()) as { patients: Patient[] };
  saveFinance(finance.entries);
  savePatients(patients.patients);
  return { entries: finance.entries, patients: patients.patients };
}

async function persistFinance(entries: FinanceCharge[]) {
  await fetch("/api/finance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ entries }),
  });
  window.dispatchEvent(new Event(FINANCE_EVENT));
}

async function persistPatientsFromLocal() {
  // ensurePatientSaved still writes localStorage; sync full list to API
  const { loadPatients } = await import("@/lib/patients");
  const patients = loadPatients();
  await fetch("/api/patients", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ patients }),
  });
  window.dispatchEvent(new Event(PATIENTS_EVENT));
}

export function useFinance() {
  const [entries, setEntries] = useState<FinanceCharge[]>(seedFinance);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const data = await fetchFinance();
        if (!cancelled) {
          setEntries(data.entries);
          setPatients(data.patients);
        }
      } catch {
        /* ignore until logged in */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void sync();
    window.addEventListener(FINANCE_EVENT, () => void sync());
    window.addEventListener(PATIENTS_EVENT, () => void sync());
    return () => {
      cancelled = true;
    };
  }, []);

  const commitEntries = useCallback((next: FinanceCharge[]) => {
    setEntries(next);
    void persistFinance(next);
  }, []);

  const markPaid = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const previous = prev.find((e) => e.id === id);
        const next = prev.map((e) =>
          e.id === id ? { ...e, status: "pago" as const } : e,
        );
        const updated = next.find((e) => e.id === id);
        if (updated) applyChargeEditSideEffects(updated, previous);
        void persistFinance(next).then(() => persistPatientsFromLocal());
        return next;
      });
    },
    [],
  );

  const receiveAppointment = useCallback(
    (
      appointment: DatedAppointment,
      defaults?: { amount?: number; method?: FinanceMethod },
    ) => {
      setEntries((prev) => {
        const patient =
          findPatientByName(appointment.patient) ??
          ensurePatientByName(appointment.patient, {
            avatar: appointment.avatar,
          });
        const previous = findEntryForAppointment(prev, appointment.id, {
          date: appointment.date,
          patientName: appointment.patient,
        });
        const result = markAppointmentReceived(
          prev,
          appointment,
          patient,
          defaults,
        );
        if (result.patient) ensurePatientSaved(result.patient);
        const updated = findEntryForAppointment(result.entries, appointment.id, {
          date: appointment.date,
          patientName: appointment.patient,
        });
        if (updated) {
          if (previous) {
            applyChargeEditSideEffects(updated, previous);
          } else if (
            updated.kind === "renovacao_pacote" &&
            updated.status === "pago"
          ) {
            applyChargeEditSideEffects(updated, {
              ...updated,
              status: "pendente",
            });
          }
        }
        void persistFinance(result.entries).then(() =>
          persistPatientsFromLocal(),
        );
        return result.entries;
      });
    },
    [],
  );

  const saveCharge = useCallback((charge: FinanceCharge) => {
    setEntries((prev) => {
      const previous = prev.find((e) => e.id === charge.id);
      const next = upsertCharge(prev, charge);
      applyChargeEditSideEffects(charge, previous);
      void persistFinance(next).then(() => persistPatientsFromLocal());
      return next;
    });
  }, []);

  const createCharge = useCallback((charge: FinanceCharge) => {
    setEntries((prev) => {
      const next = [...prev, charge];
      if (charge.kind === "consumo_pacote") {
        applyChargeEditSideEffects(charge, {
          ...charge,
          kind: "sessao_avulsa",
        });
      } else {
        applyChargeEditSideEffects(charge, undefined);
      }
      void persistFinance(next).then(() => persistPatientsFromLocal());
      return next;
    });
  }, []);

  const removeCharge = useCallback((chargeId: string) => {
    setEntries((prev) => {
      const removed = prev.find((e) => e.id === chargeId);
      const next = deleteCharge(prev, chargeId);
      if (removed) applyChargeDeleteSideEffects(removed);
      void persistFinance(next).then(() => persistPatientsFromLocal());
      return next;
    });
  }, []);

  const billSession = useCallback((appointment: DatedAppointment) => {
    const patient =
      findPatientByName(appointment.patient) ??
      ensurePatientByName(appointment.patient, {
        avatar: appointment.avatar,
      });
    setEntries((prev) => {
      const result = applySessionBilling(prev, appointment, patient);
      if (result.patient) ensurePatientSaved(result.patient);
      void persistFinance(result.entries).then(() =>
        persistPatientsFromLocal(),
      );
      return result.entries;
    });
  }, []);

  const paid = useCallback(
    (appointmentId: number, opts?: { date?: string; patientName?: string }) =>
      isAppointmentPaid(entries, appointmentId, opts),
    [entries],
  );

  const entryFor = useCallback(
    (appointmentId: number, opts?: { date?: string; patientName?: string }) =>
      findEntryForAppointment(entries, appointmentId, opts),
    [entries],
  );

  const patientByName = useCallback(
    (name: string) =>
      patients.find((p) => p.fullName.toLowerCase() === name.toLowerCase()) ??
      null,
    [patients],
  );

  const renewalCount = patients.filter(
    (p) =>
      p.billingMode === "pacote" &&
      (p.renewalDue || Number(p.creditsLeft) <= 0),
  ).length;

  return {
    entries,
    patients,
    hydrated,
    markPaid,
    receiveAppointment,
    saveCharge,
    createCharge,
    removeCharge,
    billSession,
    paid,
    entryFor,
    patientByName,
    renewalCount,
    commitEntries,
  };
}
