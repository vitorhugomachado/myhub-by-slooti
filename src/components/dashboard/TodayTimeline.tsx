"use client";

import { Check, ChevronRight, MapPin, Video } from "lucide-react";
import Image from "next/image";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import { needsPackageRenewal } from "@/lib/billing";
import { AGENDA_TODAY } from "@/lib/agenda";
import {
  todaySchedule,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/mock-data";

const dotStyle: Record<AppointmentStatus, string> = {
  done: "bg-card border-brand text-brand",
  now: "bg-orange border-orange text-brand",
  upcoming: "bg-card border-line text-muted",
  cancelled: "bg-card border-danger/40 text-danger",
};

export function TodayTimeline({
  onSelect,
}: {
  onSelect: (appointment: Appointment) => void;
}) {
  const { paid, patientByName } = useFinance();
  const doneCount = todaySchedule.filter((a) => a.status === "done").length;

  return (
    <article className="card flex flex-col p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-brand">
            Agenda de Hoje
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {doneCount} de {todaySchedule.length} atendimentos concluídos
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-brand"
        >
          Ver agenda
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <ol className="flex flex-col">
        {todaySchedule.map((item, index) => {
          const isLast = index === todaySchedule.length - 1;
          const isNow = item.status === "now";
          const isDone = item.status === "done";

          return (
            <li key={item.id} className="flex gap-3">
              <div className="flex w-12 shrink-0 flex-col items-end pt-2.5">
                <span
                  className={`text-[11px] font-semibold ${
                    isDone ? "text-muted/60" : "text-brand"
                  }`}
                >
                  {item.start}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span
                  className={`mt-2.5 flex size-5 items-center justify-center rounded-full border-2 ${dotStyle[item.status]}`}
                >
                  {isDone && <Check className="size-3" strokeWidth={3} />}
                  {isNow && (
                    <span className="size-1.5 rounded-full bg-brand" />
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
                    isNow
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
                        date: AGENDA_TODAY,
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

                  {isNow && (
                    <span className="shrink-0 rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold text-brand">
                      Agora
                    </span>
                  )}
                  {isDone && (
                    <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-brand">
                      Concluído
                    </span>
                  )}
                  {!isNow && !isDone && (
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
    </article>
  );
}
