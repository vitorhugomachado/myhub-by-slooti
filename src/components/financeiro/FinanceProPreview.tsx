"use client";

import {
  CircleDollarSign,
  Clock3,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { choosePlan } from "@/lib/auth";

const PREVIEW_STATS = [
  {
    label: "Recebido no mês",
    value: "R$ 4.280",
    hint: "12 sessões pagas",
    icon: Wallet,
  },
  {
    label: "A receber",
    value: "R$ 1.650",
    hint: "7 cobranças em aberto",
    icon: Clock3,
  },
  {
    label: "Pacotes a renovar",
    value: "3",
    hint: "risco de perda de receita",
    icon: CircleDollarSign,
  },
] as const;

const LOSS_POINTS = [
  "Você deixa de ver quanto entrou e quanto está atrasado — no escuro.",
  "Cobranças e pacotes ficam soltos: fácil esquecer renovação e perder paciente.",
  "Sem histórico financeiro, fica difícil aumentar ticket e planejar a clínica.",
];

const PRO_BENEFITS = [
  "Painel de recebidos, pendentes e atrasados",
  "Cobranças por sessão e pacotes com renovação",
  "Calendário financeiro ligado à agenda",
];

export function FinanceProPreview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function hirePro() {
    setError("");
    setLoading(true);
    try {
      const result = await choosePlan({ plan: "pro" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/onboarding?step=gateway");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[24px] border border-line bg-card">
      {/* Preview de fundo — preenche o quadro */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden p-4 sm:p-6"
        style={{ filter: "blur(6px)" }}
      >
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight text-brand">
              Financeiro
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              Visão do mês · cobranças e pacotes
            </p>
          </div>
          <span className="rounded-full bg-surface px-3.5 py-1.5 text-[11px] font-bold text-brand">
            + Nova cobrança
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {PREVIEW_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-bg p-3.5"
            >
              <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-surface-soft text-brand">
                <stat.icon className="size-3.5" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {stat.label}
              </p>
              <p className="mt-1 text-lg font-bold text-brand">{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-muted">{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2 rounded-2xl border border-line bg-bg p-3">
          {[
            "Carla Mendes · R$ 180 · pendente",
            "João Silva · R$ 720 · pacote",
            "Ana Costa · R$ 180 · pago",
            "Pedro Lima · R$ 360 · atrasado",
          ].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-[12px] text-brand"
            >
              <span>{row}</span>
              <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-bold">
                ver
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay — card inteiro no quadro */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto bg-card/50 px-3 py-3 backdrop-blur-[1.5px] sm:px-5 sm:py-4">
        <div className="my-auto w-full max-w-[420px] rounded-[22px] border border-line bg-card p-4 shadow-[0_16px_40px_rgba(20,22,26,0.12)] sm:p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-deep text-card">
              <Wallet className="size-4" />
            </span>
            <h2 className="text-[17px] font-bold tracking-tight text-brand sm:text-lg">
              Seu dinheiro está invisível
            </h2>
          </div>

          <p className="text-[12px] leading-relaxed text-muted sm:text-[13px]">
            No plano gratuito o financeiro fica trancado. Enquanto isso,
            cobranças atrasadas e pacotes sem renovação continuam — e você não
            vê o quanto está deixando na mesa.
          </p>

          <ul className="mt-3 space-y-2">
            {LOSS_POINTS.map((point) => (
              <li
                key={point}
                className="flex gap-2 text-[11px] leading-snug text-brand sm:text-[12px]"
              >
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-danger" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 rounded-2xl border border-accent-deep/25 bg-surface-soft/90 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-accent-deep uppercase">
              <Sparkles className="size-3 text-accent-deep" />
              Com o Pro você destrava
            </p>
            <ul className="space-y-1">
              {PRO_BENEFITS.map((b) => (
                <li key={b} className="text-[11px] text-brand sm:text-[12px]">
                  · {b}
                </li>
              ))}
            </ul>
          </div>

          {error ? (
            <p className="mt-2 text-[12px] text-danger">{error}</p>
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={() => void hirePro()}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-[13px] font-bold text-card transition-opacity disabled:opacity-60"
          >
            <Sparkles className="size-4" />
            {loading ? "Abrindo Pro…" : "Contratar plano Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
