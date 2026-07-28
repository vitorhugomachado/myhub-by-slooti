"use client";

import { Camera, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BirthDateField } from "@/components/shared/BirthDateField";
import { useCepAutofill } from "@/hooks/useCepAutofill";
import { usePendencies } from "@/hooks/usePendencies";
import { formatZip } from "@/lib/address";
import {
  DEFAULT_AVATAR,
  fileToAvatarDataUrl,
  isDefaultAvatar,
  resolveAvatar,
} from "@/lib/avatar";
import { isMinorBirthDate, isValidBirthDate } from "@/lib/dates";
import { validatePatient } from "@/lib/patient-validation";
import { pendencyLabel } from "@/lib/pendencies";
import {
  emptyPatient,
  type BillingMode,
  type Patient,
  type PaymentMethod,
  type SessionMode,
  type PatientStatus,
} from "@/lib/patients";
import { BRAZIL_UFS, formatCpf, formatPhone } from "@/lib/profile";

type FormState = ReturnType<typeof emptyPatient> & { avatar: string };

function emptyPatientForm(): FormState {
  return { ...emptyPatient(), avatar: DEFAULT_AVATAR };
}

const genders = ["Feminino", "Masculino", "Não-binário", "Prefiro não informar", "Outro"];
const marital = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"];
const approaches = ["TCC", "Psicanálise", "Humanista", "Sistêmica", "Gestalt", "Outra"];
const frequencies = ["Semanal", "Quinzenal", "Mensal", "Avulsa"];
const modes: SessionMode[] = ["Online", "Presencial", "Híbrido"];
const payments: PaymentMethod[] = ["Pix", "Cartão", "Dinheiro", "Convênio", "Transferência"];
const statuses: PatientStatus[] = ["ativo", "pausado", "alta"];

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-surface";

const inputErrorClass =
  "w-full rounded-xl border border-danger/50 bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-danger";

