"use client";

import { useCallback, useEffect, useState } from "react";
import { findPatientByName } from "@/lib/billing";
import type { DatedAppointment } from "@/lib/agenda";
import {
  applyChargeEditSideEffects,
  applySessionBilling,
  ensurePatientSaved,
  FINANCE_EVENT,
  findEntryForAppointment,
  isAppointmentPaid,
  loadFinance,
  markAppointmentReceived,
  saveFinance,
  seedFinance,
  upsertCharge,
  type FinanceCharge,
  type FinanceMethod,
} from "@/lib/finance";
import { PATIENTS_EVENT, loadPatients, type Patient } from "@/lib/patients";

export function useFinance() {
  const [entries, setEntries] = useState<FinanceCharge[]>(seedFinance);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function syncFinance() {
      setEntries(loadFinance());
    }
    function syncPatients() {
      setPatients(loadPatients());
    }
    syncFinance();
    syncPatients();
    setHydrated(true);
    window.addEventListener(FINANCE_EVENT, syncFinance);
    window.addEventListener("storage", syncFinance);
    window.addEventListener(PATIENTS_EVENT, syncPatients);
    window.addEventListener("storage", syncPatients);
    return () => {
      window.removeEventListener(FINANCE_EVENT, syncFinance);
      window.removeEventListener("storage", syncFinance);
      window.removeEventListener(PATIENTS_EVENT, syncPatients);
      window.removeEventListener("storage", syncPatients);
    };
  }, []);

  const markPaid = useCallback((id: string) => {
    setEntries((prev) => {
      const previous = prev.find((e) => e.id === id);
      const next = prev.map((e) =>
        e.id === id ? { ...e, status: "pago" as const } : e,
      );
      const updated = next.find((e) => e.id === id);
      if (updated) applyChargeEditSideEffects(updated, previous);
      saveFinance(next);
      return next;
    });
  }, []);

  const receiveAppointment = useCallback(
    (
      appointment: DatedAppointment,
      defaults?: { amount?: number; method?: FinanceMethod },
    ) => {
      setEntries((prev) => {
        const previous = findEntryForAppointment(prev, appointment.id, {
          date: appointment.date,
          patientName: appointment.patient,
        });
        const next = markAppointmentReceived(prev, appointment, defaults);
        const updated = findEntryForAppointment(next, appointment.id, {
          date: appointment.date,
          patientName: appointment.patient,
        });
        if (updated) applyChargeEditSideEffects(updated, previous);
        saveFinance(next);
        return next;
      });
    },
    [],
  );

  const saveCharge = useCallback((charge: FinanceCharge) => {
    setEntries((prev) => {
      const previous = prev.find((e) => e.id === charge.id);
      const next = upsertCharge(prev, charge);
      applyChargeEditSideEffects(charge, previous);
      saveFinance(next);
      return next;
    });
  }, []);

  const createCharge = useCallback((charge: FinanceCharge) => {
    setEntries((prev) => {
      const next = [...prev, charge];
      applyChargeEditSideEffects(charge, undefined);
      saveFinance(next);
      return next;
    });
  }, []);

  const billSession = useCallback((appointment: DatedAppointment) => {
    const patient = findPatientByName(appointment.patient);
    setEntries((prev) => {
      const result = applySessionBilling(prev, appointment, patient);
      if (result.patient) ensurePatientSaved(result.patient);
      saveFinance(result.entries);
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
    (p) => p.billingMode === "pacote" && (p.renewalDue || Number(p.creditsLeft) <= 0),
  ).length;

  return {
    entries,
    patients,
    hydrated,
    markPaid,
    receiveAppointment,
    saveCharge,
    createCharge,
    billSession,
    paid,
    entryFor,
    patientByName,
    renewalCount,
  };
}
