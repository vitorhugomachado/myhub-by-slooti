"use client";

import { FilePlus2, Pill, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { usePendencies } from "@/hooks/usePendencies";
import { pendencyHref } from "@/lib/pendencies";

export function ReceitaSaudePage() {
  const [query, setQuery] = useState("");
  const { pendencies } = usePendencies();

  const pendingReceitas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pendencies.filter(
      (p) =>
        p.status === "pending" &&
        p.type === "receita" &&
        (!q || p.patientName.toLowerCase().includes(q)),
    );
  }, [pendencies, query]);

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-4">
        <Header />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Receita Saúde
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Emissão e acompanhamento de receitas dos pacientes
            </p>
          </div>
          <Link
            href="/receita-saude/nova"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand"
          >
            <FilePlus2 className="size-4" />
            Nova receita
          </Link>
        </div>

        <div className="card p-4">
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paciente na receita..."
              className="w-full rounded-full border border-line bg-bg py-2.5 pr-4 pl-10 text-[13px] text-brand outline-none placeholder:text-muted focus:border-surface"
            />
          </label>
        </div>

        {pendingReceitas.length > 0 && (
          <section className="card p-5">
            <h2 className="mb-3 text-[15px] font-bold text-brand">
              Pendentes ({pendingReceitas.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {pendingReceitas.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/receita-saude/nova?appointmentId=${item.appointmentId}&patient=${encodeURIComponent(item.patientName)}`}
                    className="inner flex items-center justify-between gap-3 p-3 transition-colors hover:border-surface hover:bg-surface-soft/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-brand">
                        {item.patientName}
                      </p>
                      <p className="text-[11px] text-muted">
                        Receita saúde pendente após sessão
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange/15 px-2.5 py-1 text-[10px] font-bold text-orange">
                      Pendente
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <article className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
            <Pill className="size-6" />
          </span>
          <h2 className="text-lg font-bold text-brand">Módulo em construção</h2>
          <p className="max-w-md text-[13px] leading-relaxed text-muted">
            Em breve você emite, salva e compartilha receitas saúde por aqui.
            As pendências geradas ao finalizar a sessão já aparecem nesta aba.
          </p>
        </article>
      </div>
    </div>
  );
}
