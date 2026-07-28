import type { DatedAppointment } from "@/lib/agenda";
import {
  ensurePatientSaved,
  type BillingMode,
  type Patient,
  type PaymentMethod,
} from "@/lib/patients";
import { readUserStorage, writeUserStorage } from "@/lib/user-storage";

export { ensurePatientSaved };

export type ChargeKind =
  | "sessao_avulsa"
  | "consumo_pacote"
  | "renovacao_pacote"
  | "isento";

export type PaymentStatus = "pago" | "pendente" | "atrasado" | "isento";

export type FinanceMethod =
  | "Pix"
  | "Cartão"
  | "Dinheiro"
  | "Convênio"
  | "Transferência";

export type FinanceCharge = {
  id: string;
  patientName: string;
  patientId?: string;
  appointmentId?: number;
  date: string;
  description: string;
  amount: number;
  method: FinanceMethod;
  status: PaymentStatus;
  kind: ChargeKind;
  note?: string;
  /** true quando este consumo foi a última sessão do pacote */
  isPackageLastSession?: boolean;
};

/** @deprecated alias — use FinanceCharge */
export type FinanceEntry = FinanceCharge;

export const FINANCE_KEY = "myhub_finance_v3";
export const FINANCE_EVENT = "myhub:finance";
export const DEFAULT_SESSION_VALUE = 180;

