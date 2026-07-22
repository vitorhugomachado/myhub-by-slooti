"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  loadPendencies,
  pendencyLabel,
  PENDENCIES_EVENT,
  type Pendency,
} from "@/lib/pendencies";
import {
  emptyPatient,
  type BillingMode,
  type Patient,
  type PaymentMethod,
  type SessionMode,
  type PatientStatus,
} from "@/lib/patients";

type FormState = ReturnType<typeof emptyPatient>;

const genders = ["Feminino", "Masculino", "Não-binário", "Prefiro não informar", "Outro"];
const marital = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"];
const approaches = ["TCC", "Psicanálise", "Humanista", "Sistêmica", "Gestalt", "Outra"];
const frequencies = ["Semanal", "Quinzenal", "Mensal", "Avulsa"];
const modes: SessionMode[] = ["Online", "Presencial", "Híbrido"];
const payments: PaymentMethod[] = ["Pix", "Cartão", "Dinheiro", "Convênio", "Transferência"];
const statuses: PatientStatus[] = ["ativo", "pausado", "alta"];

export function PatientForm({
  initial,
  onClose,
  onSave,
}: {
  initial?: Patient | null;
  onClose: () => void;
  onSave: (data: FormState, id?: string) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyPatient());
  const [visible, setVisible] = useState(false);
  const [section, setSection] = useState<"dados" | "clinico" | "atendimento">("dados");

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _c, avatar: _a, ...rest } = initial;
      setForm(rest);
    } else {
      setForm(emptyPatient());
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [initial]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    if (!form.lgpdConsent) {
      alert("É necessário o consentimento LGPD para salvar o cadastro.");
      return;
    }
    onSave(form, initial?.id);
    handleClose();
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-surface";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
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
        className={`relative z-10 flex max-h-[min(94vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ease-out sm:rounded-[28px] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-brand">
              {initial ? "Editar paciente" : "Novo paciente"}
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              Cadastro completo para atendimento clínico
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome completo *" className="sm:col-span-2">
                  <input
                    required
                    className={inputClass}
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
                <Field label="Data de nascimento">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.birthDate}
                    onChange={(e) => set("birthDate", e.target.value)}
                  />
                </Field>
                <Field label="CPF">
                  <input
                    className={inputClass}
                    value={form.cpf}
                    onChange={(e) => set("cpf", e.target.value)}
                    placeholder="000.000.000-00"
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
                <Field label="E-mail">
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(11) 90000-0000"
                  />
                </Field>
                <Field label="WhatsApp" className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </Field>
              </div>

              <p className="pt-1 text-[12px] font-bold text-brand">Endereço</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="CEP">
                  <input
                    className={inputClass}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                  />
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
                  <input
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    maxLength={2}
                    placeholder="SP"
                  />
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
                <Field label="Telefone">
                  <input
                    className={inputClass}
                    value={form.emergencyPhone}
                    onChange={(e) => set("emergencyPhone", e.target.value)}
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

              {form.isMinor && (
                <div className="grid gap-3 rounded-2xl border border-line bg-bg p-3 sm:grid-cols-3">
                  <Field label="Responsável">
                    <input
                      className={inputClass}
                      value={form.guardianName}
                      onChange={(e) => set("guardianName", e.target.value)}
                    />
                  </Field>
                  <Field label="CPF do responsável">
                    <input
                      className={inputClass}
                      value={form.guardianCpf}
                      onChange={(e) => set("guardianCpf", e.target.value)}
                    />
                  </Field>
                  <Field label="Telefone do responsável">
                    <input
                      className={inputClass}
                      value={form.guardianPhone}
                      onChange={(e) => set("guardianPhone", e.target.value)}
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
              <Field label="Início do acompanhamento">
                <input
                  type="date"
                  className={inputClass}
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
                      onClick={() => set("billingMode", opt.id as BillingMode)}
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
              <Field label="Valor da sessão (R$)">
                <input
                  className={inputClass}
                  value={form.sessionValue}
                  onChange={(e) => set("sessionValue", e.target.value)}
                  placeholder="180"
                  inputMode="decimal"
                />
              </Field>

              {form.billingMode === "pacote" && (
                <>
                  <Field label="Sessões no pacote">
                    <input
                      className={inputClass}
                      value={form.packageSize}
                      onChange={(e) => set("packageSize", e.target.value)}
                      placeholder="4"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Preço do pacote (R$)">
                    <input
                      className={inputClass}
                      value={form.packagePrice}
                      onChange={(e) => set("packagePrice", e.target.value)}
                      placeholder="720"
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Créditos restantes">
                    <input
                      className={inputClass}
                      value={form.creditsLeft}
                      onChange={(e) => set("creditsLeft", e.target.value)}
                      placeholder="4"
                      inputMode="numeric"
                    />
                  </Field>
                  <label className="flex items-start gap-2.5 rounded-2xl border border-line bg-bg p-3 text-[13px] text-brand">
                    <input
                      type="checkbox"
                      checked={form.renewalDue}
                      onChange={(e) => set("renewalDue", e.target.checked)}
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

              <label className="flex items-start gap-2.5 rounded-2xl border border-line bg-bg p-3 text-[13px] text-brand sm:col-span-2">
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
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Pendências no formulário */}
        {initial && (
          <PatientPendenciesBanner patient={initial} />
        )}

        <div className="shrink-0 flex flex-col-reverse gap-2 border-t border-line bg-card px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand"
          >
            {initial ? "Salvar alterações" : "Cadastrar paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PatientPendenciesBanner({ patient }: { patient: Patient }) {
  const [items, setItems] = useState<Pendency[]>([]);

  useEffect(() => {
    const refresh = () => {
      setItems(
        loadPendencies().filter(
          (p) =>
            p.status === "pending" &&
            (p.patientId === patient.id ||
              p.patientName.toLowerCase() === patient.fullName.toLowerCase()),
        ),
      );
    };
    refresh();
    window.addEventListener(PENDENCIES_EVENT, refresh);
    return () => window.removeEventListener(PENDENCIES_EVENT, refresh);
  }, [patient.id, patient.fullName]);

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
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
