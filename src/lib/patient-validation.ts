import {
  isMinorBirthDate,
  isValidBirthDate,
  isValidIsoDate,
} from "@/lib/dates";
import { isValidCpf } from "@/lib/profile";
import type { Patient } from "@/lib/patients";

export type PatientFormData = Omit<Patient, "id" | "createdAt" | "avatar">;

export type PatientValidation = {
  ok: boolean;
  errors: Partial<Record<keyof PatientFormData | "form", string>>;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidMoney(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return true;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return false;
  return Number(normalized) >= 0;
}

function isValidPositiveInt(value: string) {
  const digits = value.trim();
  if (!digits) return true;
  if (!/^\d+$/.test(digits)) return false;
  return Number(digits) >= 0;
}

export function toPatientFormData(
  patient: Patient | PatientFormData,
): PatientFormData {
  if ("id" in patient) {
    const { id: _id, createdAt: _c, avatar: _a, ...rest } = patient as Patient;
    return rest;
  }
  return patient;
}

/** Validação estrutural para persistência no backend (sem exigir LGPD). */
export function validatePatientFields(form: PatientFormData): PatientValidation {
  const errors: PatientValidation["errors"] = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Informe o nome completo.";
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "E-mail inválido.";
  }

  if (form.phone.trim() && onlyDigits(form.phone).length < 10) {
    errors.phone = "Telefone inválido.";
  }

  if (form.whatsapp.trim() && onlyDigits(form.whatsapp).length < 10) {
    errors.whatsapp = "WhatsApp inválido.";
  }

  if (form.cpf.trim() && !isValidCpf(form.cpf)) {
    errors.cpf = "CPF inválido.";
  }

  if (form.birthDate.trim() && !isValidBirthDate(form.birthDate)) {
    errors.birthDate = "Data de nascimento inválida.";
  }

  if (form.zip.trim() && onlyDigits(form.zip).length !== 8) {
    errors.zip = "CEP inválido.";
  }

  if (form.state.trim() && form.state.trim().length !== 2) {
    errors.state = "UF inválida.";
  }

  if (
    form.emergencyPhone.trim() &&
    onlyDigits(form.emergencyPhone).length < 10
  ) {
    errors.emergencyPhone = "Telefone de emergência inválido.";
  }

  if (form.startedAt.trim() && !isValidIsoDate(form.startedAt)) {
    errors.startedAt = "Data de início inválida.";
  }

  if (!isValidMoney(form.sessionValue)) {
    errors.sessionValue = "Valor da sessão inválido.";
  }

  if (form.billingMode === "pacote") {
    if (form.packageSize.trim() && !isValidPositiveInt(form.packageSize)) {
      errors.packageSize = "Sessões do pacote inválidas.";
    }
    if (!isValidMoney(form.packagePrice)) {
      errors.packagePrice = "Preço do pacote inválido.";
    }
    if (form.creditsLeft.trim() && !isValidPositiveInt(form.creditsLeft)) {
      errors.creditsLeft = "Créditos inválidos.";
    }
  }

  if (form.isMinor) {
    if (form.guardianCpf.trim() && !isValidCpf(form.guardianCpf)) {
      errors.guardianCpf = "CPF do responsável inválido.";
    }
    if (
      form.guardianPhone.trim() &&
      onlyDigits(form.guardianPhone).length < 10
    ) {
      errors.guardianPhone = "Telefone do responsável inválido.";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePatient(form: PatientFormData): PatientValidation {
  const base = validatePatientFields(form);
  const errors: PatientValidation["errors"] = { ...base.errors };

  if (!form.fullName.trim()) {
    errors.fullName = "Informe o nome completo.";
  } else if (form.fullName.trim().length < 3) {
    errors.fullName = "Nome muito curto.";
  }

  if (form.billingMode === "pacote") {
    if (
      !form.packageSize.trim() ||
      !isValidPositiveInt(form.packageSize) ||
      Number(form.packageSize) < 1
    ) {
      errors.packageSize = "Informe quantas sessões tem o pacote.";
    }
  }

  if (!form.lgpdConsent) {
    errors.lgpdConsent = "É necessário o consentimento LGPD para salvar.";
  }

  const minor =
    form.isMinor ||
    (Boolean(form.birthDate.trim()) &&
      isValidBirthDate(form.birthDate) &&
      isMinorBirthDate(form.birthDate));

  if (minor && !form.guardianName.trim()) {
    errors.guardianName = "Informe o responsável do menor.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}
