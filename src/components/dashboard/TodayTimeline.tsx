"use client";

import { Check, ChevronRight, MapPin, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useAgendaClock, useAgendaToday } from "@/hooks/useAgendaClock";
import { useFinance } from "@/hooks/useFinance";
import { useSchedule } from "@/hooks/useSchedule";
import { needsPackageRenewal } from "@/lib/billing";
import {
  resolveDashboardAgendaFocus,
  type DatedAppointment,
} from "@/lib/agenda";
import type { AppointmentStatus } from "@/lib/mock-data";
import {
  formatDelay,
  isAppointmentLate,
  resolveLateQueue,
} from "@/lib/session-timing";

const dotStyle: Record<AppointmentStatus, string> = {
  done: "bg-card border-brand text-brand",
  now: "bg-orange border-orange text-brand",
  upcoming: "bg-card border-line text-muted",
  cancelled: "bg-card border-danger/40 text-danger",
};

export function TodayTimeline({
  onSelect,
}: {
  onSelect: (appointment: DatedAppointment) => void;
}) {
  const { paid, patientByName } = useFinance();
  const { items, forDate } = useSchedule();
  const today = useAgendaToday();
  const now = useAgendaClock();

  const focus = useMemo(
    () => resolveDashboardAgendaFocus(items, today),
    [items, today],
  );

  const dayItems = forDate(focus.date, true).filter(
    (a) => a.status !== "cancelled",
  );
  const doneCount = dayItems.filter((a) => a.status === "done").length;
  const lateInfo = useMemo(
    () => (focus.isToday ? resolveLateQueue(dayItems, now) : null),
    [dayItems, now, focus.isToday],
  );

  return (
    <article className="card flex flex-col p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-brand">
            {focus.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {focus.isToday
              ? `${doneCount} de ${dayItems.length} atendimentos concluídos`
              : dayItems.length === 0
                ? "Nenhum atendimento neste dia"
                : `${dayItems.length} atendimento${dayItems.length === 1 ? "" : "s"} · dia seguinte na fila`}
            {lateInfo ? ` · 1 em atraso (+${formatDelay(lateInfo.lateMs)})` : ""}
          </p>
        </div>
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-brand"
        >
          Ver agenda
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {dayItems.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted">
          {focus.isToday
            ? "Nenhum atendimento para hoje."
            : "Nenhum atendimento neste dia."}
        </p>
      ) : (
        <ol className="flex flex-col">
          {dayItems.map((item, index) => {
            const isLast = index === dayItems.length - 1;
            const isNow = focus.isToday && item.status === "now";
            const isDone = item.status === "done";
            const isLate = isAppointmentLate(item, lateInfo);
            const isBlocked = lateInfo?.blockedBy.id === item.id && !isDone;

            return (
              <li key={item.id} className="flex gap-3">
                <div className="flex w-12 shrink-0 flex-col items-end pt-2.5">
                  <span
                    className={`text-[11px] font-semibold ${
                      isDone
                        ? "text-muted/60"
                        : isLate
                          ? "text-danger"
                          : "text-brand"
                    }`}
                  >
                    {item.start}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span
                    className={`mt-2.5 flex size-5 items-center justify-center rounded-full border-2 ${
                      isLate
                        ? "border-danger bg-danger/15 text-danger"
                        : dotStyle[item.status]
                    }`}
                  >
                    {isDone && <Check className="size-3" strokeWidth={3} />}
                    {isNow && !isLate && !isBlocked && (
                      <span className="live-dot text-brand" aria-hidden />
                    )}
                    {isLate && (
                      <span className="size-1.5 rounded-full bg-danger" />
                    )}
                  </span>
                  {!isLast && (
                    <span className="my-1 w-0.5 flex-1 rounded-full bg-line" />
                  )}
                </div>

                <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-3"}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,22,26,0.06)] ${
                      isLate
                        ? "border-danger/35 bg-danger/10 hover:border-danger/50"
                        : isBlocked
                          ? "border-danger/20 bg-danger/5 hover:border-danger/30"
                          : isNow
                            ? "border-orange/30 bg-surface-soft hover:border-orange/50"
                            : isDone
                              ? "border-line bg-bg/50 hover:bg-surface-soft/50"
                              : "border-line bg-bg hover:border-surface hover:bg-surface-soft/60"
                    }`}
                  >
                    <Image
                      src={item.avatar}
                      alt={item.patient}
                      width={36}
                      height={36}
                      className={`size-9 shrink-0 rounded-full object-cover ${
                        isDone ? "opacity-60" : ""
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`truncate text-[13px] font-semibold ${
                            isDone ? "text-muted" : "text-brand"
                          }`}
                        >
                          {item.patient}
                        </p>
                        {paid(item.id, {
                          date: item.date,
                          patientName: item.patient,
                        }) && <PaidMark />}
                        {needsPackageRenewal(patientByName(item.patient)) && (
                          <RenewalPill />
                        )}
                      </div>
                      <p className="flex items-center gap-1.5 truncate text-[11px] text-muted">
                        <span className="truncate">{item.type}</span>
                        <span className="text-muted/40">·</span>
                        <span className="inline-flex items-center gap-0.5">
                          {item.mode === "Online" ? (
                            <Video className="size-3" />
                          ) : (
                            <MapPin className="size-3" />
                          )}
                          {item.mode}
                        </span>
                      </p>
                    </div>

                    {isLate && lateInfo && (
                      <span className="shrink-0 rounded-full bg-danger px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-card">
                        Atraso +{formatDelay(lateInfo.lateMs)}
                      </span>
                    )}
                    {isBlocked && !isLate && (
                      <span className="shrink-0 rounded-full bg-danger/15 px-2.5 py-1 text-[10px] font-bold text-danger">
                        Não finalizada
                      </span>
                    )}
                    {isNow && !isLate && !isBlocked && (
                      <span className="shrink-0 rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold text-brand">
                        Agora
                      </span>
                    )}
                    {isDone && (
                      <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-brand">
                        Concluído
                      </span>
                    )}
                    {!isNow && !isDone && !isLate && !isBlocked && (
                      <span className="shrink-0 rounded-full bg-yellow/30 px-2.5 py-1 text-[10px] font-semibold text-brand">
                        Acesso rápido
                      </span>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
