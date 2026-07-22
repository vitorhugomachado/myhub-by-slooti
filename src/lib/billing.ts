import {
  loadPatients,
  type BillingMode,
  type Patient,
} from "@/lib/patients";

export function billingModeLabel(mode: BillingMode) {
  return mode === "pacote" ? "Pacote" : "Avulso";
}

export function patientBillingBadge(patient: Patient): {
  label: string;
  tone: "mint" | "warn" | "muted";
} {
  if (patient.billingMode === "pacote") {
    if (patient.renewalDue || Number(patient.creditsLeft || 0) <= 0) {
      return { label: "Renovar pacote", tone: "warn" };
    }
    const left = Number(patient.creditsLeft || 0);
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

export function needsPackageRenewal(patient: Patient | null | undefined) {
  if (!patient || patient.billingMode !== "pacote") return false;
  return patient.renewalDue || Number(patient.creditsLeft || 0) <= 0;
}
