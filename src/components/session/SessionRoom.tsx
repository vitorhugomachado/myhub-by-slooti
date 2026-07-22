"use client";

import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  History,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  UserRound,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Appointment, PatientProfile } from "@/lib/mock-data";

type MeetLink = {
  meetingUri: string;
  spaceName?: string;
  mock: boolean;
};

type GoogleStatus = {
  configured: boolean;
  connected: boolean;
};

type TabId = "sessao" | "prontuarios" | "historico" | "pagamento";

const tabs: { id: TabId; label: string; icon: typeof Video }[] = [
  { id: "sessao", label: "Sessão", icon: Video },
  { id: "prontuarios", label: "Prontuários", icon: FileText },
  { id: "historico", label: "Registro de sessões", icon: History },
  { id: "pagamento", label: "Pagamento", icon: CreditCard },
];

export function SessionRoom({
  appointment,
  profile,
}: {
  appointment: Appointment;
  profile: PatientProfile;
}) {
  const [tab, setTab] = useState<TabId>("sessao");
  const [meet, setMeet] = useState<MeetLink | null>(null);
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);

    void Promise.all([
      fetch(`/api/meet/create?appointmentId=${appointment.id}`).then((r) =>
        r.json(),
      ),
      fetch("/api/auth/google/status").then((r) => r.json()),
    ]).then(([meetRes, googleRes]) => {
      if (meetRes.link) setMeet(meetRes.link);
      setStatus(googleRes);
    });
  }, [appointment.id]);

  const generateLink = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/meet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });
      const data = await res.json();

      if (res.status === 401 && data.error === "google_not_connected") {
        window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(
          `/sessao/${appointment.id}`,
        )}`;
        return;
      }

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Não foi possível gerar o link");
        return;
      }

      setMeet(data);
    } catch {
      setError("Erro de rede ao gerar o link");
    } finally {
      setLoading(false);
    }
  }, [appointment.id]);

  const shareText = meet
    ? `Olá, ${appointment.patient}! Segue o link da nossa sessão de hoje (${appointment.start}):\n${meet.meetingUri}\n\nAté já — MyHub`
    : "";

  async function copyLink() {
    if (!meet) return;
    await navigator.clipboard.writeText(meet.meetingUri);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!meet) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function shareEmail() {
    if (!meet) return;
    const subject = `Link da sessão — ${appointment.start}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
  }

  async function nativeShare() {
    if (!meet || !navigator.share) return;
    try {
      await navigator.share({
        title: `Sessão com ${appointment.patient}`,
        text: shareText,
        url: meet.meetingUri,
      });
    } catch {
      // cancelado
    }
  }

  function openMeet() {
    if (!meet) return;
    window.open(meet.meetingUri, "_blank", "noopener,noreferrer");
  }

  const isLive = appointment.status === "now";

  return (
    <div
      className={`flex min-h-screen flex-col bg-bg transition-all duration-300 ease-out ${
        entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-4" />
            Voltar ao hub
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isLive ? "bg-orange text-brand" : "bg-surface-soft text-brand"
              }`}
            >
              {isLive ? "Em atendimento" : appointment.status === "upcoming" ? "Próxima" : "Concluída"}
            </span>
            <span className="hidden text-[13px] font-medium text-muted sm:inline">
              {appointment.start} – {appointment.end}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:gap-5">
        {/* Patient sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[320px]">
          <article className="card p-5">
            <div className="flex items-center gap-3.5">
              <Image
                src={appointment.avatar}
                alt={profile.fullName}
                width={64}
                height={64}
                className="size-16 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-brand">
                  {profile.fullName}
                </h1>
                <p className="mt-0.5 text-[13px] text-muted">{appointment.type}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-[13px]">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    E-mail
                  </dt>
                  <dd className="font-medium text-brand">{profile.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Telefone
                  </dt>
                  <dd className="font-medium text-brand">{profile.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <UserRound className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Nascimento · CPF
                  </dt>
                  <dd className="font-medium text-brand">
                    {profile.birthDate} · {profile.cpf}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                {appointment.mode === "Online" ? (
                  <Video className="mt-0.5 size-4 shrink-0 text-muted" />
                ) : (
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                )}
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Modalidade · Paciente desde
                  </dt>
                  <dd className="font-medium text-brand">
                    {appointment.mode} · {profile.since}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl border border-line bg-bg p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Nota rápida
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand">
                {profile.notes}
              </p>
            </div>
          </article>

          <Link
            href="/pacientes"
            className="card inline-flex items-center justify-center gap-2 p-3.5 text-[13px] font-semibold text-brand transition-colors hover:bg-surface-soft"
          >
            <ClipboardList className="size-4" />
            Cadastro completo
          </Link>
        </aside>

        {/* Main panel */}
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <nav className="card flex flex-wrap gap-1 p-1.5">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[12px] font-semibold transition-colors sm:flex-none sm:px-4 ${
                    active
                      ? "bg-surface text-brand"
                      : "text-muted hover:bg-bg hover:text-brand"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {tab === "sessao" && (
            <article className="card flex flex-1 flex-col gap-5 p-5 sm:p-6">
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-brand">
                  Atendimento virtual
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Gere o link do Meet, compartilhe com o paciente e abra a reunião em outra aba.
                </p>
              </div>

              {status?.configured && !status.connected && (
                <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-muted">
                    Conecte o Google uma vez para gerar links reais do Meet.
                  </p>
                  <a
                    href={`/api/auth/google?returnTo=${encodeURIComponent(`/sessao/${appointment.id}`)}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-card"
                  >
                    Conectar Google
                  </a>
                </div>
              )}

              {!meet ? (
                <button
                  type="button"
                  onClick={() => void generateLink()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange py-3.5 text-[14px] font-bold text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  {loading ? "Gerando link..." : "Gerar link do Meet"}
                </button>
              ) : (
                <>
                  <div className="rounded-2xl border border-line bg-bg p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Link da reunião
                      {meet.mock ? " · demo" : ""}
                    </p>
                    <p className="mt-1 break-all text-[13px] font-medium text-brand">
                      {meet.meetingUri}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-bg py-2.5 text-[12px] font-semibold text-brand hover:bg-surface-soft"
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                    <button
                      type="button"
                      onClick={shareWhatsApp}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-bg py-2.5 text-[12px] font-semibold text-brand hover:bg-surface-soft"
                    >
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={shareEmail}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-bg py-2.5 text-[12px] font-semibold text-brand hover:bg-surface-soft"
                    >
                      <Mail className="size-3.5" />
                      E-mail
                    </button>
                    {canShare && (
                      <button
                        type="button"
                        onClick={() => void nativeShare()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-bg py-2.5 text-[12px] font-semibold text-brand hover:bg-surface-soft"
                      >
                        <Share2 className="size-3.5" />
                        Compartilhar
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={openMeet}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange py-3.5 text-[14px] font-bold text-brand transition-opacity hover:opacity-90"
                  >
                    <Video className="size-4" />
                    Abrir Meet
                    <ExternalLink className="size-3.5 opacity-70" />
                  </button>
                </>
              )}

              {error && (
                <p className="rounded-2xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
                  {error}
                </p>
              )}
            </article>
          )}

          {tab === "prontuarios" && (
            <ComingSoon
              icon={FileText}
              title="Prontuários"
              description="Aqui você vai registrar evoluções, anexos e anotações clínicas do paciente. Este módulo será criado em seguida."
            />
          )}

          {tab === "historico" && (
            <ComingSoon
              icon={History}
              title="Registro de sessões"
              description="Histórico completo de atendimentos, duração, modalidade e resumos. Em breve você poderá consultar e filtrar tudo por aqui."
            />
          )}

          {tab === "pagamento" && (
            <ComingSoon
              icon={CreditCard}
              title="Pagamento"
              description="Controle de sessões pagas, pendentes e recibimentos. Este módulo será criado em seguida."
            />
          )}
        </section>
      </div>
    </div>
  );
}

function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <article className="card flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
        <Icon className="size-6" />
      </span>
      <h2 className="text-lg font-bold tracking-tight text-brand">{title}</h2>
      <p className="max-w-md text-[13px] leading-relaxed text-muted">{description}</p>
      <span className="mt-2 rounded-full bg-bg px-3 py-1 text-[11px] font-semibold text-muted">
        Em breve
      </span>
    </article>
  );
}
