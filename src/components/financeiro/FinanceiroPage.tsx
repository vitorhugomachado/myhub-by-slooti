"use client";

import {
  Check,
  CircleDollarSign,
  Clock3,
  Package,
  Pencil,
  Plus,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  ChargeEditDrawer,
  emptyManualCharge,
} from "@/components/financeiro/ChargeEditDrawer";
import { FinanceCalendar } from "@/components/financeiro/FinanceCalendar";
import { FinanceProPreview } from "@/components/financeiro/FinanceProPreview";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import { fetchSessionUser, getCachedUser } from "@/lib/auth";
import { AGENDA_TODAY, parseISODate, toLocalISODate } from "@/lib/agenda";
import {
  formatBRL,
  formatFinanceDate,
  isChargeSettled,
  kindFinanceLabel,
  statusFinanceLabel,
  type FinanceCharge,
  type PaymentStatus,
} from "@/lib/finance";
import { hasFinanceAccess } from "@/lib/plans";

type Period = "hoje" | "semana" | "mes";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function inPeriod(iso: string, period: Period, today: Date) {
  const [y, m, d] = iso.split("-").map(Number);
  const entry = new Date(y, m - 1, d);
  const todayStr = toLocalISODate(today);

  if (period === "hoje") return iso === todayStr;

  if (period === "semana") {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return entry >= start && entry <= end;
  }

  return (
    entry.getMonth() === today.getMonth() &&
    entry.getFullYear() === today.getFullYear()
  );
}

export function FinanceiroPage() {
  const [plan, setPlan] = useState(getCachedUser()?.plan ?? "");
  const [planReady, setPlanReady] = useState(Boolean(getCachedUser()));

  useEffect(() => {
    void fetchSessionUser().then((user) => {
      setPlan(user?.plan ?? "");
      setPlanReady(true);
    });
  }, []);

  const financeUnlocked = hasFinanceAccess(plan);

  if (!planReady) {
    return (
      <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <Header />
          <div className="mt-8 flex justify-center text-[13px] text-muted">
            Carregando…
          </div>
        </div>
      </div>
    );
  }

  if (!financeUnlocked) {
    return (
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-3">
          <Header />
          <div className="shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-brand sm:text-2xl">
              Financeiro
            </h1>
            <p className="mt-0.5 text-[12px] text-muted sm:text-[13px]">
              Prévia do painel Pro — veja o que você está deixando de controlar
            </p>
          </div>
          <FinanceProPreview />
        </div>
      </div>
    );
  }

  return <FinanceiroPageContent />;
}

