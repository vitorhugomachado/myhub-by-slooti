"use client";

import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  History,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChargeEditDrawer } from "@/components/financeiro/ChargeEditDrawer";
import { BillingBadge, RenewalPill } from "@/components/shared/BillingBadge";
import { PaidMark } from "@/components/shared/PaidMark";
import { useFinance } from "@/hooks/useFinance";
import {
  AGENDA_TODAY,
  getAppointmentDate,
  type DatedAppointment,
} from "@/lib/agenda";
import { billingModeLabel, needsPackageRenewal } from "@/lib/billing";
import {
  DEFAULT_SESSION_VALUE,
  formatBRL,
  kindFinanceLabel,
  type FinanceCharge,
} from "@/lib/finance";
import {
  getPatientProfile,
  type Appointment,
} from "@/lib/mock-data";

type MeetLink = {
  meetingUri: string;
  mock: boolean;
};

type TabId = "sessao" | "prontuarios" | "historico" | "pagamento";

export function QuickPatientCard({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const profile = getPatientProfile(appointment.id)!;
  const {
    paid,
    entryFor,
    receiveAppointment,
    patientByName,
    saveCharge,
  } = useFinance();
  const [visible, setVisible] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("sessao");
  const [meet, setMeet] = useState<MeetLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTab("sessao");
    setMeet(null);
    setError(null);
    void fetch(`/api/meet/create?appointmentId=${appointment.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.link) setMeet(data.link);
      });
  }, [appointment.id]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

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
        window.location.href = `/api/auth/google?returnTo=${encodeURIComponent("/")}`;
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
    ? `Olá, ${appointment.patient}! Segue o link da nossa sessão (${appointment.start}):\n${meet.meetingUri}\n\nAté já — MyHub`
    : "";

  async function copyLink() {
    if (!meet) return;
    await navigator.clipboard.writeText(meet.meetingUri);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const isLive = appointment.status === "now";
  const apptDate = getAppointmentDate(appointment.id) ?? AGENDA_TODAY;
  const isPaid = paid(appointment.id, {
    date: apptDate,
    patientName: appointment.patient,
  });
  const financeEntry = entryFor(appointment.id, {
    date: apptDate,
    patientName: appointment.patient,
  });
  const patient = patientByName(appointment.patient);
  const renew = needsPackageRenewal(patient);
  const amount =
    financeEntry?.kind === "consumo_pacote"
      ? 0
      : financeEntry?.amount ??
        (renew
          ? Number(patient?.packagePrice || DEFAULT_SESSION_VALUE)
          : Number(patient?.sessionValue || DEFAULT_SESSION_VALUE));

  function handleReceive() {
    const dated: DatedAppointment = { ...appointment, date: apptDate };
    receiveAppointment(dated, {
      amount,
      method: (patient?.paymentMethod || "Pix") as FinanceCharge["method"],
    });
  }

  function openEdit() {
    setEditOpen(true);
  }

  const editCharge: FinanceCharge =
    financeEntry ??
    ({
      id: `f-appt-${appointment.id}`,
      appointmentId: appointment.id,
      patientId: patient?.id,
      patientName: appointment.patient,
      date: apptDate,
      description: renew
        ? `Renovação de pacote — ${appointment.type}`
        : `Sessão — ${appointment.type}`,
      amount,
      method: (patient?.paymentMethod || "Pix") as FinanceCharge["method"],
      status: "pendente",
      kind: renew ? "renovacao_pacote" : "sessao_avulsa",
    } satisfies FinanceCharge);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={handleClose}
        className={`absolute inset-0 bg-brand/25 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Acesso rápido — ${profile.fullName}`}
        className={`relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src={appointment.avatar}
              alt={profile.fullName}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold tracking-tight text-brand">
                  {profile.fullName}
                </h2>
                {isPaid && <PaidMark />}
                {renew && <RenewalPill />}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isLive
                      ? "bg-orange text-brand"
                      : appointment.status === "done"
                        ? "bg-surface text-brand"
                        : "bg-yellow/30 text-brand"
                  }`}
                >
                  {isLive
                    ? "Agora"
                    : appointment.status === "done"
                      ? "Concluído"
                      : "Próxima"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-muted">
                {appointment.type} · {appointment.start} – {appointment.end}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:text-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
          {(
            [
              { id: "sessao" as const, label: "Sessão", icon: Video },
              { id: "prontuarios" as const, label: "Prontuários", icon: FileText },
              { id: "historico" as const, label: "Sessões", icon: History },
              { id: "pagamento" as const, label: "Pagamento", icon: CreditCard },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "bg-surface text-brand"
                    : "text-muted hover:bg-bg hover:text-brand"
                }`}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "sessao" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-2xl border border-line bg-bg p-3">
                  <p className="font-semibold uppercase tracking-wide text-muted">
                    Contato
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-medium text-brand">
                    <Phone className="size-3.5" />
                    {profile.phone}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-bg p-3">
                  <p className="font-semibold uppercase tracking-wide text-muted">
                    Modalidade
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-medium text-brand">
                    {appointment.mode === "Online" ? (
                      <Video className="size-3.5" />
                    ) : (
                      <MapPin className="size-3.5" />
                    )}
                    {appointment.mode}
                  </p>
                </div>
              </div>

              <p className="rounded-2xl border border-line bg-bg p-3 text-[13px] leading-relaxed text-brand">
                {profile.notes}
              </p>

              {!meet ? (
                <button
                  type="button"
                  onClick={() => void generateLink()}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange py-3 text-[13px] font-bold text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  {loading ? "Gerando..." : "Gerar link do Meet"}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div className="rounded-2xl border border-line bg-bg p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Link Meet{meet.mock ? " · demo" : ""}
                    </p>
                    <p className="mt-1 break-all text-[12px] font-medium text-brand">
                      {meet.meetingUri}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-line bg-bg py-2 text-[11px] font-semibold text-brand"
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Ok" : "Copiar"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-line bg-bg py-2 text-[11px] font-semibold text-brand"
                    >
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(meet.meetingUri, "_blank", "noopener,noreferrer")
                      }
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-orange py-2 text-[11px] font-bold text-brand"
                    >
                      <Video className="size-3.5" />
                      Abrir
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {error}
                </p>
              )}
            </div>
          )}

          {tab === "prontuarios" && (
            <Placeholder
              icon={FileText}
              title="Prontuários"
              text="Módulo em construção. Em breve você registra evoluções por aqui."
            />
          )}
          {tab === "historico" && (
            <Placeholder
              icon={History}
              title="Registro de sessões"
              text="Histórico completo será criado em seguida."
            />
          )}
          {tab === "pagamento" && (
            <div className="space-y-4">
              {patient && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-bg px-3 py-2.5">
                  <BillingBadge patient={patient} />
                  <span className="text-[12px] text-muted">
                    Plano {billingModeLabel(patient.billingMode)}
                    {patient.billingMode === "pacote"
                      ? ` · ${patient.creditsLeft} crédito(s)`
                      : ` · R$ ${patient.sessionValue || DEFAULT_SESSION_VALUE}/sessão`}
                  </span>
                </div>
              )}

              {renew && (
                <p className="rounded-2xl border border-orange/20 bg-orange/10 px-4 py-3 text-[13px] text-brand">
                  Pacote esgotado. Na próxima sessão o paciente precisa pagar a
                  renovação (editável se houver imprevisto).
                </p>
              )}

              <div className="rounded-2xl border border-line bg-bg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {financeEntry
                        ? kindFinanceLabel(financeEntry.kind)
                        : renew
                          ? "Renovação de pacote"
                          : "Sessão"}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-brand">
                      {appointment.type}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {appointment.start} – {appointment.end}
                      {financeEntry?.method ? ` · ${financeEntry.method}` : ""}
                    </p>
                  </div>
                  {isPaid && <PaidMark className="size-7 text-[13px]" />}
                </div>
                <p className="mt-4 text-2xl font-bold tabular-nums text-brand">
                  {financeEntry?.kind === "consumo_pacote"
                    ? "1 crédito"
                    : formatBRL(amount)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {!isPaid && (
                  <button
                    type="button"
                    onClick={handleReceive}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-[13px] font-bold text-brand transition-opacity hover:opacity-90"
                  >
                    <Check className="size-4" />
                    Registrar recebimento
                  </button>
                )}
                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-bg py-3 text-[13px] font-semibold text-brand"
                >
                  Editar recebimento
                </button>
                {isPaid && (
                  <p className="text-center text-[12px] font-medium text-muted">
                    Recebimento confirmado — você ainda pode editar.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line px-5 py-3">
          <Link
            href={`/sessao/${appointment.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-bg py-2.5 text-[13px] font-semibold text-brand transition-colors hover:bg-surface-soft"
          >
            Abrir tela completa
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {editOpen && (
        <ChargeEditDrawer
          charge={editCharge}
          onClose={() => setEditOpen(false)}
          onSave={(charge) => {
            saveCharge(charge);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Placeholder({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileText;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-soft text-brand">
        <Icon className="size-5" />
      </span>
      <h3 className="text-[15px] font-bold text-brand">{title}</h3>
      <p className="max-w-xs text-[12px] leading-relaxed text-muted">{text}</p>
      <span className="mt-1 rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-muted">
        Em breve
      </span>
    </div>
  );
}
