import { DEFAULT_AVATAR } from "@/lib/avatar";
import { readUserStorage, writeUserStorage } from "@/lib/user-storage";

export type PatientStatus = "ativo" | "pausado" | "alta";
export type SessionMode = "Presencial" | "Online" | "Híbrido";
export type PaymentMethod = "Pix" | "Cartão" | "Dinheiro" | "Convênio" | "Transferência";
export type BillingMode = "avulso" | "pacote";

export type Patient = {
  id: string;
  avatar: string;
  fullName: string;
  socialName: string;
  email: string;
  phone: string;
  whatsapp: string;
  birthDate: string;
  cpf: string;
  rg: string;
  gender: string;
  maritalStatus: string;
  // endereço
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  // emergência
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  // responsável (menor)
  isMinor: boolean;
  guardianName: string;
  guardianCpf: string;
  guardianPhone: string;
  // clínico
  chiefComplaint: string;
  clinicalHistory: string;
  medications: string;
  allergies: string;
  diagnosis: string;
  approach: string;
  referralSource: string;
  // atendimento / financeiro
  status: PatientStatus;
  preferredMode: SessionMode;
  sessionFrequency: string;
  sessionValue: string;
  paymentMethod: PaymentMethod | "";
  billingMode: BillingMode;
  packageSize: string;
  creditsLeft: string;
  packagePrice: string;
  renewalDue: boolean;
  // consentimento / notas
  lgpdConsent: boolean;
  notes: string;
  startedAt: string;
  createdAt: string;
};

export const emptyPatient = (): Omit<Patient, "id" | "createdAt" | "avatar"> => ({
  fullName: "",
  socialName: "",
  email: "",
  phone: "",
  whatsapp: "",
  birthDate: "",
  cpf: "",
  rg: "",
  gender: "",
  maritalStatus: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  isMinor: false,
  guardianName: "",
  guardianCpf: "",
  guardianPhone: "",
  chiefComplaint: "",
  clinicalHistory: "",
  medications: "",
  allergies: "",
  diagnosis: "",
  approach: "TCC",
  referralSource: "",
  status: "ativo",
  preferredMode: "Online",
  sessionFrequency: "Semanal",
  sessionValue: "",
  paymentMethod: "Pix",
  billingMode: "avulso",
  packageSize: "4",
  creditsLeft: "0",
  packagePrice: "",
  renewalDue: false,
  lgpdConsent: false,
  notes: "",
  startedAt: new Date().toISOString().slice(0, 10),
});