export const seedFinance: FinanceCharge[] = [
  {
    id: "f1",
    patientName: "Carla Mendes",
    appointmentId: 1,
    date: "2026-07-22",
    description: "Sessão — Ansiedade",
    amount: 180,
    method: "Pix",
    status: "pago",
    kind: "sessao_avulsa",
  },
  {
    id: "f2",
    patientName: "Roberto Lima",
    patientId: "p-roberto",
    appointmentId: 2,
    date: "2026-07-22",
    description: "Sessão — Terapia Cognitiva",
    amount: 180,
    method: "Convênio",
    status: "pago",
    kind: "sessao_avulsa",
  },
  {
    id: "f3",
    patientName: "Marina Alves",
    patientId: "p-marina",
    appointmentId: 3,
    date: "2026-07-22",
    description: "Sessão — Avaliação inicial",
    amount: 180,
    method: "Pix",
    status: "pendente",
    kind: "sessao_avulsa",
  },
  {
    id: "f4",
    patientName: "Julia Costa",
    patientId: "p-julia",
    date: "2026-07-21",
    description: "Sessão de casal (crédito)",
    amount: 0,
    method: "Cartão",
    status: "pago",
    kind: "consumo_pacote",
  },
  {
    id: "f5",
    patientName: "Pedro Santos",
    patientId: "p-pedro",
    date: "2026-07-20",
    description: "Renovação de pacote",
    amount: 800,
    method: "Pix",
    status: "atrasado",
    kind: "renovacao_pacote",
  },
  {
    id: "f6",
    patientName: "Sofia Martins",
    date: "2026-07-18",
    description: "Avaliação inicial",
    amount: 200,
    method: "Pix",
    status: "pago",
    kind: "sessao_avulsa",
  },
  {
    id: "f7",
    patientName: "Diego Freitas",
    date: "2026-07-17",
    description: "Sessão — TCC",
    amount: 180,
    method: "Transferência",
    status: "pendente",
    kind: "sessao_avulsa",
  },
  {
    id: "f8",
    patientName: "Amanda Reis",
    date: "2026-07-15",
    description: "Sessão — Ansiedade",
    amount: 180,
    method: "Dinheiro",
    status: "pago",
    kind: "sessao_avulsa",
  },
  {
    id: "f9",
    patientName: "Julia Costa",
    patientId: "p-julia",
    date: "2026-07-10",
    description: "Sessão de casal (crédito)",
    amount: 0,
    method: "Cartão",
    status: "pago",
    kind: "consumo_pacote",
  },
  {
    id: "f10",
    patientName: "Pedro Santos",
    patientId: "p-pedro",
    date: "2026-07-08",
    description: "Sessão — Retorno (crédito)",
    amount: 0,
    method: "Pix",
    status: "pago",
    kind: "consumo_pacote",
    isPackageLastSession: true,
  },
];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatFinanceDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}`;
}

export function statusFinanceLabel(status: PaymentStatus) {
  if (status === "pago") return "Pago";
  if (status === "atrasado") return "Atrasado";
  if (status === "isento") return "Isento";
  return "Pendente";
}

export function kindFinanceLabel(kind: ChargeKind) {
  if (kind === "consumo_pacote") return "Crédito do pacote";
  if (kind === "renovacao_pacote") return "Renovação de pacote";
  if (kind === "isento") return "Isento";
  return "Sessão avulsa";
}

function normalizeCharge(raw: Partial<FinanceCharge> & FinanceCharge): FinanceCharge {
  return {
    ...raw,
    kind: raw.kind ?? "sessao_avulsa",
    status: raw.status === "isento" ? "isento" : raw.status,
    note: raw.note ?? "",
  };
}

export function loadFinance(): FinanceCharge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readUserStorage(FINANCE_KEY);
    if (!raw) {
      // migrate v2 if present (scoped; readUserStorage also migrates legacy)
      const legacy = readUserStorage("myhub_finance_v2");
      if (legacy) {
        const parsed = JSON.parse(legacy) as FinanceCharge[];
        if (Array.isArray(parsed) && parsed.length) {
          const migrated = parsed.map((e) =>
            normalizeCharge({
              ...e,
              kind: e.kind ?? "sessao_avulsa",
            }),
          );
          saveFinance(migrated);
          return migrated;
        }
      }
      return [];
    }
    const parsed = JSON.parse(raw) as FinanceCharge[];
    return Array.isArray(parsed) ? parsed.map(normalizeCharge) : [];
  } catch {
    return [];
  }
}

export function saveFinance(
  entries: FinanceCharge[],
  opts?: { silent?: boolean },
) {
  writeUserStorage(FINANCE_KEY, JSON.stringify(entries));
  if (!opts?.silent) {
    window.dispatchEvent(new Event(FINANCE_EVENT));
  }
}

export function findEntryForAppointment(
  entries: FinanceCharge[],
  appointmentId: number,
  opts?: { date?: string; patientName?: string },
) {
  const byId = entries.find((e) => e.appointmentId === appointmentId);
  if (byId) return byId;

  if (opts?.date && opts.patientName) {
    return entries.find(
      (e) => e.date === opts.date && e.patientName === opts.patientName,
    );
  }
  return undefined;
}

/**
 * No calendário financeiro, o $ indica momento de pagamento:
 * - Avulso: em toda sessão
 * - Pacote: só na última sessão do pacote (ou renovação)
 */
export function showsFinanceMoneyIcon(
  patient: Patient | null | undefined,
  entry?: FinanceCharge | null,
): boolean {
  const mode = patient?.billingMode ?? "avulso";

  if (mode !== "pacote") {
    return true;
  }

  if (entry?.kind === "renovacao_pacote") return true;
  if (entry?.kind === "sessao_avulsa") return true;
  if (entry?.isPackageLastSession) return true;

  if (!entry) {
    const credits = Number(patient?.creditsLeft || 0);
    return credits <= 0;
  }

  if (entry.kind === "consumo_pacote") {
    return Boolean(entry.isPackageLastSession);
  }

  return false;
}

export function isChargeSettled(entry: FinanceCharge | undefined) {
  if (!entry) return false;
  return (
    entry.status === "pago" ||
    entry.status === "isento" ||
    entry.kind === "consumo_pacote"
  );
}

export function isAppointmentPaid(
  entries: FinanceCharge[],
  appointmentId: number,
  opts?: { date?: string; patientName?: string },
) {
  return isChargeSettled(findEntryForAppointment(entries, appointmentId, opts));
}

export function upsertCharge(
  entries: FinanceCharge[],
  charge: FinanceCharge,
): FinanceCharge[] {
  const idx = entries.findIndex((e) => e.id === charge.id);
  if (idx >= 0) {
    return entries.map((e, i) => (i === idx ? charge : e));
  }
  const byAppt =
    charge.appointmentId != null
      ? entries.findIndex((e) => e.appointmentId === charge.appointmentId)
      : -1;
  if (byAppt >= 0) {
    return entries.map((e, i) =>
      i === byAppt ? { ...charge, id: e.id } : e,
    );
  }
  return [...entries, charge];
}

/**
 * Recebe pagamento alinhado às regras de pacote/avulso (via applySessionBilling).
 * Não cria mais `sessao_avulsa` às cegas quando o paciente está em pacote.
 */
export function markAppointmentReceived(
  entries: FinanceCharge[],
  appointment: DatedAppointment,
  patient: Patient | null,
  defaults?: { amount?: number; method?: FinanceMethod },
): { entries: FinanceCharge[]; patient: Patient | null } {
  const billed = applySessionBilling(entries, appointment, patient);
  let nextEntries = billed.entries;
  const nextPatient = billed.patient;

  const existing = findEntryForAppointment(nextEntries, appointment.id, {
    date: appointment.date,
    patientName: appointment.patient,
  });

  if (!existing) {
    return { entries: nextEntries, patient: nextPatient };
  }

  if (isChargeSettled(existing)) {
    return { entries: nextEntries, patient: nextPatient };
  }

  nextEntries = nextEntries.map((e) =>
    e.id === existing.id
      ? {
          ...e,
          status: "pago" as const,
          appointmentId: e.appointmentId ?? appointment.id,
          patientId: e.patientId ?? patient?.id,
          amount:
            e.kind === "consumo_pacote"
              ? e.amount
              : (defaults?.amount ?? e.amount),
          method: defaults?.method ?? e.method,
        }
      : e,
  );

  return { entries: nextEntries, patient: nextPatient };
}

export function deleteCharge(
  entries: FinanceCharge[],
  chargeId: string,
): FinanceCharge[] {
  return entries.filter((e) => e.id !== chargeId);
}

export function parseMoney(value: string | number | undefined) {
  if (typeof value === "number") return value;
  if (!value) return DEFAULT_SESSION_VALUE;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : DEFAULT_SESSION_VALUE;
}

export function methodFromPatient(
  method: PaymentMethod | "",
): FinanceMethod {
  return method || "Pix";
}

/**
 * Cria/atualiza cobrança ao finalizar sessão conforme plano do paciente.
 * Também atualiza créditos / renewalDue no cadastro.
 */
export function applySessionBilling(
  entries: FinanceCharge[],
  appointment: DatedAppointment,
  patient: Patient | null,
): { entries: FinanceCharge[]; patient: Patient | null } {
  const existing = findEntryForAppointment(entries, appointment.id, {
    date: appointment.date,
    patientName: appointment.patient,
  });
  if (existing) {
    return { entries, patient };
  }

  const sessionValue = parseMoney(patient?.sessionValue);
  const method = methodFromPatient(patient?.paymentMethod ?? "Pix");
  const mode: BillingMode = patient?.billingMode ?? "avulso";
  const credits = Number(patient?.creditsLeft || 0);

  let nextPatient = patient;
  let charge: FinanceCharge;

  // Enquanto houver crédito, consome — ignora renewalDue “preso”
  if (mode === "pacote" && credits > 0) {
    const left = credits - 1;
    charge = {
      id: `f-appt-${appointment.id}`,
      appointmentId: appointment.id,
      patientId: patient?.id,
      patientName: appointment.patient,
      date: appointment.date,
      description: `Sessão — ${appointment.type} (crédito)`,
      amount: 0,
      method,
      status: "pago",
      kind: "consumo_pacote",
      isPackageLastSession: left <= 0,
    };
    if (patient) {
      nextPatient = {
        ...patient,
        creditsLeft: String(left),
        renewalDue: left <= 0,
      };
    }
  } else if (mode === "pacote") {
    const packagePrice = parseMoney(
      patient?.packagePrice || String(sessionValue * Number(patient?.packageSize || 4)),
    );
    charge = {
      id: `f-appt-${appointment.id}`,
      appointmentId: appointment.id,
      patientId: patient?.id,
      patientName: appointment.patient,
      date: appointment.date,
      description: `Renovação de pacote — ${appointment.type}`,
      amount: packagePrice,
      method,
      status: "pendente",
      kind: "renovacao_pacote",
    };
    if (patient) {
      nextPatient = { ...patient, renewalDue: true, creditsLeft: "0" };
    }
  } else {
    charge = {
      id: `f-appt-${appointment.id}`,
      appointmentId: appointment.id,
      patientId: patient?.id,
      patientName: appointment.patient,
      date: appointment.date,
      description: `Sessão — ${appointment.type}`,
      amount: sessionValue,
      method,
      status: "pendente",
      kind: "sessao_avulsa",
    };
  }

  return {
    entries: upsertCharge(entries, charge),
    patient: nextPatient,
  };
}

/** Ao marcar renovação como paga, restaura créditos do pacote (puro). */
export function applyChargeEditSideEffects(
  patients: Patient[],
  charge: FinanceCharge,
  previous: FinanceCharge | undefined,
): Patient[] {
  if (!charge.patientId) return patients;

  const idx = patients.findIndex((p) => p.id === charge.patientId);
  if (idx < 0) return patients;

  const patient = patients[idx];
  let next = patient;

  const becamePaidRenewal =
    charge.kind === "renovacao_pacote" &&
    charge.status === "pago" &&
    previous?.status !== "pago";

  if (becamePaidRenewal) {
    const size = Number(patient.packageSize || 4);
    next = {
      ...next,
      creditsLeft: String(size),
      renewalDue: false,
      packagePrice: String(charge.amount || patient.packagePrice),
    };
  }

  const switchedToConsume =
    previous != null &&
    charge.kind === "consumo_pacote" &&
    previous.kind !== "consumo_pacote";
  if (switchedToConsume) {
    const credits = Number(next.creditsLeft || 0);
    if (credits > 0) {
      const left = credits - 1;
      next = {
        ...next,
        creditsLeft: String(left),
        renewalDue: left <= 0,
      };
    }
  }

  const switchedFromConsume =
    previous != null &&
    previous.kind === "consumo_pacote" &&
    charge.kind !== "consumo_pacote";
  if (switchedFromConsume) {
    const credits = Number(next.creditsLeft || 0) + 1;
    next = {
      ...next,
      creditsLeft: String(credits),
      renewalDue: false,
    };
  }

  if (next === patient) return patients;
  const list = [...patients];
  list[idx] = next;
  return list;
}

/** Reverte créditos ao excluir um lançamento (puro). */
export function applyChargeDeleteSideEffects(
  patients: Patient[],
  charge: FinanceCharge,
): Patient[] {
  if (!charge.patientId) return patients;

  const idx = patients.findIndex((p) => p.id === charge.patientId);
  if (idx < 0) return patients;

  const patient = patients[idx];
  let next = patient;

  if (charge.kind === "consumo_pacote") {
    const credits = Number(patient.creditsLeft || 0) + 1;
    next = {
      ...patient,
      creditsLeft: String(credits),
      renewalDue: false,
    };
  } else if (
    charge.kind === "renovacao_pacote" &&
    charge.status === "pago"
  ) {
    next = {
      ...patient,
      creditsLeft: "0",
      renewalDue: true,
    };
  }

  if (next === patient) return patients;
  const list = [...patients];
  list[idx] = next;
  return list;
}
