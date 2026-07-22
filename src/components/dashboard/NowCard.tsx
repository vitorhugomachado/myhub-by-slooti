"use client";

import { CalendarClock, CheckCircle2, MapPin, Video } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { FinishSessionFlow } from "@/components/dashboard/FinishSessionFlow";
import { QuickPatientCard } from "@/components/dashboard/QuickPatientCard";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import { needsPackageRenewal } from "@/lib/billing";
import { AGENDA_TODAY } from "@/lib/agenda";
import { todaySchedule } from "@/lib/mock-data";

type SessionPhase = "idle" | "running" | "finished";

export function NowCard() {
  const { paid, patientByName } = useFinance();
  const current =
    todaySchedule.find((a) => a.status === "now") ??
    todaySchedule.find((a) => a.status === "upcoming");

  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [finishOpen, setFinishOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  if (!current) return null;

  const isPaid = paid(current.id, {
    date: AGENDA_TODAY,
    patientName: current.patient,
  });
  const renew = needsPackageRenewal(patientByName(current.patient));

  const isFinished = phase === "finished";
  const canStart = !isFinished;
  const canFinish =
    !isFinished && (phase === "running" || current.status === "now");

  function startSession() {
    setPhase("running");
    setQuickOpen(true);
  }

  return (
    <>
      <article className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isFinished
                ? "bg-surface text-brand"
                : phase === "running" || current.status === "now"
                  ? "bg-orange text-brand"
                  : "bg-surface-soft text-brand"
            }`}
          >
            {isFinished ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Sessão finalizada
              </>
            ) : phase === "running" || current.status === "now" ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                {phase === "running"
                  ? "Sessão em andamento"
                  : "Acontecendo agora"}
              </>
            ) : (
              <>
                <CalendarClock className="size-3.5" />
                Próximo atendimento
              </>
            )}
          </span>
          <span className="text-[13px] font-medium text-muted">
            {current.start} – {current.end}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Image
            src={current.avatar}
            alt={current.patient}
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold tracking-tight text-brand">
                {current.patient}
              </h2>
              {isPaid && <PaidMark className="size-6 text-[12px]" />}
              {renew && <RenewalPill />}
            </div>
            <p className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
              <span>{current.type}</span>
              <span className="text-muted/40">·</span>
              <span className="inline-flex items-center gap-1">
                {current.mode === "Online" ? (
                  <Video className="size-3.5" />
                ) : (
                  <MapPin className="size-3.5" />
                )}
                {current.mode}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={startSession}
            disabled={!canStart}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-orange py-3 text-[13px] font-bold text-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Iniciar sessão
          </button>
          <button
            type="button"
            onClick={() => setFinishOpen(true)}
            disabled={!canFinish}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-line bg-surface-soft py-3 text-[13px] font-semibold text-brand transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            Finalizar sessão
          </button>
        </div>
      </article>

      {quickOpen && (
        <QuickPatientCard
          appointment={current}
          onClose={() => setQuickOpen(false)}
        />
      )}

      {finishOpen && (
        <FinishSessionFlow
          appointment={current}
          onClose={() => setFinishOpen(false)}
          onFinished={() => setPhase("finished")}
        />
      )}
    </>
  );
}