export const seedPatients: Patient[] = [
  {
    id: "p-marina",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=face",
    fullName: "Marina Alves",
    socialName: "",
    email: "marina.alves@email.com",
    phone: "(11) 98888-1122",
    whatsapp: "(11) 98888-1122",
    birthDate: "1994-03-14",
    cpf: "123.456.789-42",
    rg: "12.345.678-9",
    gender: "Feminino",
    maritalStatus: "Solteira",
    zip: "01310-100",
    street: "Av. Paulista",
    number: "1000",
    complement: "Apto 42",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    emergencyName: "Carla Alves",
    emergencyPhone: "(11) 97777-0000",
    emergencyRelation: "Mãe",
    isMinor: false,
    guardianName: "",
    guardianCpf: "",
    guardianPhone: "",
    chiefComplaint: "Ansiedade situacional e dificuldade para dormir.",
    clinicalHistory: "Sem histórico psiquiátrico prévio. Início dos sintomas há 6 meses.",
    medications: "Não faz uso contínuo.",
    allergies: "Nenhuma conhecida.",
    diagnosis: "Hipótese: transtorno de ansiedade generalizada (em avaliação).",
    approach: "TCC",
    referralSource: "Indicação de amiga",
    status: "ativo",
    preferredMode: "Online",
    sessionFrequency: "Semanal",
    sessionValue: "180",
    paymentMethod: "Pix",
    billingMode: "avulso",
    packageSize: "4",
    creditsLeft: "0",
    packagePrice: "",
    renewalDue: false,
    lgpdConsent: true,
    notes: "Primeira avaliação. Boa adesão.",
    startedAt: "2026-01-10",
    createdAt: "2026-01-08",
  },
  {
    id: "p-julia",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=96&h=96&fit=crop&crop=face",
    fullName: "Julia Costa",
    socialName: "",
    email: "julia.costa@email.com",
    phone: "(11) 97777-3344",
    whatsapp: "(11) 97777-3344",
    birthDate: "1988-08-22",
    cpf: "987.654.321-18",
    rg: "98.765.432-1",
    gender: "Feminino",
    maritalStatus: "Casada",
    zip: "04567-000",
    street: "Rua Funchal",
    number: "250",
    complement: "",
    neighborhood: "Vila Olímpia",
    city: "São Paulo",
    state: "SP",
    emergencyName: "Ricardo Costa",
    emergencyPhone: "(11) 96666-1111",
    emergencyRelation: "Cônjuge",
    isMinor: false,
    guardianName: "",
    guardianCpf: "",
    guardianPhone: "",
    chiefComplaint: "Conflitos conjugais e comunicação.",
    clinicalHistory: "Em terapia de casal há 8 meses.",
    medications: "",
    allergies: "",
    diagnosis: "Acompanhamento de casal.",
    approach: "Sistêmica",
    referralSource: "Instagram",
    status: "ativo",
    preferredMode: "Presencial",
    sessionFrequency: "Quinzenal",
    sessionValue: "250",
    paymentMethod: "Cartão",
    billingMode: "pacote",
    packageSize: "4",
    creditsLeft: "1",
    packagePrice: "900",
    renewalDue: false,
    lgpdConsent: true,
    notes: "Sessões quinzenais. Parceiro também participa.",
    startedAt: "2025-11-05",
    createdAt: "2025-11-01",
  },
  {
    id: "p-pedro",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
    fullName: "Pedro Santos",
    socialName: "",
    email: "pedro.santos@email.com",
    phone: "(11) 96666-5566",
    whatsapp: "(11) 96666-5566",
    birthDate: "1990-12-05",
    cpf: "456.789.123-77",
    rg: "45.678.912-3",
    gender: "Masculino",
    maritalStatus: "Solteiro",
    zip: "04038-001",
    street: "Rua Domingos de Morais",
    number: "1500",
    complement: "Sala 3",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
    emergencyName: "Ana Santos",
    emergencyPhone: "(11) 95555-2222",
    emergencyRelation: "Irmã",
    isMinor: false,
    guardianName: "",
    guardianCpf: "",
    guardianPhone: "",
    chiefComplaint: "Retorno de acompanhamento cognitivo-comportamental.",
    clinicalHistory: "Já fez TCC em 2023. Relata melhora parcial.",
    medications: "Sertralina 50mg (prescrição médica).",
    allergies: "Dipirona",
    diagnosis: "Transtorno depressivo leve / ansiedade.",
    approach: "TCC",
    referralSource: "Psiquiatra",
    status: "ativo",
    preferredMode: "Híbrido",
    sessionFrequency: "Semanal",
    sessionValue: "200",
    paymentMethod: "Pix",
    billingMode: "pacote",
    packageSize: "4",
    creditsLeft: "0",
    packagePrice: "800",
    renewalDue: true,
    lgpdConsent: true,
    notes: "Bom insight. Trabalhar adesão à rotina.",
    startedAt: "2025-08-12",
    createdAt: "2025-08-10",
  },
  {
    id: "p-roberto",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
    fullName: "Roberto Lima",
    socialName: "",
    email: "roberto.lima@email.com",
    phone: "(11) 95555-7788",
    whatsapp: "(11) 95555-7788",
    birthDate: "1985-06-18",
    cpf: "321.654.987-00",
    rg: "32.165.498-7",
    gender: "Masculino",
    maritalStatus: "Divorciado",
    zip: "05422-000",
    street: "Rua Teodoro Sampaio",
    number: "800",
    complement: "",
    neighborhood: "Pinheiros",
    city: "São Paulo",
    state: "SP",
    emergencyName: "Marcos Lima",
    emergencyPhone: "(11) 94444-3333",
    emergencyRelation: "Irmão",
    isMinor: false,
    guardianName: "",
    guardianCpf: "",
    guardianPhone: "",
    chiefComplaint: "Estresse no trabalho e irritabilidade.",
    clinicalHistory: "Burnout em 2024.",
    medications: "",
    allergies: "",
    diagnosis: "Estresse ocupacional.",
    approach: "TCC",
    referralSource: "RH da empresa",
    status: "pausado",
    preferredMode: "Online",
    sessionFrequency: "Semanal",
    sessionValue: "180",
    paymentMethod: "Convênio",
    billingMode: "avulso",
    packageSize: "4",
    creditsLeft: "0",
    packagePrice: "",
    renewalDue: false,
    lgpdConsent: true,
    notes: "Pausou temporariamente por viagem.",
    startedAt: "2025-09-01",
    createdAt: "2025-08-28",
  },
];

