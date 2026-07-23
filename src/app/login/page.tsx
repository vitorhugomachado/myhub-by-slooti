"use client";

import { Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  fetchSessionUser,
  loginWithEmail,
  signUpWithEmail,
} from "@/lib/auth";

type Mode = "login" | "signup";

const inputClass =
  "w-full rounded-xl border border-line bg-card/80 px-3.5 py-3 text-[13px] text-brand outline-none transition-colors placeholder:text-muted/70 focus:border-surface focus:bg-card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    void fetchSessionUser().then((user) => {
      if (user) router.replace("/");
    });

    const google = searchParams.get("google");
    if (google === "missing") {
      setError(
        "Google OAuth não configurado. Defina as variáveis no .env.local ou use e-mail e senha.",
      );
      setGoogleConfigured(false);
    } else if (google === "denied") {
      setError("Login com Google foi cancelado.");
    } else if (google === "error") {
      setError("Falha ao autenticar com o Google. Tente novamente.");
    }

    void fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => {
        setGoogleConfigured(Boolean(data.configured));
      })
      .catch(() => setGoogleConfigured(false));
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirm) {
          setError("As senhas não coincidem.");
          return;
        }
        const result = await signUpWithEmail({ name, email, password });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.replace("/");
        return;
      }

      const result = await loginWithEmail({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent("/auth/callback")}`;
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,#eefff5_0%,transparent_45%),radial-gradient(ellipse_at_90%_80%,#d8ffe8_0%,transparent_40%),linear-gradient(160deg,#f4f5f7_0%,#eef2f0_50%,#f7faf8_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-surface/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-accent-deep/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        {/* Brand panel */}
        <aside className="flex flex-1 flex-col justify-center lg:max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand text-card shadow-sm">
              <TrendingUp className="size-6" strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
              MyHub
            </p>
          </div>
          <h1 className="mt-6 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-brand sm:text-4xl">
            Seu consultório digital, em um só lugar.
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
            Pacientes, agenda e financeiro — feito para a rotina de quem
            atende.
          </p>
        </aside>

        {/* Auth card */}
        <section className="w-full max-w-md shrink-0">
          <div className="overflow-hidden rounded-[28px] border border-line/80 bg-card/95 shadow-[0_24px_80px_rgba(20,22,26,0.1)] backdrop-blur-sm">
            <div className="border-b border-line px-6 py-5">
              <div className="flex rounded-full bg-bg p-1">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors ${
                    mode === "login"
                      ? "bg-card text-brand shadow-sm"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors ${
                    mode === "signup"
                      ? "bg-card text-brand shadow-sm"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  Criar conta
                </button>
              </div>
              <p className="mt-4 text-[13px] text-muted">
                {mode === "login"
                  ? "Acesse sua conta para continuar."
                  : "Crie sua conta de profissional em poucos segundos."}
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={!googleConfigured || googleLoading}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-card py-3 text-[13px] font-semibold text-brand transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continuar com Google
              </button>

              {!googleConfigured && (
                <p className="text-center text-[11px] text-muted">
                  Google indisponível neste ambiente — use e-mail e senha.
                </p>
              )}

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  ou
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "signup" && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Nome completo
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                      placeholder="Ana Silva"
                      required
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    autoComplete="email"
                    placeholder="voce@email.com"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Senha
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-11`}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      placeholder="••••••••"
                      minLength={mode === "signup" ? 6 : undefined}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </label>

                {mode === "signup" && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Confirmar senha
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </label>
                )}

                {error && (
                  <p className="rounded-xl bg-danger/10 px-3 py-2 text-[12px] text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3.5 text-[13px] font-bold text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {mode === "login" ? "Entrar" : "Criar conta"}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted">
            Ao continuar, você concorda com o uso do MyHub no seu navegador.
            Dados ficam salvos localmente nesta demo.
          </p>
        </section>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
