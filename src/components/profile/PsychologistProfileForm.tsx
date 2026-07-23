"use client";

import { Camera, CheckCircle2, Trash2, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  APPROACHES,
  BRAZIL_UFS,
  SPECIALTIES,
  defaultProfile,
  formatCnpj,
  formatCpf,
  formatPhone,
  formatZip,
  profileCrpLabel,
  validateProfile,
  type PersonType,
  type PsychologistProfile,
} from "@/lib/profile";

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-surface";

const inputErrorClass =
  "w-full rounded-xl border border-danger/50 bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-danger";

const MAX_AVATAR_BYTES = 900_000;

type Section = "dados" | "profissional" | "fiscal" | "endereco";

async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem (JPG, PNG ou WEBP).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 8 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 512;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_AVATAR_BYTES && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_AVATAR_BYTES) {
    throw new Error("Não foi possível reduzir a imagem. Tente outra foto.");
  }
  return dataUrl;
}

export function PsychologistProfileForm({
  initial,
  onClose,
  onSave,
}: {
  initial: PsychologistProfile;
  onClose: () => void;
  onSave: (profile: PsychologistProfile) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PsychologistProfile>(initial);
  const [visible, setVisible] = useState(false);
  const [section, setSection] = useState<Section>("dados");
  const [tried, setTried] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    setForm(initial);
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [initial]);

  const validation = useMemo(() => validateProfile(form), [form]);
  const defaultAvatar = defaultProfile().avatar;
  const canResetAvatar = form.avatar !== defaultAvatar;
  const avatarUnoptimized =
    form.avatar.startsWith("data:") || form.avatar.startsWith("blob:");

  function set<K extends keyof PsychologistProfile>(
    key: K,
    value: PsychologistProfile[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
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
    set("avatar", defaultAvatar);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    const result = validateProfile(form);
    if (!result.ok) {
      if (result.errors.fullName || result.errors.email || result.errors.phone || result.errors.cpf) {
        setSection("dados");
      } else if (result.errors.crpNumber || result.errors.crpUf) {
        setSection("profissional");
      } else if (result.errors.cnpj || result.errors.companyName) {
        setSection("fiscal");
      } else {
        setSection("endereco");
      }
      return;
    }
    const next = {
      ...form,
      signatureName: form.signatureName.trim() || form.fullName.trim(),
    };
    onSave(next);
    setSavedFlash(true);
    window.setTimeout(() => {
      setSavedFlash(false);
      handleClose();
    }, 700);
  }

  function err(key: keyof PsychologistProfile) {
    return tried ? validation.errors[key] : undefined;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={handleClose}
        className={`absolute inset-0 bg-brand/25 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 flex max-h-[min(94vh,920px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ease-out sm:rounded-[28px] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand">
              <UserRound className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-brand">
                Meu perfil
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                Dados do psicólogo para Receita Saúde, prontuários e documentos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted hover:text-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-4 py-3">
          {(
            [
              { id: "dados" as const, label: "Dados" },
              { id: "profissional" as const, label: "Profissional" },
              { id: "fiscal" as const, label: "Fiscal" },
              { id: "endereco" as const, label: "Consultório" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                section === tab.id
                  ? "bg-surface text-brand"
                  : "bg-bg text-muted hover:text-brand"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <ReadinessCard
              title="Receita Saúde"
              ready={validation.missingForReceita.length === 0}
              missing={validation.missingForReceita}
            />
            <ReadinessCard
              title="Prontuário / docs"
              ready={validation.missingForDocs.length === 0}
              missing={validation.missingForDocs}
            />
          </div>

          {section === "dados" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl border border-line bg-bg p-3 sm:flex-row sm:items-center">
                <div className="relative mx-auto shrink-0 sm:mx-0">
                  <Image
                    src={form.avatar}
                    alt={form.fullName || "Avatar"}
                    width={72}
                    height={72}
                    unoptimized={avatarUnoptimized}
                    className="size-[72px] rounded-full object-cover"
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
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="truncate text-[14px] font-semibold text-brand">
                    {form.fullName || "Seu nome"}
                  </p>
                  <p className="truncate text-[12px] text-muted">
                    {profileCrpLabel(form) || "CRP ainda não informado"}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarBusy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft disabled:opacity-50"
                    >
                      <Camera className="size-3.5" />
                      {avatarBusy ? "Carregando…" : "Trocar foto"}
                    </button>
                    {canResetAvatar && (
                      <button
                        type="button"
                        onClick={resetAvatar}
                        disabled={avatarBusy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Remover
                      </button>
                    )}
                  </div>
                  {avatarError && (
                    <p className="mt-1.5 text-[11px] text-danger">{avatarError}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted">
                    JPG, PNG ou WEBP · até 8 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </div>

              <Field label="Nome completo *" error={err("fullName")}>
                <input
                  className={err("fullName") ? inputErrorClass : inputClass}
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  required
                />
              </Field>
              <Field label="Nome social">
                <input
                  className={inputClass}
                  value={form.socialName}
                  onChange={(e) => set("socialName", e.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="E-mail *" error={err("email")}>
                <input
                  type="email"
                  className={err("email") ? inputErrorClass : inputClass}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </Field>
              <Field label="Telefone *" error={err("phone")}>
                <input
                  className={err("phone") ? inputErrorClass : inputClass}
                  value={form.phone}
                  onChange={(e) => set("phone", formatPhone(e.target.value))}
                  placeholder="(11) 90000-0000"
                  inputMode="tel"
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  className={inputClass}
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", formatPhone(e.target.value))}
                  placeholder="(11) 90000-0000"
                  inputMode="tel"
                />
              </Field>
              <Field label="Data de nascimento">
                <input
                  type="date"
                  className={inputClass}
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
              </Field>
              <Field label="CPF *" error={err("cpf")}>
                <input
                  className={err("cpf") ? inputErrorClass : inputClass}
                  value={form.cpf}
                  onChange={(e) => set("cpf", formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </Field>
            </div>
          )}

          {section === "profissional" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título profissional">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Psicóloga"
                />
              </Field>
              <Field label="Especialidade">
                <select
                  className={inputClass}
                  value={form.specialty}
                  onChange={(e) => set("specialty", e.target.value)}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nº do CRP *" error={err("crpNumber")}>
                <input
                  className={err("crpNumber") ? inputErrorClass : inputClass}
                  value={form.crpNumber}
                  onChange={(e) => set("crpNumber", e.target.value)}
                  placeholder="123456"
                />
              </Field>
              <Field label="UF do CRP *" error={err("crpUf")}>
                <select
                  className={err("crpUf") ? inputErrorClass : inputClass}
                  value={form.crpUf}
                  onChange={(e) => set("crpUf", e.target.value)}
                >
                  {BRAZIL_UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Abordagem">
                <select
                  className={inputClass}
                  value={form.approach}
                  onChange={(e) => set("approach", e.target.value)}
                >
                  {APPROACHES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nome na assinatura">
                <input
                  className={inputClass}
                  value={form.signatureName}
                  onChange={(e) => set("signatureName", e.target.value)}
                  placeholder="Como aparece em documentos"
                />
              </Field>
              <p className="sm:col-span-2 text-[11px] leading-relaxed text-muted">
                CRP e assinatura entram no cabeçalho/rodapé de prontuários e
                documentos clínicos.
              </p>
            </div>
          )}

          {section === "fiscal" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo de prestador">
                <div className="flex rounded-full border border-line bg-bg p-1">
                  {(
                    [
                      { id: "PF" as const, label: "Pessoa física" },
                      { id: "PJ" as const, label: "Pessoa jurídica" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => set("personType", opt.id as PersonType)}
                      className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors ${
                        form.personType === opt.id
                          ? "bg-surface text-brand"
                          : "text-muted hover:text-brand"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Nome do consultório">
                <input
                  className={inputClass}
                  value={form.clinicName}
                  onChange={(e) => set("clinicName", e.target.value)}
                  placeholder="Nome fantasia / consultório"
                />
              </Field>

              {form.personType === "PJ" && (
                <>
                  <Field label="Razão social *" error={err("companyName")}>
                    <input
                      className={
                        err("companyName") ? inputErrorClass : inputClass
                      }
                      value={form.companyName}
                      onChange={(e) => set("companyName", e.target.value)}
                    />
                  </Field>
                  <Field label="CNPJ *" error={err("cnpj")}>
                    <input
                      className={err("cnpj") ? inputErrorClass : inputClass}
                      value={form.cnpj}
                      onChange={(e) => set("cnpj", formatCnpj(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      inputMode="numeric"
                    />
                  </Field>
                </>
              )}

              <Field label="Inscrição municipal">
                <input
                  className={inputClass}
                  value={form.municipalRegistration}
                  onChange={(e) => set("municipalRegistration", e.target.value)}
                  placeholder="Opcional (ISS)"
                />
              </Field>
              <Field label="Chave Pix">
                <input
                  className={inputClass}
                  value={form.pixKey}
                  onChange={(e) => set("pixKey", e.target.value)}
                  placeholder="CPF, e-mail ou chave aleatória"
                />
              </Field>
              <p className="sm:col-span-2 text-[11px] leading-relaxed text-muted">
                CPF (PF) ou CNPJ (PJ) e endereço do prestador são necessários
                para emitir Receita Saúde alinhada ao padrão federal.
              </p>
            </div>
          )}

          {section === "endereco" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CEP *" error={err("zip")}>
                <input
                  className={err("zip") ? inputErrorClass : inputClass}
                  value={form.zip}
                  onChange={(e) => set("zip", formatZip(e.target.value))}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Bairro">
                <input
                  className={inputClass}
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                />
              </Field>
              <Field label="Rua / Avenida *" error={err("street")} className="sm:col-span-2">
                <input
                  className={err("street") ? inputErrorClass : inputClass}
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
              </Field>
              <Field label="Número *" error={err("number")}>
                <input
                  className={err("number") ? inputErrorClass : inputClass}
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                />
              </Field>
              <Field label="Complemento">
                <input
                  className={inputClass}
                  value={form.complement}
                  onChange={(e) => set("complement", e.target.value)}
                  placeholder="Sala, andar..."
                />
              </Field>
              <Field label="Cidade *" error={err("city")}>
                <input
                  className={err("city") ? inputErrorClass : inputClass}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field label="Estado *" error={err("state")}>
                <select
                  className={err("state") ? inputErrorClass : inputClass}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  {BRAZIL_UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted">
            {savedFlash ? (
              <span className="inline-flex items-center gap-1 font-semibold text-accent-deep">
                <CheckCircle2 className="size-3.5" />
                Perfil salvo
              </span>
            ) : tried && !validation.ok ? (
              "Revise os campos marcados para continuar."
            ) : (
              "* Campos essenciais para emitir documentos"
            )}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand"
            >
              Salvar perfil
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ReadinessCard({
  title,
  ready,
  missing,
}: {
  title: string;
  ready: boolean;
  missing: string[];
}) {
  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 ${
        ready
          ? "border-surface bg-surface-soft"
          : "border-line bg-bg"
      }`}
    >
      <p className="text-[12px] font-semibold text-brand">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {ready
          ? "Pronto para usar"
          : `Falta: ${missing.join(", ")}`}
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-danger">{error}</span>}
    </label>
  );
}
