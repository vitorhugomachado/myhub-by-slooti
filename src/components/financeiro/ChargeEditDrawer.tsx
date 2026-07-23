"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  kindFinanceLabel,
  type ChargeKind,
  type FinanceCharge,
  type FinanceMethod,
  type PaymentStatus,
} from "@/lib/finance";

const methods: FinanceMethod[] = [
  "Pix",
  "Cartão",
  "Dinheiro",
  "Convênio",
  "Transferência",
];

const statuses: PaymentStatus[] = ["pendente", "pago", "atrasado", "isento"];

const kinds: ChargeKind[] = [
  "sessao_avulsa",
  "consumo_pacote",
  "renovacao_pacote",
  "isento",
];

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] text-brand outline-none focus:border-surface";

export function ChargeEditDrawer({
  charge,
  onClose,
  onSave,
  onDelete,
  title = "Editar recebimento",
}: {
  charge: FinanceCharge;
  onClose: () => void;
  onSave: (charge: FinanceCharge) => void;
  onDelete?: (chargeId: string) => void;
  title?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState(charge);

  useEffect(() => {
    setForm(charge);
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [charge]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  function set<K extends keyof FinanceCharge>(key: K, value: FinanceCharge[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "kind" && value === "consumo_pacote") {
        next.amount = 0;
        next.status = "pago";
      }
      if (key === "kind" && value === "isento") {
        next.status = "isento";
        next.amount = 0;
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      amount: Number(form.amount) || 0,
      patientName: form.patientName.trim() || "Paciente",
      description: form.description.trim() || "Lançamento",
    });
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
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
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-brand">
              {title}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Ajuste valor, método ou tipo em caso de imprevisto
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted hover:text-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Paciente
            </span>
            <input
              className={inputClass}
              value={form.patientName}
              onChange={(e) => set("patientName", e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Descrição
            </span>
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Data
              </span>
              <input
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Valor (R$)
              </span>
              <input
                className={inputClass}
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", Number(e.target.value))}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Tipo
            </span>
            <select
              className={inputClass}
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as ChargeKind)}
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {kindFinanceLabel(k)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Status
              </span>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as PaymentStatus)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "pago"
                      ? "Pago"
                      : s === "atrasado"
                        ? "Atrasado"
                        : s === "isento"
                          ? "Isento"
                          : "Pendente"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Método
              </span>
              <select
                className={inputClass}
                value={form.method}
                onChange={(e) => set("method", e.target.value as FinanceMethod)}
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Observação
            </span>
            <textarea
              className={`${inputClass} min-h-[72px] resize-none`}
              value={form.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Imprevisto, desconto, acordo..."
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Excluir este lançamento? Créditos de pacote serão ajustados se necessário.",
                  )
                ) {
                  onDelete(form.id);
                  handleClose();
                }
              }}
              className="rounded-full border border-danger/30 bg-danger/10 px-5 py-3 text-[13px] font-semibold text-danger"
            >
              Excluir
            </button>
          ) : (
            <span />
          )}
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
              className="rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand"
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function emptyManualCharge(date: string): FinanceCharge {
  return {
    id: `f-manual-${Date.now()}`,
    patientName: "",
    date,
    description: "Lançamento manual",
    amount: 180,
    method: "Pix",
    status: "pago",
    kind: "sessao_avulsa",
    note: "",
  };
}