export function PatientForm({
  initial,
  onClose,
  onSave,
  lockScroll = true,
  overlayClassName = "z-50",
  title,
  subtitle,
}: {
  initial?: Patient | null;
  onClose: () => void;
  onSave: (data: FormState, id?: string) => void | Promise<void>;
  /** Quando false, não altera overflow do body (útil se outro modal já trava o scroll). */
  lockScroll?: boolean;
  overlayClassName?: string;
  title?: string;
  subtitle?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyPatientForm);
  const [visible, setVisible] = useState(false);
  const [section, setSection] = useState<"dados" | "clinico" | "atendimento">("dados");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _c, ...rest } = initial;
      setForm({
        ...rest,
        avatar: resolveAvatar(initial.avatar),
      });
    } else {
      setForm(emptyPatientForm());
    }
    setTried(false);
    setSaveError("");
    setAvatarError("");
    const frame = requestAnimationFrame(() => setVisible(true));
    if (lockScroll) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      cancelAnimationFrame(frame);
      if (lockScroll) {
        document.body.style.overflow = "";
      }
    };
  }, [initial, lockScroll]);

  const cep = useCepAutofill(form.zip, (address) => {
    setForm((prev) => ({
      ...prev,
      zip: address.zip,
      street: address.street || prev.street,
      neighborhood: address.neighborhood || prev.neighborhood,
      city: address.city || prev.city,
      state: address.state || prev.state,
    }));
  });

  const validation = useMemo(() => {
    const { avatar: _a, ...rest } = form;
    return validatePatient(rest);
  }, [form]);

  const canResetAvatar = !isDefaultAvatar(form.avatar);
  const avatarSrc = resolveAvatar(form.avatar);
  const avatarUnoptimized =
    form.avatar.startsWith("data:") ||
    form.avatar.startsWith("blob:") ||
    avatarSrc.endsWith(".svg");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarBusy(true);
    setAvatarError("");
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      set("avatar", dataUrl);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Falha ao carregar a foto.",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  function resetAvatar() {
    setAvatarError("");
    set("avatar", DEFAULT_AVATAR);
  }

  function parseMoney(value: string) {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  /** Valor da sessão = preço do pacote ÷ sessões. */
  function sessionFromPackage(packagePrice: string, packageSize: string) {
    const price = parseMoney(packagePrice);
    const size = Number(packageSize.trim());
    if (price == null || price < 0 || !Number.isFinite(size) || size < 1) {
      return null;
    }
    const perSession = price / size;
    return (Math.round(perSession * 100) / 100).toString();
  }

  function setPackageField(
    key: "packagePrice" | "packageSize",
    value: string,
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const derived = sessionFromPackage(
        key === "packagePrice" ? value : next.packagePrice,
        key === "packageSize" ? value : next.packageSize,
      );
      if (derived != null) {
        next.sessionValue = derived;
      }
      if (key === "packageSize" && /^\d+$/.test(value.trim())) {
        next.creditsLeft = value.trim();
      }
      return next;
    });
  }

  function setBirthDate(iso: string) {
    setForm((prev) => {
      const next = { ...prev, birthDate: iso };
      if (iso && isValidBirthDate(iso)) {
        next.isMinor = isMinorBirthDate(iso);
      }
      return next;
    });
  }

  function err(key: Exclude<keyof FormState, "avatar">) {
    return tried ? validation.errors[key] : undefined;
  }

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setSaveError("");
    const result = validatePatient(form);
    if (!result.ok) {
      if (
        result.errors.fullName ||
        result.errors.email ||
        result.errors.phone ||
        result.errors.whatsapp ||
        result.errors.cpf ||
        result.errors.birthDate ||
        result.errors.zip ||
        result.errors.state ||
        result.errors.emergencyPhone ||
        result.errors.guardianName ||
        result.errors.guardianCpf ||
        result.errors.guardianPhone
      ) {
        setSection("dados");
      } else if (
        result.errors.lgpdConsent ||
        result.errors.startedAt ||
        result.errors.sessionValue ||
        result.errors.packageSize ||
        result.errors.packagePrice ||
        result.errors.creditsLeft
      ) {
        setSection("atendimento");
      }
      return;
    }

    setSaving(true);
    try {
      await onSave(form, initial?.id);
      handleClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o paciente. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6 ${overlayClassName}`}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={handleClose}
        className={`absolute inset-0 bg-brand/25 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className={`relative z-10 flex max-h-[min(94vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ease-out sm:rounded-[28px] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-brand">
              {title ?? (initial ? "Editar paciente" : "Novo paciente")}
            </h2>
            <p className="mt-0.5 text-[13px] leading-snug text-muted">
              {subtitle ??
                (initial
                  ? "Atualize os dados da ficha"
                  : "Cadastro completo para atendimento clínico")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-muted hover:text-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="shrink-0 px-5 pb-4">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-bg p-1.5">
            {(
              [
                { id: "dados" as const, label: "Dados pessoais" },
                { id: "clinico" as const, label: "Clínico" },
                { id: "atendimento" as const, label: "Atendimento" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={`rounded-xl px-2 py-2.5 text-center text-[12px] font-semibold leading-tight transition-colors sm:text-[13px] ${
                  section === tab.id
                    ? "bg-surface text-brand shadow-sm"
                    : "text-muted hover:text-brand"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto border-t border-line px-5 py-5">
          {section === "dados" && (
            <>
              <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg p-3 sm:flex-row sm:items-center">
                <div className="relative mx-auto shrink-0 sm:mx-0">
                  <Image
                    src={avatarSrc}
                    alt={form.fullName || "Foto do paciente"}
                    width={72}
                    height={72}
                    unoptimized={avatarUnoptimized}
                    className="size-[72px] rounded-full bg-[#E5E7EB] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarBusy}
                    aria-label="Trocar foto"
                    className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-line bg-card text-brand shadow-sm transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    <Camera className="size-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void onAvatarChange(e)}
                  />
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="truncate text-[14px] font-semibold text-brand">
                    {form.fullName || "Foto do paciente"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    JPG, PNG ou WEBP · até 8 MB
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarBusy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft disabled:opacity-50"
                    >
                      <Camera className="size-3.5" />
                      {avatarBusy ? "Carregando…" : "Adicionar foto"}
                    </button>
                    {canResetAvatar ? (
                      <button
                        type="button"
                        onClick={resetAvatar}
                        disabled={avatarBusy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Remover
                      </button>
                    ) : null}
                  </div>
                  {avatarError ? (
                    <p className="mt-1.5 text-[11px] text-danger">{avatarError}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome completo *" error={err("fullName")} className="sm:col-span-2">
                  <input
                    required
                    className={err("fullName") ? inputErrorClass : inputClass}
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Nome civil"
                  />
                </Field>
                <Field label="Nome social">
                  <input
                    className={inputClass}
                    value={form.socialName}
                    onChange={(e) => set("socialName", e.target.value)}
                    placeholder="Se houver"
                  />
                </Field>
                <Field label="Data de nascimento" error={err("birthDate")}>
                  <BirthDateField
                    key={initial?.id ?? "new-patient"}
                    value={form.birthDate}
                    onChange={setBirthDate}
                    error={Boolean(err("birthDate"))}
                  />
                </Field>
                <Field label="CPF" error={err("cpf")}>
                  <input
                    className={err("cpf") ? inputErrorClass : inputClass}
                    value={form.cpf}
                    onChange={(e) => set("cpf", formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="RG">
                  <input
                    className={inputClass}
                    value={form.rg}
                    onChange={(e) => set("rg", e.target.value)}
                  />
                </Field>
                <Field label="Gênero">
                  <select
                    className={inputClass}
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {genders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Estado civil">
                  <select
                    className={inputClass}
                    value={form.maritalStatus}
                    onChange={(e) => set("maritalStatus", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {marital.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="pt-1 text-[12px] font-bold text-brand">Contato</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="E-mail" error={err("email")}>
                  <input
                    type="email"
                    className={err("email") ? inputErrorClass : inputClass}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Telefone" error={err("phone")}>
                  <input
                    className={err("phone") ? inputErrorClass : inputClass}
                    value={form.phone}
                    onChange={(e) => set("phone", formatPhone(e.target.value))}
                    placeholder="(11) 90000-0000"
                    inputMode="tel"
                  />
                </Field>
                <Field label="WhatsApp" error={err("whatsapp")} className="sm:col-span-2">
                  <input
                    className={err("whatsapp") ? inputErrorClass : inputClass}
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", formatPhone(e.target.value))}
                    placeholder="(11) 90000-0000"
                    inputMode="tel"
                  />
                </Field>
              </div>

              <p className="pt-1 text-[12px] font-bold text-brand">Endereço</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="CEP" error={err("zip")}>
                  <input
                    className={err("zip") ? inputErrorClass : inputClass}
                    value={form.zip}
                    onChange={(e) => set("zip", formatZip(e.target.value))}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                  {cep.message ? (
                    <span
                      className={`mt-1 block text-[11px] ${
                        cep.status === "error" ? "text-danger" : "text-muted"
                      }`}
                    >
                      {cep.message}
                    </span>
                  ) : null}
                </Field>
                <Field label="Rua" className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                  />
                </Field>
                <Field label="Número">
                  <input
                    className={inputClass}
                    value={form.number}
                    onChange={(e) => set("number", e.target.value)}
                  />
                </Field>
                <Field label="Complemento" className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={form.complement}
                    onChange={(e) => set("complement", e.target.value)}
                  />
                </Field>
                <Field label="Bairro">
                  <input
                    className={inputClass}
                    value={form.neighborhood}
                    onChange={(e) => set("neighborhood", e.target.value)}
                  />
                </Field>
                <Field label="Cidade">
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label="UF">
                  <select
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">UF</option>
                    {BRAZIL_UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="pt-1 text-[12px] font-bold text-brand">Contato de emergência</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Nome">
                  <input
                    className={inputClass}
                    value={form.emergencyName}
                    onChange={(e) => set("emergencyName", e.target.value)}
                  />
                </Field>
                <Field label="Telefone" error={err("emergencyPhone")}>
                  <input
                    className={
                      err("emergencyPhone") ? inputErrorClass : inputClass
                    }
                    value={form.emergencyPhone}
                    onChange={(e) =>
                      set("emergencyPhone", formatPhone(e.target.value))
                    }
                    inputMode="tel"
                  />
                </Field>
                <Field label="Parentesco">
                  <input
                    className={inputClass}
                    value={form.emergencyRelation}
                    onChange={(e) => set("emergencyRelation", e.target.value)}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-[13px] font-medium text-brand">
                <input
                  type="checkbox"
                  checked={form.isMinor}
                  onChange={(e) => set("isMinor", e.target.checked)}
                  className="size-4 rounded border-line"
                />
                Paciente menor de idade (preencher responsável)
              </label>
              {form.birthDate &&
              isValidBirthDate(form.birthDate) &&
              isMinorBirthDate(form.birthDate) ? (
                <p className="text-[11px] text-muted">
                  Data de nascimento indica menor de 18 anos — responsável é
                  obrigatório.
                </p>
              ) : null}

              {form.isMinor && (
                <div className="grid gap-3 rounded-2xl border border-line bg-bg p-3 sm:grid-cols-3">
                  <Field label="Responsável *" error={err("guardianName")}>
                    <input
                      className={
                        err("guardianName") ? inputErrorClass : inputClass
                      }
                      value={form.guardianName}
                      onChange={(e) => set("guardianName", e.target.value)}
                    />
                  </Field>
                  <Field label="CPF do responsável" error={err("guardianCpf")}>
                    <input
                      className={
                        err("guardianCpf") ? inputErrorClass : inputClass
                      }
                      value={form.guardianCpf}
                      onChange={(e) =>
                        set("guardianCpf", formatCpf(e.target.value))
                      }
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Telefone do responsável" error={err("guardianPhone")}>
                    <input
                      className={
                        err("guardianPhone") ? inputErrorClass : inputClass
                      }
                      value={form.guardianPhone}
                      onChange={(e) =>
                        set("guardianPhone", formatPhone(e.target.value))
                      }
                      inputMode="tel"
                    />
                  </Field>
                </div>
              )}
            </>
          )}

          {section === "clinico" && (
            <div className="grid gap-3">
              <Field label="Queixa principal">
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={form.chiefComplaint}
                  onChange={(e) => set("chiefComplaint", e.target.value)}
                  placeholder="Motivo da busca por terapia"
                />
              </Field>
              <Field label="Histórico clínico">
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={form.clinicalHistory}
                  onChange={(e) => set("clinicalHistory", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Medicações em uso">
                  <textarea
                    className={`${inputClass} min-h-[70px] resize-y`}
                    value={form.medications}
                    onChange={(e) => set("medications", e.target.value)}
                  />
                </Field>
                <Field label="Alergias">
                  <textarea
                    className={`${inputClass} min-h-[70px] resize-y`}
                    value={form.allergies}
                    onChange={(e) => set("allergies", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Hipótese diagnóstica / foco">
                <textarea
                  className={`${inputClass} min-h-[70px] resize-y`}
                  value={form.diagnosis}
                  onChange={(e) => set("diagnosis", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Abordagem">
                  <select
                    className={inputClass}
                    value={form.approach}
                    onChange={(e) => set("approach", e.target.value)}
                  >
                    {approaches.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Como conheceu / encaminhamento">
                  <input
                    className={inputClass}
                    value={form.referralSource}
                    onChange={(e) => set("referralSource", e.target.value)}
                    placeholder="Indicação, Instagram, médico..."
                  />
                </Field>
              </div>
              <Field label="Observações gerais">
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
            </div>
          )}

          {section === "atendimento" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as PatientStatus)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s === "ativo" ? "Ativo" : s === "pausado" ? "Pausado" : "Alta"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Início do acompanhamento" error={err("startedAt")}>
                <input
                  type="date"
                  className={err("startedAt") ? inputErrorClass : inputClass}
                  value={form.startedAt}
                  onChange={(e) => set("startedAt", e.target.value)}
                />
              </Field>
              <Field label="Modalidade preferida">
                <select
                  className={inputClass}
                  value={form.preferredMode}
                  onChange={(e) => set("preferredMode", e.target.value as SessionMode)}
                >
                  {modes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Frequência">
                <select
                  className={inputClass}
                  value={form.sessionFrequency}
                  onChange={(e) => set("sessionFrequency", e.target.value)}
                >
                  {frequencies.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Plano financeiro">
                <div className="flex rounded-full border border-line bg-bg p-1">
                  {(
                    [
                      { id: "avulso" as const, label: "Avulso" },
                      { id: "pacote" as const, label: "Pacote" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const next = {
                            ...prev,
                            billingMode: opt.id as BillingMode,
                          };
                          if (opt.id === "pacote") {
                            const derived = sessionFromPackage(
                              next.packagePrice,
                              next.packageSize,
                            );
                            if (derived != null) next.sessionValue = derived;
                          }
                          return next;
                        });
                      }}
                      className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors ${
                        form.billingMode === opt.id
                          ? "bg-surface text-brand"
                          : "text-muted hover:text-brand"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  {form.billingMode === "pacote"
                    ? "Quando os créditos acabarem, a próxima sessão pedirá renovação do pacote."
                    : "O paciente paga a cada sessão (editável no dia)."}
                </p>
              </Field>
              <Field label="Forma de pagamento">
                <select
                  className={inputClass}
                  value={form.paymentMethod}
                  onChange={(e) =>
                    set("paymentMethod", e.target.value as PaymentMethod | "")
                  }
                >
                  <option value="">Selecione</option>
                  {payments.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Valor da sessão (R$)" error={err("sessionValue")}>
                <input
                  className={err("sessionValue") ? inputErrorClass : inputClass}
                  value={form.sessionValue}
                  onChange={(e) => set("sessionValue", e.target.value)}
                  placeholder="180"
                  inputMode="decimal"
                  readOnly={form.billingMode === "pacote"}
                />
                {form.billingMode === "pacote" ? (
                  <span className="mt-1 block text-[11px] text-muted">
                    Calculado automaticamente: preço do pacote ÷ sessões.
                  </span>
                ) : null}
              </Field>

              {form.billingMode === "pacote" && (
                <>
                  <Field label="Sessões no pacote" error={err("packageSize")}>
                    <input
                      className={
                        err("packageSize") ? inputErrorClass : inputClass
                      }
                      value={form.packageSize}
                      onChange={(e) =>
                        setPackageField("packageSize", e.target.value)
                      }
                      placeholder="4"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Preço do pacote (R$)" error={err("packagePrice")}>
                    <input
                      className={
                        err("packagePrice") ? inputErrorClass : inputClass
                      }
                      value={form.packagePrice}
                      onChange={(e) =>
                        setPackageField("packagePrice", e.target.value)
                      }
                      placeholder="720"
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Créditos restantes" error={err("creditsLeft")}>
                    <input
                      className={
                        err("creditsLeft") ? inputErrorClass : inputClass
                      }
                      value={form.creditsLeft}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => {
                          const credits = Number(value);
                          const hasCredits =
                            Number.isFinite(credits) && credits > 0;
                          return {
                            ...prev,
                            creditsLeft: value,
                            renewalDue:
                              prev.billingMode === "pacote"
                                ? !hasCredits
                                : false,
                          };
                        });
                      }}
                      placeholder="4"
                      inputMode="numeric"
                    />
                  </Field>
                  <label className="flex items-start gap-2.5 rounded-2xl border border-line bg-bg p-3 text-[13px] text-brand">
                    <input
                      type="checkbox"
                      checked={form.renewalDue}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          renewalDue: checked,
                          // Marcar renovar zera créditos; desmarcar com 0 mantém aviso
                          creditsLeft: checked
                            ? "0"
                            : Number(prev.creditsLeft) > 0
                              ? prev.creditsLeft
                              : prev.packageSize || "4",
                        }));
                      }}
                      className="mt-0.5 size-4 rounded border-line"
                    />
                    <span>
                      <span className="font-semibold">Renovar na próxima sessão</span>
                      <span className="mt-0.5 block text-[12px] text-muted">
                        Marque quando o pacote acabou e o pagamento de renovação ainda não
                        foi feito.
                      </span>
                    </span>
                  </label>
                </>
              )}

              <label
                className={`flex items-start gap-2.5 rounded-2xl border p-3 text-[13px] text-brand sm:col-span-2 ${
                  err("lgpdConsent")
                    ? "border-danger/50 bg-danger/5"
                    : "border-line bg-bg"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.lgpdConsent}
                  onChange={(e) => set("lgpdConsent", e.target.checked)}
                  className="mt-0.5 size-4 rounded border-line"
                />
                <span>
                  <span className="font-semibold">Consentimento LGPD *</span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    O paciente (ou responsável) autoriza o tratamento dos dados pessoais e
                    sensíveis de saúde para fins de atendimento psicológico, conforme a LGPD.
                  </span>
                  {err("lgpdConsent") ? (
                    <span className="mt-1 block text-[11px] text-danger">
                      {err("lgpdConsent")}
                    </span>
                  ) : null}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Pendências no formulário */}
        {initial && (
          <PatientPendenciesBanner patient={initial} />
        )}

        <div className="shrink-0 flex flex-col gap-2 border-t border-line bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted">
            {saveError ? (
              <span className="text-danger">{saveError}</span>
            ) : tried && !validation.ok ? (
              "Revise os campos marcados para continuar."
            ) : (
              "* Nome e consentimento LGPD são obrigatórios"
            )}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand disabled:opacity-60"
            >
              {saving
                ? "Salvando…"
                : initial
                  ? "Salvar alterações"
                  : "Cadastrar paciente"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function PatientPendenciesBanner({ patient }: { patient: Patient }) {
  const { pending } = usePendencies();
  const items = pending.filter(
    (p) =>
      p.patientId === patient.id ||
      p.patientName.toLowerCase() === patient.fullName.toLowerCase(),
  );

  if (!items.length) return null;

  return (
    <div className="shrink-0 border-t border-line bg-orange/10 px-5 py-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-orange">
        Pendências
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((p) => (
          <span
            key={p.id}
            className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold text-brand"
          >
            {pendencyLabel(p.type)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-danger">{error}</span>
      ) : null}
    </label>
  );
}
