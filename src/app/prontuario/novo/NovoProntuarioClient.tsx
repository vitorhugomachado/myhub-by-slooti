"use client";

import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { usePendencies } from "@/hooks/usePendencies";
import { useSessionReports } from "@/hooks/useSessionReports";
import { AGENDA_TODAY, getAppointmentDate } from "@/lib/agenda";
import { loadSchedule } from "@/lib/schedule";

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] text-brand outline-none placeholder:text-muted focus:border-surface";

export default function NovoProntuarioClient() {
  const router = useRouter();
  const params = useSearchParams();
  const patient = params.get("patient") ?? "Paciente";
  const appointmentId = Number(params.get("appointmentId") || 0);
  const { upsertReport, reportByAppointment } = useSessionReports();
  const { pendencies, markDone } = usePendencies();

  const appointment = useMemo(() => {
    if (!appointmentId) return null;
    return loadSchedule().find((a) => a.id === appointmentId) ?? null;
  }, [appointmentId]);

  const existing = useMemo(
    () => (appointmentId ? reportByAppointment(appointmentId) : undefined),
    [appointmentId, reportByAppointment],
  );

  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [evolution, setEvolution] = useState(existing?.evolution ?? "");
  const [nextSteps, setNextSteps] = useState(existing?.nextSteps ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setSummary(existing.summary);
    setEvolution(existing.evolution);
    setNextSteps(existing.nextSteps);
  }, [existing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Descreva o resumo da sessão para salvar.");
      return;
    }
    if (!appointmentId) {
      setError("Sessão não encontrada.");
      return;
    }

    setSaving(true);
    try {
      await upsertReport({
        appointmentId,
        patientName: appointment?.patient ?? patient,
        date:
          appointment?.date ??
          getAppointmentDate(appointmentId) ??
          AGENDA_TODAY,
        start: appointment?.start ?? "",
        end: appointment?.end ?? "",
        summary: summary.trim(),
        evolution: evolution.trim(),
        nextSteps: nextSteps.trim(),
      });

      const pendency = pendencies.find(
        (p) =>
          p.status === "pending" &&
          p.type === "prontuario" &&
          p.appointmentId === appointmentId,
      );
      if (pendency) await markDone(pendency.id);

      setError("");
      setSaved(true);
      window.setTimeout(() => router.push("/"), 900);
    } catch {
      setError("Não foi possível salvar o prontuário. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-[800px] flex-col gap-4">
        <Header />
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Voltar ao hub
        </Link>

        <form onSubmit={handleSubmit} className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand">
                <FileText className="size-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-brand">
                  Relato da sessão
                </h1>
                <p className="mt-0.5 text-[13px] text-muted">
                  {patient}
                  {appointment
                    ? ` · ${appointment.start} – ${appointment.end}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 px-5 py-5">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Resumo da sessão *
              </span>
              <textarea
                className={`${inputClass} min-h-[110px] resize-y`}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="O que foi trabalhado nesta sessão?"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Evolução / observações
              </span>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                value={evolution}
                onChange={(e) => setEvolution(e.target.value)}
                placeholder="Mudanças, insights, humor, adesão..."
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Próximos passos
              </span>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Tarefas, foco da próxima sessão..."
              />
            </label>

            {error && (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-[12px] text-danger">
                {error}
              </p>
            )}
            {saved && (
              <p className="inline-flex items-center gap-1.5 rounded-xl bg-surface-soft px-3 py-2 text-[12px] font-semibold text-brand">
                <CheckCircle2 className="size-3.5" />
                Relato salvo
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="rounded-full border border-line bg-bg px-5 py-3 text-center text-[13px] font-semibold text-brand"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar relato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
