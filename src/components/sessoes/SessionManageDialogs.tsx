"use client";

import { Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DatedAppointment } from "@/lib/agenda";
import { addMinutesToTime } from "@/lib/schedule";

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] text-brand outline-none focus:border-surface";

export function RescheduleDialog({
  appointment,
  onClose,
  onSave,
}: {
  appointment: DatedAppointment;
  onClose: () => void;
  onSave: (patch: { date: string; start: string; end: string }) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(appointment.date);
  const [start, setStart] = useState(appointment.start);
  const [end, setEnd] = useState(appointment.end);

  useEffect(() => {
    setDate(appointment.date);
    setStart(appointment.start);
    setEnd(appointment.end);
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [appointment]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  function onStartChange(value: string) {
    setStart(value);
    setEnd(addMinutesToTime(value, 50));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !start || !end) return;
    onSave({ date, start, end });
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
              Trocar horário
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {appointment.patient} · {appointment.type}
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

        <div className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Data
            </span>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Início
              </span>
              <input
                type="time"
                className={inputClass}
                value={start}
                onChange={(e) => onStartChange(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Fim
              </span>
              <input
                type="time"
                className={inputClass}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
          </div>
          <p className="text-[11px] text-muted">
            Ao mudar o início, o fim é ajustado automaticamente (+50 min). Você
            pode editar o fim depois.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand"
          >
            <Clock3 className="size-4" />
            Salvar horário
          </button>
        </div>
      </form>
    </div>
  );
}

export function CancelSessionDialog({
  appointment,
  onClose,
  onConfirm,
}: {
  appointment: DatedAppointment;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
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
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold tracking-tight text-brand">
            Cancelar sessão?
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {appointment.patient} · {appointment.start} – {appointment.end} ·{" "}
            {appointment.date.split("-").reverse().slice(0, 2).join("/")}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[14px] leading-relaxed text-brand">
            A sessão será marcada como cancelada e sairá da agenda ativa. Você
            ainda pode vê-la no filtro Canceladas.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="rounded-full bg-danger/90 px-5 py-3 text-[13px] font-bold text-card"
          >
            Confirmar cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}
