import { isValidBirthDate } from "@/lib/dates";
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

export function validatePatient(form: PatientFormData): PatientValidation {
  const errors: PatientValidation["errors"] = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Informe o nome completo.";
  }

  if (form.email.trim() && !form.email.includes("@")) {
    errors.email = "E-mail inválido.";
  }

  if (form.phone.trim() && onlyDigits(form.phone).length < 10) {
    errors.phone = "Telefone inválido.";
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

  if (!form.lgpdConsent) {
    errors.lgpdConsent = "É necessário o consentimento LGPD para salvar.";
  }

  if (form.isMinor) {
    if (!form.guardianName.trim()) {
      errors.guardianName = "Informe o responsável do menor.";
    }
    if (form.guardianCpf.trim() && !isValidCpf(form.guardianCpf)) {
      errors.guardianCpf = "CPF do responsável inválido.";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}
