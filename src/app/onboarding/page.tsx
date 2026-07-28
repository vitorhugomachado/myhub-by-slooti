"use client";

import {
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  choosePlan,
  fetchSessionUser,
  type AuthSessionUser,
} from "@/lib/auth";
import {
  FREE_PATIENT_LIMIT,
  PAYMENT_GATEWAYS,
  type PaymentGateway,
  type PlanId,
} from "@/lib/plans";

type Step = "plan" | "invite" | "gateway";

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchSessionUser().then((session) => {
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session);
      if (
        searchParams.get("step") === "gateway" ||
        (session.plan === "pro" && !session.paymentGateway)
      ) {
        setSelectedPlan("pro");
        setStep("gateway");
      } else if (searchParams.get("step") === "invite") {
        setSelectedPlan("pro");
        setStep("invite");
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  async function confirmFree() {
    setError("");
    setLoading(true);
    try {
      const result = await choosePlan({ plan: "free" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  async function confirmProGateway() {
    if (!gateway) {
      setError("Escolha um gateway de pagamento para continuar.");
      return;
    }
    if (user?.plan !== "pro" && !inviteCode.trim()) {
      setError("Informe o código de convite do Pro.");
      setStep("invite");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await choosePlan({
        plan: "pro",
        paymentGateway: gateway,
        inviteCode: inviteCode.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  function pickPlan(plan: PlanId) {
    setSelectedPlan(plan);
    setError("");
    if (plan === "free") {
      void confirmFree();
      return;
    }
    setStep("invite");
  }

  function continueInvite() {
    if (!inviteCode.trim()) {
      setError("Informe o código de convite.");
      return;
    }
    setError("");
    setStep("gateway");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,#eefff5_0%,transparent_45%),radial-gradient(ellipse_at_90%_80%,#d8ffe8_0%,transparent_40%),linear-gradient(160deg,#f4f5f7_0%,#eef2f0_50%,#f7faf8_100%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-brand text-card">
            <TrendingUp className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-brand">
              Neura
            </p>
            <p className="text-[12px] text-muted">
              Olá{user?.name ? `, ${user.name.split(" ")[0]}` : ""} — escolha
              como quer começar
            </p>
          </div>
        </div>

        {step === "plan" ? (
          <section className="overflow-hidden rounded-[28px] border border-line/80 bg-card/95 shadow-[0_24px_80px_rgba(20,22,26,0.1)]">
            <div className="border-b border-line px-6 py-5">
              <h1 className="text-xl font-extrabold tracking-tight text-brand sm:text-2xl">
                Qual plano combina com você?
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Você pode mudar de plano depois nas configurações.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => pickPlan("free")}
                className={`rounded-2xl border p-5 text-left transition-colors hover:border-surface disabled:opacity-60 ${
                  selectedPlan === "free"
                    ? "border-surface bg-surface-soft"
                    : "border-line bg-bg"
                }`}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-card text-brand">
                  <Users className="size-5" />
                </span>
                <p className="mt-4 text-[15px] font-bold text-brand">
                  Plano Gratuito
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  Ideal para começar. Até {FREE_PATIENT_LIMIT} pacientes,
                  agenda e prontuário.
                </p>
                <ul className="mt-4 space-y-2 text-[12px] text-brand">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent-deep" />
                    Até {FREE_PATIENT_LIMIT} pacientes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent-deep" />
                    Agenda e sessões
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <XMark />
                    Sem módulo financeiro
                  </li>
                </ul>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => pickPlan("pro")}
                className={`rounded-2xl border p-5 text-left transition-colors hover:border-orange disabled:opacity-60 ${
                  selectedPlan === "pro"
                    ? "border-orange bg-orange/10"
                    : "border-line bg-bg"
                }`}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-orange/20 text-brand">
                  <Sparkles className="size-5" />
                </span>
                <p className="mt-4 text-[15px] font-bold text-brand">
                  Plano Pro
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  Liberado por convite neste beta. Pacientes ilimitados e
                  financeiro.
                </p>
                <ul className="mt-4 space-y-2 text-[12px] text-brand">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent-deep" />
                    Pacientes ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent-deep" />
                    Módulo financeiro
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent-deep" />
                    Acesso por código de convite
                  </li>
                </ul>
              </button>
            </div>

            {error && (
              <p className="px-6 pb-5 text-[12px] text-danger">{error}</p>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 px-6 pb-5 text-[12px] text-muted">
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </div>
            )}
          </section>
        ) : step === "invite" ? (
          <section className="overflow-hidden rounded-[28px] border border-line/80 bg-card/95 shadow-[0_24px_80px_rgba(20,22,26,0.1)]">
            <div className="border-b border-line px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange">
                Plano Pro
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-brand sm:text-2xl">
                Código de convite
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                O Pro ainda não tem cobrança automática. Use o código que você
                recebeu da equipe Neura.
              </p>
            </div>
            <div className="space-y-4 p-6">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-brand">
                  Convite
                </span>
                <input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setError("");
                  }}
                  placeholder="Cole o código aqui"
                  className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[14px] text-brand outline-none focus:border-surface"
                />
              </label>
              {error ? (
                <p className="text-[12px] text-danger">{error}</p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep("plan");
                  setSelectedPlan(null);
                  setInviteCode("");
                }}
                className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!inviteCode.trim()}
                onClick={continueInvite}
                className="rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-line/80 bg-card/95 shadow-[0_24px_80px_rgba(20,22,26,0.1)]">
            <div className="border-b border-line px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange">
                Plano Pro
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-brand sm:text-2xl">
                Escolha o gateway de pagamento
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Preferência de provedor para quando a cobrança estiver ativa.
                As chaves podem ser configuradas depois.
              </p>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {PAYMENT_GATEWAYS.map((item) => {
                const active = gateway === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setGateway(item.id);
                      setError("");
                    }}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      active
                        ? "border-surface bg-surface-soft"
                        : "border-line bg-bg hover:border-surface"
                    }`}
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-xl bg-card text-brand">
                      <CreditCard className="size-4" />
                    </span>
                    <p className="mt-3 text-[14px] font-bold text-brand">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="px-6 text-[12px] text-danger">{error}</p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (user?.plan === "pro") {
                    setStep("plan");
                    setSelectedPlan(null);
                    setGateway(null);
                  } else {
                    setStep("invite");
                    setGateway(null);
                  }
                }}
                className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={loading || !gateway}
                onClick={() => void confirmProGateway()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand disabled:opacity-50"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Continuar com Pro
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function XMark() {
  return (
    <span className="inline-flex size-3.5 items-center justify-center text-[10px] font-bold text-muted">
      ×
    </span>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
