"use client";

import { FileText, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Avatar } from "@/components/shared/Avatar";
import { usePatients } from "@/hooks/usePatients";
import { useSessionReports } from "@/hooks/useSessionReports";
import { resolveAvatar } from "@/lib/avatar";
import { statusLabel, type Patient } from "@/lib/patients";

function hasClinicalContent(p: Patient) {
  return Boolean(
    p.chiefComplaint.trim() ||
      p.clinicalHistory.trim() ||
      p.diagnosis.trim() ||
      p.medications.trim() ||
      p.notes.trim(),
  );
}

export function ProntuariosPage() {
  const [query, setQuery] = useState("");
  const { patients, hydrated: patientsReady } = usePatients();
  const { reports, hydrated: reportsReady } = useSessionReports();

  const reportCountByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      const key = r.patientName.trim().toLowerCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...patients].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "pt-BR"),
    );
    if (!q) return list;
    return list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.socialName.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q) ||
        p.chiefComplaint.toLowerCase().includes(q) ||
        p.approach.toLowerCase().includes(q),
    );
  }, [patients, query]);

  const ready = patientsReady && reportsReady;

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <Header />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-medium text-muted">Pacientes</p>
            <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Prontuários
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Histórico clínico, queixa e evolução por paciente
            </p>
          </div>
          <Link
            href="/pacientes?new=1"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand"
          >
            <UserRound className="size-4" />
            Novo paciente
          </Link>
        </div>

        <div className="card p-4">
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, diagnóstico ou queixa…"
              className="w-full rounded-full border border-line bg-bg py-2.5 pr-4 pl-10 text-[13px] text-brand outline-none placeholder:text-muted focus:border-surface"
            />
          </label>
        </div>

        {!ready ? (
          <p className="py-12 text-center text-[13px] text-muted">
            Carregando prontuários…
          </p>
        ) : filtered.length === 0 ? (
          <article className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
              <FileText className="size-6" />
            </span>
            <h2 className="text-lg font-bold text-brand">
              {query ? "Nenhum prontuário encontrado" : "Nenhum paciente cadastrado"}
            </h2>
            <p className="max-w-md text-[13px] leading-relaxed text-muted">
              {query
                ? "Tente outro termo de busca."
                : "Cadastre um paciente para começar o prontuário clínico."}
            </p>
          </article>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p) => {
              const reportCount =
                reportCountByName.get(p.fullName.trim().toLowerCase()) ?? 0;
              const clinical = hasClinicalContent(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/pacientes?id=${encodeURIComponent(p.id)}`}
                    className="card flex h-full flex-col gap-3 p-4 transition-colors hover:border-surface hover:bg-surface-soft/40"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={resolveAvatar(p.avatar)}
                        alt={p.fullName}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-brand">
                            {p.fullName}
                          </p>
                          <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-muted">
                            {statusLabel(p.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted">
                          {p.approach || "Abordagem não informada"}
                          {p.preferredMode ? ` · ${p.preferredMode}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[12px]">
                      <p className="line-clamp-2 text-muted">
                        <span className="font-semibold text-brand">Queixa: </span>
                        {p.chiefComplaint.trim() || "—"}
                      </p>
                      <p className="line-clamp-2 text-muted">
                        <span className="font-semibold text-brand">
                          Diagnóstico:{" "}
                        </span>
                        {p.diagnosis.trim() || "—"}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                        {reportCount}{" "}
                        {reportCount === 1 ? "relato" : "relatos"}
                      </span>
                      {!clinical && (
                        <span className="rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-muted">
                          Dados clínicos incompletos
                        </span>
                      )}
                      <span className="ml-auto text-[12px] font-semibold text-brand">
                        Abrir ficha
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
