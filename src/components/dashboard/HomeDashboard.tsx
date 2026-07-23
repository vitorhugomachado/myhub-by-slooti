"use client";

import { useState } from "react";
import { DayAgendaCard } from "@/components/dashboard/DayAgendaCard";
import { DaySummary } from "@/components/dashboard/DaySummary";
import { Header } from "@/components/dashboard/Header";
import { NowCard } from "@/components/dashboard/NowCard";
import { QuickPatientCard } from "@/components/dashboard/QuickPatientCard";
import { Reminders } from "@/components/dashboard/Reminders";
import { TodayTimeline } from "@/components/dashboard/TodayTimeline";
import { UpcomingDays } from "@/components/dashboard/UpcomingDays";
import { Welcome } from "@/components/dashboard/Welcome";
import type { DatedAppointment, LiveUpcomingDay } from "@/lib/agenda";

export function HomeDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<DatedAppointment | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState<LiveUpcomingDay | null>(null);

  return (
    <>
      <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-4">
          <Header />
          <Welcome />

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-4">
              <NowCard />
              <TodayTimeline onSelect={setSelectedPatient} />
            </div>

            <aside className="flex min-w-0 flex-col gap-4">
              <DaySummary />
              <UpcomingDays onSelect={setSelectedDay} />
              <Reminders />
            </aside>
          </section>
        </div>
      </div>

      {selectedDay && (
        <DayAgendaCard
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          onSelectPatient={(appointment) => {
            setSelectedDay(null);
            window.setTimeout(() => setSelectedPatient(appointment), 180);
          }}
        />
      )}

      {selectedPatient && (
        <QuickPatientCard
          appointment={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </>
  );
}
