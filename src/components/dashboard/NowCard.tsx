"use client";

import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FinishSessionFlow } from "@/components/dashboard/FinishSessionFlow";
import { QuickPatientCard } from "@/components/dashboard/QuickPatientCard";
import { RescheduleDialog } from "@/components/sessoes/SessionManageDialogs";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useAgendaClock } from "@/hooks/useAgendaClock";
import { useFinance } from "@/hooks/useFinance";
import { useSchedule } from "@/hooks/useSchedule";
import { needsPackageRenewal } from "@/lib/billing";
import { AGENDA_TODAY } from "@/lib/agenda";
import { formatDelay, resolveLateQueue } from "@/lib/session-timing";
import {
  loadSessionPhase,
  saveSessionPhase,
  type SessionPhase,
} from "@/lib/session-phase";

export function NowCard() {
  const { paid, patientByName } = useFinance();
  const { forDate, reschedule, complete } = useSchedule();
  const now = useAgendaClock();
  const todayItems = forDate(AGENDA_TODAY, false);

  const lateInfo = useMemo(
    () => resolveLateQueue(todayItems, now),
    [todayItems, now],
  );

  const current = useMemo(() => {
    if (lateInfo) return lateInfo.late;
    return (
      todayItems.find((a) => a.status === "now") ??
      todayItems.find((a) => a.status === "upcoming") ??
      null
    );
  }, [todayItems, lateInfo]);

  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishPreviousOpen, setFinishPreviousOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [trackedId, setTrackedId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSessionPhase();
    if (saved) {
      setTrackedId(saved.appointmentId);
      setPhase(saved.phase);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !current) return;
    if (trackedId !== current.id) {
      const saved = loadSessionPhase();
      if (saved?.appointmentId === current.id) {
        setTrackedId(current.id);
        setPhase(saved.phase);
      } else {
        setTrackedId(current.id);
        setPhase("idle");
        saveSessionPhase(null);
      }
      return;
    }
    saveSessionPhase(
      phase === "idle" ? null : { appointmentId: current.id, phase },
    );
  }, [current, phase, trackedId, hydrated]);

  function setPhaseSafe(next: SessionPhase) {
    setPhase(next);
    if (current) {
      saveSessionPhase(
        next === "idle" ? null : { appointmentId: current.id, phase: next },
      );
    }
  }

  if (!current) return null;

  const isLate = Boolean(lateInfo && lateInfo.late.id === current.id);
  const isPaid = paid(current.id, {
    date: current.date,
    patientName: current.patient,
  });
  const renew = needsPackageRenewal(patientByName(current.patient));

  const isFinished = phase === "finished";
  const isRunning = phase === "running";

  function startSession() {
    setPhaseSafe("running");
    setQuickOpen(true);
  }

  return (
    <>
      <article
        className={`card p-5 sm:p-6 ${
          isLate ? "border-danger/35 ring-1 ring-danger/20" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isFinished
                ? "bg-surface text-brand"
                : isLate
                  ? "bg-danger/15 text-danger"
                  : isRunning || current.status === "now"
                    ? "bg-orange text-brand"
                    : "bg-surface-soft text-brand"
            }`}
          >
            {isFinished ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Sessão finalizada
              </>
            ) : isLate ? (
              <>
                <AlertTriangle className="size-3.5" />
                Em atraso
              </>
            ) : isRunning ? (
              <>
                <span className="live-dot text-brand" aria-hidden />
                Sessão em andamento
              </>
            ) : current.status === "now" ? (
              <>
                <span className="live-dot text-brand" aria-hidden />
                Acontecendo agora
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
          {isLate && lateInfo && (
            <span className="inline-flex items-center rounded-full bg-danger px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-card">
              +{formatDelay(lateInfo.lateMs)}
            </span>
          )}
        </div>

        {isLate && lateInfo && (
          <p className="mt-3 rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-[12px] leading-relaxed text-brand">
            A sessão de{" "}
            <span className="font-semibold">{lateInfo.blockedBy.patient}</span>{" "}
            passou do horário ({lateInfo.blockedBy.end}) sem ser finalizada.
            Este atendimento já deveria ter começado às {lateInfo.late.start}.
          </p>
        )}

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

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {isLate && lateInfo && (
            <button
              type="button"
              onClick={() => setFinishPreviousOpen(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 py-3 text-[13px] font-bold text-danger transition-colors hover:bg-danger/15 sm:order-first"
            >
              <AlertTriangle className="size-3.5" />
              Finalizar anterior · {lateInfo.blockedBy.patient}
            </button>
          )}
          {isRunning ? (
            <>
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                disabled={isFinished}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-orange py-3 text-[13px] font-bold text-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
              >
                Acompanhar sessão
              </button>
              <button
                type="button"
                onClick={() => setFinishOpen(true)}
                disabled={isFinished}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-line bg-surface py-3 text-[13px] font-bold text-brand transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
              >
                Finalizar sessão
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startSession}
              disabled={isFinished}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-orange py-3 text-[13px] font-bold text-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
            >
              Iniciar sessão
            </button>
          )}
          <button
            type="button"
            onClick={() => setRescheduleOpen(true)}
            disabled={isFinished}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface-soft py-3 text-[13px] font-semibold text-brand transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
          >
            <CalendarDays className="size-3.5" />
            Remarcar sessão
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
          onFinished={() => {
            complete(current.id);
            setPhaseSafe("finished");
          }}
        />
      )}

      {finishPreviousOpen && lateInfo && (
        <FinishSessionFlow
          appointment={lateInfo.blockedBy}
          onClose={() => setFinishPreviousOpen(false)}
          onFinished={() => {
            complete(lateInfo.blockedBy.id);
            setFinishPreviousOpen(false);
          }}
        />
      )}

      {rescheduleOpen && (
        <RescheduleDialog
          appointment={current}
          onClose={() => setRescheduleOpen(false)}
          onSave={(patch) => {
            reschedule(current.id, patch);
            setPhaseSafe("idle");
            setRescheduleOpen(false);
          }}
        />
      )}
    </>
  );
}
