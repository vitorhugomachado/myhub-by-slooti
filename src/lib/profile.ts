import { DEFAULT_AVATAR, resolveAvatar } from "@/lib/avatar";
import { isValidBirthDate } from "@/lib/dates";
import { currentUser } from "@/lib/mock-data";
import { readUserStorage, writeUserStorage } from "@/lib/user-storage";

export const PROFILE_KEY = "myhub_profile_v1";
export const PROFILE_EVENT = "myhub:profile";

export type PersonType = "PF" | "PJ";

export type PsychologistProfile = {
  // Conta / identidade
  fullName: string;
  socialName: string;
  email: string;
  phone: string;
  whatsapp: string;
  birthDate: string;
  cpf: string;
  avatar: string;

  // Identidade profissional (prontuário / documentos)
  title: string;
  crpNumber: string;
  crpUf: string;
  specialty: string;
  approach: string;
  signatureName: string;

  // Fiscal (Receita Saúde)
  personType: PersonType;
  cnpj: string;
  companyName: string;
  clinicName: string;
  municipalRegistration: string;
  pixKey: string;

  // Endereço do consultório / prestador
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const BRAZIL_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const SPECIALTIES = [
  "Psicologia Clínica",
  "Psicologia Organizacional",
  "Neuropsicologia",
  "Psicopedagogia",
  "Psicologia Infantil",
  "Psicologia do Esporte",
  "Outra",
] as const;

export const APPROACHES = [
  "TCC",
  "Psicanálise",
  "Humanista",
  "Sistêmica",
  "Gestalt",
  "Outra",
] as const;

export function defaultProfile(): PsychologistProfile {
  return {
    fullName: currentUser.name,
    socialName: "",
    email: currentUser.email,
    phone: "",
    whatsapp: "",
    birthDate: "",
    cpf: "",
    avatar: DEFAULT_AVATAR,
    title: "Psicóloga",
    crpNumber: "",
    crpUf: "SP",
    specialty: "Psicologia Clínica",
    approach: "TCC",
    signatureName: currentUser.name,
    personType: "PF",
    cnpj: "",
    companyName: "",
    clinicName: "",
    municipalRegistration: "",
    pixKey: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "SP",
  };
}

export function loadProfile(): PsychologistProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = readUserStorage(PROFILE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<PsychologistProfile>;
    return { ...defaultProfile(), ...parsed, avatar: resolveAvatar(parsed.avatar) };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: PsychologistProfile) {
  writeUserStorage(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatZip(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(cpf: string) {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === Number(d[10]);
}

function isValidCnpj(cnpj: string) {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (base: string, factors: number[]) => {
    const sum = factors.reduce((acc, f, i) => acc + Number(base[i]) * f, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const f1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const f2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(d, f1);
  const d2 = calc(d + String(d1), f2);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export type ProfileValidation = {
  ok: boolean;
  errors: Partial<Record<keyof PsychologistProfile, string>>;
  missingForReceita: string[];
  missingForDocs: string[];
};

export function validateProfile(profile: PsychologistProfile): ProfileValidation {
  const errors: ProfileValidation["errors"] = {};

  if (!profile.fullName.trim()) errors.fullName = "Informe o nome completo.";
  if (!profile.email.trim() || !profile.email.includes("@")) {
    errors.email = "Informe um e-mail válido.";
  }
  if (!profile.phone.trim() || onlyDigits(profile.phone).length < 10) {
    errors.phone = "Informe um telefone válido.";
  }
  if (!profile.cpf.trim()) {
    errors.cpf = "CPF é obrigatório para Receita Saúde.";
  } else if (!isValidCpf(profile.cpf)) {
    errors.cpf = "CPF inválido.";
  }
  if (profile.birthDate.trim() && !isValidBirthDate(profile.birthDate)) {
    errors.birthDate = "Data de nascimento inválida.";
  }
  if (!profile.crpNumber.trim()) {
    errors.crpNumber = "CRP é obrigatório em prontuários e documentos.";
  }
  if (!profile.crpUf.trim()) errors.crpUf = "Informe a UF do CRP.";
  if (!profile.city.trim()) errors.city = "Informe a cidade do consultório.";
  if (!profile.state.trim()) errors.state = "Informe o estado.";
  if (!profile.zip.trim() || onlyDigits(profile.zip).length !== 8) {
    errors.zip = "CEP inválido.";
  }
  if (!profile.street.trim()) errors.street = "Informe a rua/avenida.";
  if (!profile.number.trim()) errors.number = "Informe o número.";

  if (profile.personType === "PJ") {
    if (!profile.cnpj.trim()) {
      errors.cnpj = "CNPJ é obrigatório para pessoa jurídica.";
    } else if (!isValidCnpj(profile.cnpj)) {
      errors.cnpj = "CNPJ inválido.";
    }
    if (!profile.companyName.trim()) {
      errors.companyName = "Informe a razão social.";
    }
  }

  const missingForReceita: string[] = [];
  if (!profile.fullName.trim()) missingForReceita.push("Nome");
  if (!isValidCpf(profile.cpf)) missingForReceita.push("CPF");
  if (!profile.city.trim() || !profile.state.trim()) {
    missingForReceita.push("Endereço do prestador");
  }
  if (profile.personType === "PJ" && !isValidCnpj(profile.cnpj)) {
    missingForReceita.push("CNPJ");
  }

  const missingForDocs: string[] = [];
  if (!profile.fullName.trim()) missingForDocs.push("Nome");
  if (!profile.crpNumber.trim() || !profile.crpUf.trim()) {
    missingForDocs.push("CRP");
  }
  if (!profile.signatureName.trim()) missingForDocs.push("Nome na assinatura");

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    missingForReceita,
    missingForDocs,
  };
}

export function profileDisplayName(profile: PsychologistProfile) {
  return profile.socialName.trim() || profile.fullName.trim() || currentUser.name;
}

export function profileCrpLabel(profile: PsychologistProfile) {
  if (!profile.crpNumber.trim()) return "";
  return `CRP ${profile.crpUf}/${profile.crpNumber}`.replace("//", "/");
}
