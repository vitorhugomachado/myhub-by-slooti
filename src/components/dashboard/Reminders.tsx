"use client";

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePendencies } from "@/hooks/usePendencies";
import { pendencyHref, pendencyLabel } from "@/lib/pendencies";

export function Reminders() {
  const { pending, markDone } = usePendencies();

  return (
    <article className="card flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-tight text-brand">
          Lembretes
        </h2>
        {pending.length > 0 && (
          <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange">
            {pending.length} pendente{pending.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Nenhuma pendência no momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((item) => (
            <li key={item.id} className="inner flex flex-col gap-2 p-3">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-orange" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-brand">
                    {pendencyLabel(item.type)} — {item.patientName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">Pendente</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-5">
                <Link
                  href={pendencyHref(item)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-surface px-3 py-2 text-[11px] font-bold text-brand sm:flex-none"
                >
                  Abrir
                  <ChevronRight className="size-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => void markDone(item.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-line bg-bg px-3 py-2 text-[11px] font-semibold text-brand hover:bg-surface-soft sm:flex-none"
                >
                  <Check className="size-3.5" />
                  Concluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
