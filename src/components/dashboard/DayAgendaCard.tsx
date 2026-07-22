"use client";

import { MapPin, Video, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import { needsPackageRenewal } from "@/lib/billing";
import { getAppointmentDate } from "@/lib/agenda";
import type { Appointment, UpcomingDay } from "@/lib/mock-data";

export function DayAgendaCard({
  day,
  onClose,
  onSelectPatient,
}: {
  day: UpcomingDay;
  onClose: () => void;
  onSelectPatient: (appointment: Appointment) => void;
}) {
  const [visible, setVisible] = useState(false);
  const { paid, patientByName } = useFinance();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  const [dayNum, month] = day.date.split(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
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
        aria-label={`Agenda — ${day.day}`}
        className={`relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface text-brand">
              <span className="text-base font-bold leading-none">{dayNum}</span>
              <span className="mt-0.5 text-[10px] font-medium uppercase text-brand/70">
                {month}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-brand">
                {day.day}
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                {day.count} sessões · {day.range}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:text-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {day.appointments.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectPatient(item)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-bg p-2.5 text-left transition-colors hover:border-surface hover:bg-surface-soft/60"
              >
                <Image
                  src={item.avatar}
                  alt={item.patient}
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-brand">
                      {item.patient}
                    </p>
                    {paid(item.id, {
                      date: getAppointmentDate(item.id),
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
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-brand">{item.start}</p>
                  <p className="text-[10px] text-muted">{item.end}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
