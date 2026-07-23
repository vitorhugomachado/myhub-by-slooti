import type { Patient as DbPatient } from "@/generated/prisma";
import type { Patient } from "@/lib/patients";
import type { FinanceCharge } from "@/lib/finance";
import type { ScheduleItem } from "@/lib/schedule";
import type { PsychologistProfile } from "@/lib/profile";
import type { Pendency } from "@/lib/pendencies";
import type { SessionReport } from "@/lib/session-reports";

export function toPatient(p: DbPatient): Patient {
  return {
    id: p.id,
    avatar: p.avatar,
    fullName: p.fullName,
    socialName: p.socialName,
    email: p.email,
    phone: p.phone,
    whatsapp: p.whatsapp,
    birthDate: p.birthDate,
    cpf: p.cpf,
    rg: p.rg,
    gender: p.gender,
    maritalStatus: p.maritalStatus,
    zip: p.zip,
    street: p.street,
    number: p.number,
    complement: p.complement,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    emergencyName: p.emergencyName,
    emergencyPhone: p.emergencyPhone,
    emergencyRelation: p.emergencyRelation,
    isMinor: p.isMinor,
    guardianName: p.guardianName,
    guardianCpf: p.guardianCpf,
    guardianPhone: p.guardianPhone,
    chiefComplaint: p.chiefComplaint,
    clinicalHistory: p.clinicalHistory,
    medications: p.medications,
    allergies: p.allergies,
    diagnosis: p.diagnosis,
    approach: p.approach,
    referralSource: p.referralSource,
    status: p.status as Patient["status"],
    preferredMode: p.preferredMode as Patient["preferredMode"],
    sessionFrequency: p.sessionFrequency,
    sessionValue: p.sessionValue,
    paymentMethod: p.paymentMethod as Patient["paymentMethod"],
    billingMode: p.billingMode as Patient["billingMode"],
    packageSize: p.packageSize,
    creditsLeft: p.creditsLeft,
    packagePrice: p.packagePrice,
    renewalDue: p.renewalDue,
    lgpdConsent: p.lgpdConsent,
    notes: p.notes,
    startedAt: p.startedAt,
    createdAt: p.createdAt,
  };
}

export function patientWriteData(p: Partial<Patient> & { fullName: string }) {
  return {
    avatar: p.avatar ?? "",
    fullName: p.fullName,
    socialName: p.socialName ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    whatsapp: p.whatsapp ?? "",
    birthDate: p.birthDate ?? "",
    cpf: p.cpf ?? "",
    rg: p.rg ?? "",
    gender: p.gender ?? "",
    maritalStatus: p.maritalStatus ?? "",
    zip: p.zip ?? "",
    street: p.street ?? "",
    number: p.number ?? "",
    complement: p.complement ?? "",
    neighborhood: p.neighborhood ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    emergencyName: p.emergencyName ?? "",
    emergencyPhone: p.emergencyPhone ?? "",
    emergencyRelation: p.emergencyRelation ?? "",
    isMinor: Boolean(p.isMinor),
    guardianName: p.guardianName ?? "",
    guardianCpf: p.guardianCpf ?? "",
    guardianPhone: p.guardianPhone ?? "",
    chiefComplaint: p.chiefComplaint ?? "",
    clinicalHistory: p.clinicalHistory ?? "",
    medications: p.medications ?? "",
    allergies: p.allergies ?? "",
    diagnosis: p.diagnosis ?? "",
    approach: p.approach ?? "TCC",
    referralSource: p.referralSource ?? "",
    status: p.status ?? "ativo",
    preferredMode: p.preferredMode ?? "Online",
    sessionFrequency: p.sessionFrequency ?? "Semanal",
    sessionValue: p.sessionValue ?? "",
    paymentMethod: p.paymentMethod ?? "Pix",
    billingMode: p.billingMode ?? "avulso",
    packageSize: p.packageSize ?? "4",
    creditsLeft: p.creditsLeft ?? "0",
    packagePrice: p.packagePrice ?? "",
    renewalDue: Boolean(p.renewalDue),
    lgpdConsent: Boolean(p.lgpdConsent),
    notes: p.notes ?? "",
    startedAt: p.startedAt ?? new Date().toISOString().slice(0, 10),
    createdAt: p.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

export function toCharge(c: {
  id: string;
  patientName: string;
  patientId: string | null;
  appointmentId: number | null;
  date: string;
  description: string;
  amount: number;
  method: string;
  status: string;
  kind: string;
  note: string;
  isPackageLastSession: boolean;
}): FinanceCharge {
  return {
    id: c.id,
    patientName: c.patientName,
    patientId: c.patientId ?? undefined,
    appointmentId: c.appointmentId ?? undefined,
    date: c.date,
    description: c.description,
    amount: c.amount,
    method: c.method as FinanceCharge["method"],
    status: c.status as FinanceCharge["status"],
    kind: c.kind as FinanceCharge["kind"],
    note: c.note,
    isPackageLastSession: c.isPackageLastSession,
  };
}

export function toAppointment(a: {
  id: number;
  date: string;
  start: string;
  end: string;
  patient: string;
  type: string;
  mode: string;
  status: string;
  avatar: string;
}): ScheduleItem {
  return {
    id: a.id,
    date: a.date,
    start: a.start,
    end: a.end,
    patient: a.patient,
    type: a.type,
    mode: a.mode as ScheduleItem["mode"],
    status: a.status as ScheduleItem["status"],
    avatar: a.avatar,
  };
}

export function toProfile(data: unknown): PsychologistProfile {
  return data as PsychologistProfile;
}

export function toPendency(p: {
  id: string;
  type: string;
  patientName: string;
  patientId: string | null;
  appointmentId: number | null;
  status: string;
  createdAt: Date;
}): Pendency {
  return {
    id: p.id,
    type: p.type as Pendency["type"],
    patientName: p.patientName,
    patientId: p.patientId ?? undefined,
    appointmentId: p.appointmentId ?? 0,
    status: p.status as Pendency["status"],
    createdAt: p.createdAt.toISOString(),
  };
}

export function toReport(r: {
  id: string;
  appointmentId: number | null;
  patientName: string;
  date: string;
  start: string;
  summary: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}): SessionReport {
  return {
    id: r.id,
    appointmentId: r.appointmentId ?? 0,
    patientName: r.patientName,
    date: r.date,
    start: r.start,
    end: "",
    summary: r.summary,
    evolution: r.content,
    nextSteps: "",
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