export const STORAGE_KEY = "myhub_patients_v1";
export const PATIENTS_EVENT = "myhub:patients";

export function normalizePatient(
  p: Partial<Patient> & Pick<Patient, "id" | "fullName">,
): Patient {
  const base = emptyPatient();
  return {
    ...base,
    ...p,
    id: p.id,
    fullName: p.fullName,
    avatar: p.avatar || DEFAULT_AVATAR,
    createdAt: p.createdAt ?? new Date().toISOString().slice(0, 10),
    billingMode: p.billingMode ?? "avulso",
    packageSize: p.packageSize ?? "4",
    creditsLeft: p.creditsLeft ?? "0",
    packagePrice: p.packagePrice ?? "",
    renewalDue: Boolean(p.renewalDue),
  };
}

export function loadPatients(): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readUserStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Patient[];
    return Array.isArray(parsed) ? parsed.map((p) => normalizePatient(p)) : [];
  } catch {
    return [];
  }
}

export function savePatients(
  patients: Patient[],
  opts?: { silent?: boolean },
) {
  writeUserStorage(STORAGE_KEY, JSON.stringify(patients));
  if (!opts?.silent) {
    window.dispatchEvent(new Event(PATIENTS_EVENT));
  }
}

export function ensurePatientSaved(patient: Patient) {
  const patients = loadPatients();
  const idx = patients.findIndex((p) => p.id === patient.id);
  if (idx < 0) {
    savePatients([patient, ...patients]);
    return;
  }
  const list = [...patients];
  list[idx] = patient;
  savePatients(list);
}

/** Cria cadastro mínimo se o nome da agenda ainda não existir. */
export function ensurePatientByName(
  fullName: string,
  opts?: { avatar?: string },
): Patient {
  const list = loadPatients();
  const existing = list.find(
    (p) => p.fullName.toLowerCase() === fullName.trim().toLowerCase(),
  );
  if (existing) return existing;

  const slug = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const stub = normalizePatient({
    id: `p-${slug || "paciente"}-${Date.now().toString(36)}`,
    fullName: fullName.trim(),
    avatar: opts?.avatar || DEFAULT_AVATAR,
    notes:
      "Cadastro criado a partir da agenda. Complete os dados do paciente.",
  });
  savePatients([stub, ...list]);
  return stub;
}

export function formatDateBr(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatPatientSince(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const label = d.toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
  return label.replace(".", "");
}

export function statusLabel(status: PatientStatus) {
  if (status === "ativo") return "Ativo";
  if (status === "pausado") return "Pausado";
  return "Alta";
}
