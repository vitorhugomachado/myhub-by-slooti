"use client";

import {
  CalendarDays,
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
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RescheduleDialog } from "@/components/sessoes/SessionManageDialogs";
import { SessionPaymentPanel } from "@/components/session/SessionPaymentPanel";
import { Avatar } from "@/components/shared/Avatar";
import { PaidMark } from "@/components/shared/PaidMark";
import { RenewalPill } from "@/components/shared/BillingBadge";
import { useFinance } from "@/hooks/useFinance";
import { useSchedule } from "@/hooks/useSchedule";
import { useSessionReports } from "@/hooks/useSessionReports";
import {
  AGENDA_TODAY,
  getAppointmentDate,
  type DatedAppointment,
} from "@/lib/agenda";
import { resolveAppointmentAvatar } from "@/lib/avatar";
import { needsPackageRenewal } from "@/lib/billing";
import { formatFinanceDate } from "@/lib/finance";
import { setStoredMeetLink } from "@/lib/meet-store";
import type { Appointment } from "@/lib/mock-data";

type MeetLink = {
  meetingUri: string;
  mock: boolean;
};

type TabId = "sessao" | "prontuarios" | "historico" | "pagamento";

function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function QuickPatientCard({
  appointment,
  onClose,
}: {
  appointment: Appointment | DatedAppointment;
  onClose: () => void;
}) {
  const { paid, patientByName } = useFinance();
  const { items, reschedule } = useSchedule();
  const [visible, setVisible] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("sessao");
  const [meet, setMeet] = useState<MeetLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  const dated = useMemo<DatedAppointment>(() => {
    const live = items.find((a) => a.id === appointment.id);
    if (live) return live;
    const date =
      "date" in appointment && appointment.date
        ? appointment.date
        : (getAppointmentDate(appointment.id) ?? AGENDA_TODAY);
    return { ...appointment, date };
  }, [appointment, items]);

  const { reports } = useSessionReports({ patientName: dated.patient });

  const patient = patientByName(dated.patient);
  const displayName = patient?.socialName || patient?.fullName || dated.patient;
  const phone = patient?.whatsapp || patient?.phone || "";
  const phoneTel = phoneDigits(phone);
  const notes =
    patient?.notes ||
    patient?.chiefComplaint ||
    "Sem observações cadastradas. Complete o cadastro do paciente.";
  const cadastroHref = patient
    ? `/pacientes?id=${encodeURIComponent(patient.id)}`
    : `/pacientes?name=${encodeURIComponent(dated.patient)}`;

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
    void fetch(`/api/meet/create?appointmentId=${dated.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.link) {
          setMeet(data.link);
          setStoredMeetLink(dated.id, data.link);
        }
      });
    void fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data: { connected?: boolean }) => {
        setGoogleConnected(Boolean(data.connected));
      })
      .catch(() => setGoogleConnected(false));
  }, [dated.id]);

  const history = useMemo(
    () =>
      items
        .filter(
          (a) =>
            a.patient.toLowerCase() === dated.patient.toLowerCase() &&
            a.status !== "cancelled",
        )
        .sort((a, b) => {
          const byDate = b.date.localeCompare(a.date);
          if (byDate !== 0) return byDate;
          return b.start.localeCompare(a.start);
        }),
    [items, dated.patient],
  );
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
        body: JSON.stringify({ appointmentId: dated.id }),
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
      setStoredMeetLink(dated.id, data);
    } catch {
      setError("Erro de rede ao gerar o link");
    } finally {
      setLoading(false);
    }
  }, [dated.id]);

  const shareText = meet
    ? `Olá, ${dated.patient}! Segue o link da nossa sessão (${dated.start}):\n${meet.meetingUri}\n\nAté já — Neura`
    : "";

  const whatsappHref = phoneTel
    ? `https://wa.me/55${phoneTel}${meet ? `?text=${encodeURIComponent(shareText)}` : ""}`
    : meet
      ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/`;

  async function copyLink() {
    if (!meet) return;
    await navigator.clipboard.writeText(meet.meetingUri);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const isLive = dated.status === "now";
  const isCancelled = dated.status === "cancelled";
  const isPaid = paid(dated.id, {
    date: dated.date,
    patientName: dated.patient,
  });
  const renew = needsPackageRenewal(patient);

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
        aria-label={`Acesso rápido — ${displayName}`}
        className={`relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={resolveAppointmentAvatar(dated.avatar, patient?.avatar)}
              alt={displayName}
              size={48}
              className="size-12 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold tracking-tight text-brand">
                  {displayName}
                </h2>
                {isPaid && <PaidMark />}
                {renew && <RenewalPill />}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isCancelled
                      ? "bg-danger/15 text-danger"
                      : isLive
                        ? "bg-orange text-brand"
                        : dated.status === "done"
                          ? "bg-surface text-brand"
                          : "bg-yellow/30 text-brand"
                  }`}
                >
                  {isCancelled
                    ? "Cancelada"
                    : isLive
                      ? "Agora"
                      : dated.status === "done"
                        ? "Concluído"
                        : "Próxima"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-muted">
                {dated.type} · {dated.start} – {dated.end}
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
                  {phoneTel ? (
                    <a
                      href={`tel:+55${phoneTel}`}
                      className="mt-1 flex items-center gap-1.5 font-medium text-brand hover:underline"
                    >
                      <Phone className="size-3.5" />
                      {phone}
                    </a>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 font-medium text-muted">
                      <Phone className="size-3.5" />
                      Sem telefone
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-line bg-bg p-3">
                  <p className="font-semibold uppercase tracking-wide text-muted">
                    Modalidade
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-medium text-brand">
                    {dated.mode === "Online" ? (
                      <Video className="size-3.5" />
                    ) : (
                      <MapPin className="size-3.5" />
                    )}
                    {dated.mode}
                  </p>
                </div>
              </div>

              <p className="rounded-2xl border border-line bg-bg p-3 text-[13px] leading-relaxed text-brand">
                {notes}
              </p>

              {!isCancelled && (
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-bg py-3 text-[13px] font-semibold text-brand transition-colors hover:bg-surface-soft"
                >
                  <CalendarDays className="size-4" />
                  Remarcar sessão
                </button>
              )}

              {!meet ? (
                googleConnected ? (
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
                  <a
                    href={`/api/auth/google?returnTo=${encodeURIComponent("/")}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-[13px] font-bold text-card"
                  >
                    <Link2 className="size-4" />
                    Conectar Google Meet
                  </a>
                )
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
                        window.open(whatsappHref, "_blank", "noopener,noreferrer")
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
            <div className="space-y-3">
              <Link
                href={`/prontuario/novo?appointmentId=${dated.id}&patient=${encodeURIComponent(dated.patient)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-[13px] font-bold text-brand"
              >
                <FileText className="size-4" />
                Novo relato da sessão
              </Link>
              {reports.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted">
                  Nenhum relato salvo para este paciente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {reports.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl border border-line bg-bg p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-brand">
                          {formatFinanceDate(r.date)}
                          {r.start ? ` · ${r.start}` : ""}
                        </p>
                        <Link
                          href={`/prontuario/novo?appointmentId=${r.appointmentId}&patient=${encodeURIComponent(r.patientName)}`}
                          className="text-[11px] font-semibold text-muted hover:text-brand"
                        >
                          Abrir
                        </Link>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] text-muted">
                        {r.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {tab === "historico" && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted">
                  Nenhuma sessão registrada.
                </p>
              ) : (
                history.map((h) => (
                  <div
                    key={`${h.date}-${h.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-brand">
                        {formatFinanceDate(h.date)} · {h.start} – {h.end}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {h.type} · {h.mode}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        h.status === "done"
                          ? "bg-surface text-brand"
                          : h.status === "now"
                            ? "bg-orange text-brand"
                            : "bg-yellow/30 text-brand"
                      }`}
                    >
                      {h.status === "done"
                        ? "Concluída"
                        : h.status === "now"
                          ? "Agora"
                          : "Próxima"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}          {tab === "pagamento" && <SessionPaymentPanel appointment={dated} />}
        </div>

        <div className="border-t border-line px-5 py-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={cadastroHref}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-bg py-2.5 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft"
            >
              Cadastro
            </Link>
            <Link
              href={`/sessao/${dated.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-bg py-2.5 text-[12px] font-semibold text-brand transition-colors hover:bg-surface-soft"
            >
              Tela completa
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {rescheduleOpen && (
        <RescheduleDialog
          appointment={dated}
          onClose={() => setRescheduleOpen(false)}
          onSave={(patch) => {
            reschedule(dated.id, patch);
            setRescheduleOpen(false);
            handleClose();
          }}
        />
      )}
    </div>
  );
}
