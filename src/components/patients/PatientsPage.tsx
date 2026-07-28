"use client";

import { ClipboardList, FileText, LayoutGrid, List, Mail, MapPin, Phone, Plus, Search, UserRound, Video } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { PatientForm } from "@/components/patients/PatientForm";
import { Avatar } from "@/components/shared/Avatar";
import { BillingBadge } from "@/components/shared/BillingBadge";
import { usePatients } from "@/hooks/usePatients";
import { usePendencies } from "@/hooks/usePendencies";
import { fetchSessionUser, getCachedUser } from "@/lib/auth";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { pendencyHref, pendencyLabel } from "@/lib/pendencies";
import {
  emptyPatient,
  ensurePatientByName,
  formatDateBr,
  statusLabel,
  type Patient,
} from "@/lib/patients";
import {
  FREE_PATIENT_LIMIT,
  canAddPatient,
  hasFinanceAccess,
} from "@/lib/plans";

type ViewMode = "cards" | "list";

export function PatientsPage() {
  const searchParams = useSearchParams();
  const { patients, setPatients, hydrated } = usePatients();
  const { pendencies } = usePendencies();
  const [nameFilter, setNameFilter] = useState("");
  const [startSort, setStartSort] = useState<"recent" | "oldest">("recent");
  const [statusFilter, setStatusFilter] = useState<"todos" | Patient["status"]>(
    "todos",
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [plan, setPlan] = useState(getCachedUser()?.plan ?? "");
  const [limitError, setLimitError] = useState("");
  const deeplinkHandled = useRef(false);

  useEffect(() => {
    void fetchSessionUser().then((user) => {
      if (user) setPlan(user.plan);
    });
  }, []);

  const atPatientLimit = !canAddPatient(plan, patients.length);

  useEffect(() => {
    if (!hydrated || deeplinkHandled.current) return;
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const status = searchParams.get("status");
    const wantsNew = searchParams.get("new") === "1";

    if (status === "ativo" || status === "pausado" || status === "alta") {
      setStatusFilter(status);
    }

    if (!id && !name && !wantsNew) {
      if (status) deeplinkHandled.current = true;
      return;
    }

    deeplinkHandled.current = true;
    if (wantsNew) {
      setEditing(null);
      setFormOpen(true);
      return;
    }
    if (id) {
      const found = patients.find((p) => p.id === id);
      if (found) {
        setEditing(found);
        setFormOpen(true);
      }
      return;
    }
    if (name) {
      const stub = ensurePatientByName(decodeURIComponent(name));
      setEditing(stub);
      setFormOpen(true);
    }
  }, [hydrated, searchParams, patients]);

  function pendenciesFor(patient: Patient) {
    return pendencies.filter(
      (p) =>
        p.status === "pending" &&
        (p.patientId === patient.id ||
          p.patientName.toLowerCase() === patient.fullName.toLowerCase()),
    );
  }

  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    const list = patients.filter((p) => {
      const matchStatus =
        statusFilter === "todos" ? true : p.status === statusFilter;
      const matchName =
        !name ||
        p.fullName.toLowerCase().includes(name) ||
        p.socialName.toLowerCase().includes(name);
      return matchStatus && matchName;
    });

    return [...list].sort((a, b) => {
      const da = a.startedAt || "";
      const db = b.startedAt || "";
      if (startSort === "recent") return db.localeCompare(da);
      return da.localeCompare(db);
    });
  }, [patients, nameFilter, startSort, statusFilter]);

  const hasActiveFilters =
    Boolean(nameFilter.trim()) || statusFilter !== "todos";

  function clearFilters() {
    setNameFilter("");
    setStatusFilter("todos");
    setStartSort("recent");
  }

  function openCreate() {
    if (atPatientLimit) {
      setLimitError(
        `Plano gratuito: limite de ${FREE_PATIENT_LIMIT} pacientes. Faça upgrade para o Pro.`,
      );
      return;
    }
    setLimitError("");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(patient: Patient) {
    setLimitError("");
    setEditing(patient);
    setFormOpen(true);
  }

  async function handleSave(
    data: ReturnType<typeof emptyPatient> & { avatar: string },
    id?: string,
  ) {
    const avatar = data.avatar?.trim() ? data.avatar : DEFAULT_AVATAR;

    if (id) {
      await setPatients((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...data,
                avatar,
              }
            : p,
        ),
      );
      return;
    }

    if (!canAddPatient(plan, patients.length)) {
      setLimitError(
        `Plano gratuito: limite de ${FREE_PATIENT_LIMIT} pacientes. Faça upgrade para o Pro.`,
      );
      throw new Error("patient_limit");
    }

    const newPatient: Patient = {
      ...data,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      avatar,
    };
    await setPatients((prev) => [newPatient, ...prev]);
  }

  const counts = {
    todos: patients.length,
    ativo: patients.filter((p) => p.status === "ativo").length,
    pausado: patients.filter((p) => p.status === "pausado").length,
    alta: patients.filter((p) => p.status === "alta").length,
  };

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-4">
        <Header />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Pacientes
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Cadastro completo, busca e acompanhamento clínico
              {plan === "free"
                ? ` · ${patients.length}/${FREE_PATIENT_LIMIT} no plano gratuito`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={atPatientLimit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" />
            Novo paciente
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/pacientes/relatos"
            className="card flex items-center gap-3 p-4 transition-colors hover:border-surface hover:bg-surface-soft/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-brand">
              <ClipboardList className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-brand">
                Relatos de sessões
              </p>
              <p className="text-[12px] text-muted">
                Resumos e evoluções de cada atendimento
              </p>
            </div>
          </Link>
          <Link
            href="/pacientes/prontuarios"
            className="card flex items-center gap-3 p-4 transition-colors hover:border-surface hover:bg-surface-soft/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-brand">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-brand">Prontuários</p>
              <p className="text-[12px] text-muted">
                Queixa, diagnóstico e histórico clínico
              </p>
            </div>
          </Link>
        </div>

        {limitError && (
          <div className="rounded-2xl border border-orange/30 bg-orange/10 px-4 py-3 text-[13px] text-brand">
            {limitError}{" "}
            <Link href="/onboarding" className="font-bold underline">
              Ver planos
            </Link>
          </div>
        )}

        {!hasFinanceAccess(plan) && plan === "free" && (
          <div className="rounded-2xl border border-line bg-card px-4 py-3 text-[13px] text-muted">
            No plano gratuito o módulo Financeiro fica bloqueado.{" "}
            <Link href="/onboarding" className="font-semibold text-brand underline">
              Conhecer o Pro
            </Link>
          </div>
        )}

        <div className="card flex flex-col gap-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto]">
            <label className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Nome
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Filtrar por nome do paciente"
                  className="w-full rounded-full border border-line bg-bg py-2.5 pr-4 pl-10 text-[13px] text-brand outline-none placeholder:text-muted focus:border-surface"
                />
              </span>
            </label>

            <label className="min-w-0 sm:min-w-[240px]">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Início do processo
              </span>
              <select
                value={startSort}
                onChange={(e) =>
                  setStartSort(e.target.value as "recent" | "oldest")
                }
                className="w-full rounded-full border border-line bg-bg px-3.5 py-2.5 text-[13px] text-brand outline-none focus:border-surface"
              >
                <option value="recent">Mais recentes primeiro</option>
                <option value="oldest">Mais antigos primeiro</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "todos" as const, label: `Todos (${counts.todos})` },
                  { id: "ativo" as const, label: `Ativos (${counts.ativo})` },
                  {
                    id: "pausado" as const,
                    label: `Pausados (${counts.pausado})`,
                  },
                  { id: "alta" as const, label: `Alta (${counts.alta})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    statusFilter === f.id
                      ? "bg-surface text-brand"
                      : "bg-bg text-muted hover:text-brand"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[12px] font-semibold text-muted transition-colors hover:text-brand"
                >
                  Limpar filtros
                </button>
              )}
              <div className="relative flex rounded-full border border-line bg-bg p-0.5">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0.5 left-0.5 size-8 rounded-full bg-surface shadow-[0_1px_2px_rgba(20,22,26,0.06)] transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transform:
                      viewMode === "list" ? "translateX(100%)" : "translateX(0)",
                  }}
                />
                <button
                  type="button"
                  aria-label="Ver em cards"
                  onClick={() => setViewMode("cards")}
                  className={`relative z-10 flex size-8 items-center justify-center rounded-full transition-colors duration-300 ${
                    viewMode === "cards"
                      ? "text-brand"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Ver em lista"
                  onClick={() => setViewMode("list")}
                  className={`relative z-10 flex size-8 items-center justify-center rounded-full transition-colors duration-300 ${
                    viewMode === "list"
                      ? "text-brand"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-muted">
            {filtered.length} paciente{filtered.length === 1 ? "" : "s"} encontrado
            {filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
              <UserRound className="size-6" />
            </span>
            <h2 className="text-lg font-bold text-brand">Nenhum paciente encontrado</h2>
            <p className="max-w-sm text-[13px] text-muted">
              Ajuste a busca ou cadastre um novo paciente.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-1 rounded-full bg-orange px-5 py-2.5 text-[13px] font-bold text-brand"
            >
              Cadastrar paciente
            </button>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((patient) => {
              const pending = pendenciesFor(patient);
              return (
              <button
                key={patient.id}
                type="button"
                onClick={() => openEdit(patient)}
                className="card flex flex-col gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(20,22,26,0.06)]"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={patient.avatar}
                    alt={patient.fullName}
                    size={48}
                    className="size-12 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-[15px] font-bold text-brand">
                        {patient.socialName || patient.fullName}
                      </h3>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            patient.status === "ativo"
                              ? "bg-surface text-brand"
                              : patient.status === "pausado"
                                ? "bg-yellow/30 text-brand"
                                : "bg-bg text-muted"
                          }`}
                        >
                          {statusLabel(patient.status)}
                        </span>
                        <BillingBadge patient={patient} />
                      </div>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted">
                      {patient.approach} · {patient.sessionFrequency}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[12px] text-muted">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="size-3.5 shrink-0" />
                    {patient.email || "Sem e-mail"}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Phone className="size-3.5 shrink-0" />
                    {patient.phone || "Sem telefone"}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    {patient.preferredMode === "Presencial" ? (
                      <MapPin className="size-3.5 shrink-0" />
                    ) : (
                      <Video className="size-3.5 shrink-0" />
                    )}
                    {patient.preferredMode}
                    {patient.sessionValue
                      ? ` · R$ ${patient.sessionValue}`
                      : ""}
                  </p>
                </div>

                {patient.chiefComplaint && (
                  <p className="line-clamp-2 rounded-xl border border-line bg-bg px-3 py-2 text-[12px] leading-relaxed text-brand">
                    {patient.chiefComplaint}
                  </p>
                )}

                {pending.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pending.map((p) => (
                      <Link
                        key={p.id}
                        href={pendencyHref(p)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-orange/15 px-2.5 py-1 text-[10px] font-bold text-orange transition-colors hover:bg-orange/25"
                      >
                        Pendente: {pendencyLabel(p.type)}
                      </Link>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-muted">
                  Desde {formatDateBr(patient.startedAt)}
                </p>
              </button>
              );
            })}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">Paciente</th>
                    <th className="px-4 py-3 font-semibold">Contato</th>
                    <th className="px-4 py-3 font-semibold">Modalidade</th>
                    <th className="px-4 py-3 font-semibold">Início</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Pendências</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((patient) => {
                    const pending = pendenciesFor(patient);
                    return (
                      <tr
                        key={patient.id}
                        onClick={() => openEdit(patient)}
                        className="cursor-pointer border-b border-line last:border-b-0 transition-colors hover:bg-bg"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={patient.avatar}
                              alt={patient.fullName}
                              size={36}
                              className="size-9 shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-brand">
                                {patient.socialName || patient.fullName}
                              </p>
                              <p className="truncate text-[11px] text-muted">
                                {patient.approach} · {patient.sessionFrequency}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate text-[12px] text-brand">
                            {patient.phone || "—"}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {patient.email || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-brand">
                          {patient.preferredMode}
                          {patient.sessionValue
                            ? ` · R$ ${patient.sessionValue}`
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-brand">
                          {formatDateBr(patient.startedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                patient.status === "ativo"
                                  ? "bg-surface text-brand"
                                  : patient.status === "pausado"
                                    ? "bg-yellow/30 text-brand"
                                    : "bg-bg text-muted"
                              }`}
                            >
                              {statusLabel(patient.status)}
                            </span>
                            <BillingBadge patient={patient} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {pending.length === 0 ? (
                            <span className="text-[12px] text-muted">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {pending.map((p) => (
                                <Link
                                  key={p.id}
                                  href={pendencyHref(p)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange transition-colors hover:bg-orange/25"
                                >
                                  {pendencyLabel(p.type)}
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <PatientForm
          initial={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
