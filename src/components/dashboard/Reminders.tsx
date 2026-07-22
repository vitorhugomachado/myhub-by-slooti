"use client";

import { useEffect, useState } from "react";
import { reminders as staticReminders } from "@/lib/mock-data";
import {
  loadPendencies,
  pendencyLabel,
  PENDENCIES_EVENT,
  type Pendency,
} from "@/lib/pendencies";

const tagTone = [
  "bg-orange/15 text-orange",
  "bg-blue/15 text-blue",
  "bg-pink/15 text-pink",
  "bg-yellow/35 text-brand",
];

type ReminderItem = {
  id: string;
  text: string;
  tag: string;
};

export function Reminders() {
  const [pendencies, setPendencies] = useState<Pendency[]>([]);

  useEffect(() => {
    const refresh = () => setPendencies(loadPendencies());
    refresh();
    window.addEventListener(PENDENCIES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PENDENCIES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const pendingReminders: ReminderItem[] = pendencies
    .filter((p) => p.status === "pending")
    .map((p) => ({
      id: p.id,
      text: `${pendencyLabel(p.type)} — ${p.patientName}`,
      tag: "Pendente",
    }));

  const items: ReminderItem[] = [
    ...pendingReminders,
    ...staticReminders.map((r) => ({
      id: `static-${r.id}`,
      text: r.text,
      tag: r.tag,
    })),
  ];

  return (
    <article className="card flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-tight text-brand">
          Lembretes
        </h2>
        {pendingReminders.length > 0 && (
          <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange">
            {pendingReminders.length} pendente
            {pendingReminders.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.id} className="inner flex items-center gap-3 p-3">
            <span
              className={`size-2 shrink-0 rounded-full ${
                item.tag === "Pendente" ? "bg-orange" : "bg-accent-deep"
              }`}
            />
            <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-brand">
              {item.text}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagTone[index % tagTone.length]}`}
            >
              {item.tag}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