function FinanceiroPageContent() {
  const {
    entries,
    patients,
    markPaid,
    receiveAppointment,
    saveCharge,
    createCharge,
    removeCharge,
    renewalCount,
  } = useFinance();
  const [period, setPeriod] = useState<Period>("mes");
  const [statusFilter, setStatusFilter] = useState<"todos" | PaymentStatus>(
    "todos",
  );
  const [editing, setEditing] = useState<FinanceCharge | null>(null);
  const [isNew, setIsNew] = useState(false);

  const referenceToday = useMemo(() => parseISODate(AGENDA_TODAY), []);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => inPeriod(e.date, period, referenceToday))
      .filter((e) =>
        statusFilter === "todos" ? true : e.status === statusFilter,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, period, statusFilter, referenceToday]);

  const periodEntries = useMemo(
    () => entries.filter((e) => inPeriod(e.date, period, referenceToday)),
    [entries, period, referenceToday],
  );

  const received = periodEntries
    .filter((e) => e.status === "pago" && e.kind !== "consumo_pacote")
    .reduce((sum, e) => sum + e.amount, 0);

  const toReceive = periodEntries
    .filter((e) => e.status === "pendente" || e.status === "atrasado")
    .reduce((sum, e) => sum + e.amount, 0);

  const paidCount = periodEntries.filter((e) => isChargeSettled(e)).length;
  const openCount = periodEntries.filter(
    (e) => e.status === "pendente" || e.status === "atrasado",
  ).length;

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <Header />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
              Financeiro
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Pacote, avulso e edição manual no dia do pagamento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsNew(true);
                setEditing(emptyManualCharge(AGENDA_TODAY));
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-[12px] font-bold text-brand"
            >
              <Plus className="size-3.5" />
              Novo lançamento
            </button>
            <div className="flex rounded-full border border-line bg-card p-1">
              {(
                [
                  { id: "hoje" as const, label: "Hoje" },
                  { id: "semana" as const, label: "Semana" },
                  { id: "mes" as const, label: "Mês" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${
                    period === p.id
                      ? "bg-surface text-brand"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Recebido"
            value={formatBRL(received)}
            hint={`${paidCount} quitado${paidCount === 1 ? "" : "s"}`}
            icon={Wallet}
            tone="bg-surface text-brand"
          />
          <SummaryCard
            label="A receber"
            value={formatBRL(toReceive)}
            hint={`${openCount} pendente${openCount === 1 ? "" : "s"}`}
            icon={Clock3}
            tone="bg-orange/15 text-orange"
          />
          <SummaryCard
            label="Renovar pacote"
            value={String(renewalCount)}
            hint="pacientes sem crédito"
            icon={Package}
            tone="bg-yellow/30 text-brand"
          />
          <SummaryCard
            label="Total do período"
            value={formatBRL(received + toReceive)}
            hint={`${periodEntries.length} lançamento${periodEntries.length === 1 ? "" : "s"}`}
            icon={CircleDollarSign}
            tone="bg-surface-soft text-brand"
          />
        </div>

        <FinanceCalendar
          entries={entries}
          patients={patients}
          onReceive={receiveAppointment}
          onEdit={(charge) => {
            setIsNew(false);
            setEditing(charge);
          }}
        />

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-bold text-brand">Lançamentos</h2>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "todos" as const, label: "Todos" },
                  { id: "pago" as const, label: "Pagos" },
                  { id: "pendente" as const, label: "Pendentes" },
                  { id: "atrasado" as const, label: "Atrasados" },
                  { id: "isento" as const, label: "Isentos" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    statusFilter === f.id
                      ? "bg-surface text-brand"
                      : "bg-bg text-muted hover:text-brand"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-muted">
              Nenhum lançamento neste filtro.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-brand">
                        {entry.patientName}
                      </p>
                      {isChargeSettled(entry) && <PaidMark />}
                      <StatusPill status={entry.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted">
                      {entry.description} · {kindFinanceLabel(entry.kind)} ·{" "}
                      {entry.method}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-right">
                      <p className="text-[14px] font-bold tabular-nums text-brand">
                        {entry.kind === "consumo_pacote"
                          ? "Crédito"
                          : formatBRL(entry.amount)}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatFinanceDate(entry.date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing(entry);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-2 text-[12px] font-semibold text-brand"
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </button>
                      {!isChargeSettled(entry) ? (
                        <button
                          type="button"
                          onClick={() => markPaid(entry.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[12px] font-bold text-brand"
                        >
                          <Check className="size-3.5" />
                          Recebi
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <ChargeEditDrawer
          charge={editing}
          title={isNew ? "Novo lançamento" : "Editar recebimento"}
          onClose={() => {
            setEditing(null);
            setIsNew(false);
          }}
          onSave={(charge) => {
            if (isNew) createCharge(charge);
            else saveCharge(charge);
            setEditing(null);
            setIsNew(false);
          }}
          onDelete={
            isNew
              ? undefined
              : (id) => {
                  removeCharge(id);
                  setEditing(null);
                  setIsNew(false);
                }
          }
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
  tone: string;
}) {
  return (
    <article className="card flex items-start gap-3 p-4">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-brand">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const styles =
    status === "pago"
      ? "bg-surface text-brand"
      : status === "atrasado"
        ? "bg-orange/15 text-orange"
        : status === "isento"
          ? "bg-bg text-muted"
          : "bg-yellow/30 text-brand";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles}`}
    >
      {statusFinanceLabel(status)}
    </span>
  );
}
