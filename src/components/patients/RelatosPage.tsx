"use client";

import { ClipboardList, FilePlus2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Avatar } from "@/components/shared/Avatar";
import { usePatients } from "@/hooks/usePatients";
import { usePendencies } from "@/hooks/usePendencies";
import { useSessionReports } from "@/hooks/useSessionReports";
import { DEFAULT_AVATAR, resolveAvatar } from "@/lib/avatar";
import { formatFinanceDate } from "@/lib/finance";
import { pendencyHref } from "@/lib/pendencies";

export function RelatosPage() {
  const [query, setQuery] = useState("");
  const { reports, hydrated } = useSessionReports();
  const { patients } = usePatients();
  const { pendencies } = usePendencies();

  const patientByName = useMemo(() => {
    const map = new Map<string, (typeof patients)[number]>();
    for (const p of patients) {
      map.set(p.fullName.trim().toLowerCase(), p);
    }
    return map;
  }, [patients]);

  const pendingProntuarios = useMemo(
    () =>
      pendencies.filter(
        (p) => p.status === "pending" && p.type === "prontuario",
      ),
    [pendencies],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...reports].sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.start || "").localeCompare(a.start || ""),
    );
    if (!q) return list;
    return list.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.evolution.toLowerCase().includes(q) ||
        r.nextSteps.toLowerCase().includes(q),
    );
  }, [reports, query]);

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <Header />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-medium text-muted">Pacientes</p>
            <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Relatos de sessões
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Resumos, evoluções e próximos passos de cada atendimento
            </p>
          </div>
          <Link
            href="/agenda"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand"
          >
            <FilePlus2 className="size-4" />
            Ir à agenda para relatar
          </Link>
        </div>

        <div className="card p-4">
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por paciente ou texto do relato…"
              className="w-full rounded-full border border-line bg-bg py-2.5 pr-4 pl-10 text-[13px] text-brand outline-none placeholder:text-muted focus:border-surface"
            />
          </label>
        </div>

        {pendingProntuarios.length > 0 && (
          <section>
            <h2 className="mb-3 text-[15px] font-bold text-brand">
              Pendentes ({pendingProntuarios.length})
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {pendingProntuarios.map((item) => {
                const patient = patientByName.get(
                  item.patientName.trim().toLowerCase(),
                );
                return (
                  <li key={item.id}>
                    <Link
                      href={pendencyHref(item)}
                      className="card flex h-full flex-col gap-3 p-4 transition-colors hover:border-surface hover:bg-surface-soft/40"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={resolveAvatar(patient?.avatar || DEFAULT_AVATAR)}
                          alt={item.patientName}
                          size={48}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[14px] font-semibold text-brand">
                              {item.patientName}
                            </p>
                            <span className="rounded-full bg-orange/20 px-2 py-0.5 text-[10px] font-bold text-brand">
                              Pendente
                            </span>
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted">
                            Relato pendente após a sessão
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center border-t border-line pt-3">
                        <span className="ml-auto text-[12px] font-semibold text-brand">
                          Preencher agora
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!hydrated ? (
          <p className="py-12 text-center text-[13px] text-muted">
            Carregando relatos…
          </p>
        ) : filtered.length === 0 ? (
          <article className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
              <ClipboardList className="size-6" />
            </span>
            <h2 className="text-lg font-bold text-brand">
              {query ? "Nenhum relato encontrado" : "Nenhum relato ainda"}
            </h2>
            <p className="max-w-md text-[13px] leading-relaxed text-muted">
              {query
                ? "Tente outro nome ou trecho do texto."
                : "Ao finalizar uma sessão, preencha o relato para acompanhar a evolução do paciente."}
            </p>
          </article>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((r) => {
              const patient = patientByName.get(
                r.patientName.trim().toLowerCase(),
              );
              return (
                <li key={r.id}>
                  <Link
                    href={`/prontuario/novo?appointmentId=${r.appointmentId}&patient=${encodeURIComponent(r.patientName)}`}
                    className="card flex h-full flex-col gap-3 p-4 transition-colors hover:border-surface hover:bg-surface-soft/40"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={resolveAvatar(patient?.avatar || DEFAULT_AVATAR)}
                        alt={r.patientName}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-brand">
                            {r.patientName}
                          </p>
                          <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-muted">
                            {formatFinanceDate(r.date)}
                            {r.start ? ` · ${r.start}` : ""}
                            {r.end ? `–${r.end}` : ""}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted">
                          {patient?.approach || "Relato de sessão"}
                          {patient?.preferredMode
                            ? ` · ${patient.preferredMode}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[12px]">
                      <p className="line-clamp-2 text-muted">
                        <span className="font-semibold text-brand">
                          Resumo:{" "}
                        </span>
                        {r.summary.trim() || "—"}
                      </p>
                      <p className="line-clamp-2 text-muted">
                        <span className="font-semibold text-brand">
                          Evolução:{" "}
                        </span>
                        {r.evolution.trim() || "—"}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      {r.nextSteps.trim() ? (
                        <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                          Com próximos passos
                        </span>
                      ) : (
                        <span className="rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-muted">
                          Sem próximos passos
                        </span>
                      )}
                      <span className="ml-auto text-[12px] font-semibold text-brand">
                        Abrir
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
