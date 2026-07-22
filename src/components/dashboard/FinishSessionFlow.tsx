"use client";

import { FileText, Pill, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/hooks/useFinance";
import { AGENDA_TODAY, getAppointmentDate } from "@/lib/agenda";
import type { Appointment } from "@/lib/mock-data";
import {
  addPendency,
  pendencyLabel,
  type PendencyType,
} from "@/lib/pendencies";
import { seedPatients, STORAGE_KEY, type Patient } from "@/lib/patients";

type Step = "confirm" | "followup" | "done";

type Choice = "now" | "later" | null;

function resolvePatientId(name: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Patient[]) : seedPatients;
    return list.find(
      (p) => p.fullName.toLowerCase() === name.toLowerCase(),
    )?.id;
  } catch {
    return seedPatients.find(
      (p) => p.fullName.toLowerCase() === name.toLowerCase(),
    )?.id;
  }
}

export function FinishSessionFlow({
  appointment,
  onClose,
  onFinished,
}: {
  appointment: Appointment;
  onClose: () => void;
  onFinished: () => void;
}) {
  const router = useRouter();
  const { billSession } = useFinance();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [prontuario, setProntuario] = useState<Choice>(null);
  const [receita, setReceita] = useState<Choice>(null);

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

  function confirmFinish() {
    const date = getAppointmentDate(appointment.id) ?? AGENDA_TODAY;
    billSession({ ...appointment, date });
    onFinished();
    setStep("followup");
  }

  function choose(type: PendencyType, choice: "now" | "later") {
    if (type === "prontuario") setProntuario(choice);
    else setReceita(choice);

    if (choice === "later") {
      addPendency({
        type,
        patientName: appointment.patient,
        patientId: resolvePatientId(appointment.patient),
        appointmentId: appointment.id,
      });
    }
  }

  function finishFollowup() {
    const goProntuario = prontuario === "now";
    const goReceita = receita === "now";

    handleClose();

    if (goProntuario) {
      router.push(
        `/prontuario/novo?appointmentId=${appointment.id}&patient=${encodeURIComponent(appointment.patient)}`,
      );
      return;
    }
    if (goReceita) {
      router.push(
        `/receita-saude/nova?appointmentId=${appointment.id}&patient=${encodeURIComponent(appointment.patient)}`,
      );
    }
  }

  const bothChosen = prontuario !== null && receita !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={handleClose}
        className={`absolute inset-0 bg-brand/30 backdrop-blur-[2px] transition-opacity duration-200 ${
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
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-brand">
              {step === "confirm"
                ? "Finalizar sessão?"
                : step === "followup"
                  ? "Sessão finalizada"
                  : "Tudo certo"}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {appointment.patient} · {appointment.start} – {appointment.end}
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

        <div className="space-y-4 px-5 py-5">
          {step === "confirm" && (
            <>
              <p className="text-[14px] leading-relaxed text-brand">
                Confirma a finalização desta sessão? Essa ação registra o
                encerramento do atendimento.
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
                  type="button"
                  onClick={confirmFinish}
                  className="rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand"
                >
                  Confirmar finalização
                </button>
              </div>
            </>
          )}

          {step === "followup" && (
            <>
              <p className="text-[13px] leading-relaxed text-muted">
                Escolha o que deseja fazer agora. Se deixar para depois, vamos
                criar lembretes e marcar como pendência no cadastro do paciente.
              </p>

              <TaskChoice
                icon={FileText}
                title={pendencyLabel("prontuario")}
                choice={prontuario}
                onNow={() => choose("prontuario", "now")}
                onLater={() => choose("prontuario", "later")}
              />

              <TaskChoice
                icon={Pill}
                title={pendencyLabel("receita")}
                choice={receita}
                onNow={() => choose("receita", "now")}
                onLater={() => choose("receita", "later")}
              />

              <button
                type="button"
                disabled={!bothChosen}
                onClick={finishFollowup}
                className="w-full rounded-full bg-orange py-3 text-[13px] font-bold text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskChoice({
  icon: Icon,
  title,
  choice,
  onNow,
  onLater,
}: {
  icon: typeof FileText;
  title: string;
  choice: Choice;
  onNow: () => void;
  onLater: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-surface-soft text-brand">
          <Icon className="size-4" />
        </span>
        <h3 className="text-[14px] font-bold text-brand">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onNow}
          className={`rounded-full py-2.5 text-[12px] font-semibold transition-colors ${
            choice === "now"
              ? "bg-surface text-brand"
              : "border border-line bg-card text-brand hover:bg-surface-soft"
          }`}
        >
          Preencher agora
        </button>
        <button
          type="button"
          onClick={onLater}
          className={`rounded-full py-2.5 text-[12px] font-semibold transition-colors ${
            choice === "later"
              ? "bg-yellow/35 text-brand"
              : "border border-line bg-card text-brand hover:bg-surface-soft"
          }`}
        >
          Preencher depois
        </button>
      </div>
      {choice === "later" && (
        <p className="mt-2 text-[11px] text-muted">
          Vai para lembretes e fica pendente no cadastro.
        </p>
      )}
    </div>
  );
}
