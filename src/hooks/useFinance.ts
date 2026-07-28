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
  upsertCharge,
  type FinanceCharge,
  type FinanceMethod,
} from "@/lib/finance";
import {
  ensurePatientByName,
  loadPatients,
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
  if (!patientsRes.ok) {
    throw new Error("finance_fetch_failed");
  }
  const patients = (await patientsRes.json()) as { patients: Patient[] };
  savePatients(patients.patients, { silent: true });

  if (financeRes.status === 403) {
    saveFinance([], { silent: true });
    return { entries: [], patients: patients.patients };
  }
  if (!financeRes.ok) {
    throw new Error("finance_fetch_failed");
  }
  const finance = (await financeRes.json()) as { entries: FinanceCharge[] };
  saveFinance(finance.entries, { silent: true });
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

async function persistPatients(patients: Patient[]) {
  savePatients(patients);
  await fetch("/api/patients", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ patients }),
  });
  window.dispatchEvent(new Event(PATIENTS_EVENT));
}

function syncPatientList(nextPatients: Patient[]) {
  savePatients(nextPatients);
  void persistPatients(nextPatients);
  return nextPatients;
}

export function useFinance() {
  const [entries, setEntries] = useState<FinanceCharge[]>([]);
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
    const onEvent = () => void sync();
    window.addEventListener(FINANCE_EVENT, onEvent);
    window.addEventListener(PATIENTS_EVENT, onEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(FINANCE_EVENT, onEvent);
      window.removeEventListener(PATIENTS_EVENT, onEvent);
    };
  }, []);

  const commitEntries = useCallback((next: FinanceCharge[]) => {
    setEntries(next);
    void persistFinance(next);
  }, []);

  const markPaid = useCallback((id: string) => {
    setEntries((prev) => {
      const previous = prev.find((e) => e.id === id);
      const next = prev.map((e) =>
        e.id === id ? { ...e, status: "pago" as const } : e,
      );
      const updated = next.find((e) => e.id === id);
      if (updated) {
        setPatients((plist) =>
          syncPatientList(applyChargeEditSideEffects(plist, updated, previous)),
        );
      }
      void persistFinance(next);
      return next;
    });
  }, []);

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
        let nextPatients = loadPatients();
        if (result.patient) {
          ensurePatientSaved(result.patient);
          nextPatients = loadPatients();
        }
        const updated = findEntryForAppointment(result.entries, appointment.id, {
          date: appointment.date,
          patientName: appointment.patient,
        });
        if (updated) {
          if (previous) {
            nextPatients = applyChargeEditSideEffects(
              nextPatients,
              updated,
              previous,
            );
          } else if (
            updated.kind === "renovacao_pacote" &&
            updated.status === "pago"
          ) {
            nextPatients = applyChargeEditSideEffects(nextPatients, updated, {
              ...updated,
              status: "pendente",
            });
          }
        }
        setPatients(syncPatientList(nextPatients));
        void persistFinance(result.entries);
        return result.entries;
      });
    },
    [],
  );

  const saveCharge = useCallback((charge: FinanceCharge) => {
    setEntries((prev) => {
      const previous = prev.find((e) => e.id === charge.id);
      const next = upsertCharge(prev, charge);
      setPatients((plist) =>
        syncPatientList(applyChargeEditSideEffects(plist, charge, previous)),
      );
      void persistFinance(next);
      return next;
    });
  }, []);

  const createCharge = useCallback((charge: FinanceCharge) => {
    setEntries((prev) => {
      const next = [...prev, charge];
      setPatients((plist) =>
        syncPatientList(
          applyChargeEditSideEffects(
            plist,
            charge,
            charge.kind === "consumo_pacote"
              ? { ...charge, kind: "sessao_avulsa" }
              : undefined,
          ),
        ),
      );
      void persistFinance(next);
      return next;
    });
  }, []);

  const removeCharge = useCallback((chargeId: string) => {
    setEntries((prev) => {
      const removed = prev.find((e) => e.id === chargeId);
      const next = deleteCharge(prev, chargeId);
      if (removed) {
        setPatients((plist) =>
          syncPatientList(applyChargeDeleteSideEffects(plist, removed)),
        );
      }
      void persistFinance(next);
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
      if (result.patient) {
        ensurePatientSaved(result.patient);
        setPatients(syncPatientList(loadPatients()));
      }
      void persistFinance(result.entries);
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
