import {
  loadPatients,
  type BillingMode,
  type Patient,
} from "@/lib/patients";

export function billingModeLabel(mode: BillingMode) {
  return mode === "pacote" ? "Pacote" : "Avulso";
}

/** Créditos restantes do pacote (número). */
export function packageCreditsLeft(patient: Patient | null | undefined) {
  if (!patient || patient.billingMode !== "pacote") return 0;
  const n = Number(patient.creditsLeft || 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Renovar só quando não há sessões/créditos em aberto.
 * `renewalDue` sozinho não basta se ainda houver crédito (estado inconsistente).
 */
export function needsPackageRenewal(patient: Patient | null | undefined) {
  if (!patient || patient.billingMode !== "pacote") return false;
  return packageCreditsLeft(patient) <= 0;
}

/** Alinha renewalDue com créditos (evita badge “Renovar” com sessão em haver). */
export function syncPackageRenewalFlag(patient: Patient): Patient {
  if (patient.billingMode !== "pacote") {
    return { ...patient, renewalDue: false };
  }
  const credits = packageCreditsLeft(patient);
  return {
    ...patient,
    creditsLeft: String(credits),
    renewalDue: credits <= 0,
  };
}

export function patientBillingBadge(patient: Patient): {
  label: string;
  tone: "mint" | "warn" | "muted";
} {
  if (patient.billingMode === "pacote") {
    if (needsPackageRenewal(patient)) {
      return { label: "Renovar pacote", tone: "warn" };
    }
    const left = packageCreditsLeft(patient);
    return {
      label: `${left} crédito${left === 1 ? "" : "s"}`,
      tone: "mint",
    };
  }
  return { label: "Avulso", tone: "muted" };
}

export function findPatientByName(name: string): Patient | null {
  const list = loadPatients();
  return (
    list.find((p) => p.fullName.toLowerCase() === name.toLowerCase()) ?? null
  );
}

export function findPatientById(id: string): Patient | null {
  return loadPatients().find((p) => p.id === id) ?? null;
}
