"use client";

import { CalendarPlus, MapPin, UserPlus, Video, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientSearchSelect } from "@/components/shared/PatientSearchSelect";
import { usePatients } from "@/hooks/usePatients";
import { useSchedule } from "@/hooks/useSchedule";
import { fetchSessionUser, getCachedUser } from "@/lib/auth";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { formatFinanceDate } from "@/lib/finance";
import type { Appointment } from "@/lib/mock-data";
import { emptyPatient, type Patient } from "@/lib/patients";
import {
  canAddPatient,
  FREE_PATIENT_LIMIT,
} from "@/lib/plans";
import {
  addMinutesToTime,
  buildDaySlotRows,
  DAY_SLOTS,
  SESSION_MINUTES,
  type AddAppointmentInput,
} from "@/lib/schedule";

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-surface";

const inputErrorClass =
  "w-full rounded-xl border border-danger/50 bg-bg px-3.5 py-3 text-[13px] leading-normal text-brand outline-none placeholder:text-muted focus:border-danger";

type Prefill = {
  date: string;
  start?: string;
};

function toAppointmentMode(
  preferred: string | undefined,
): Appointment["mode"] {
  return preferred === "Presencial" ? "Presencial" : "Online";
}

export function AddAppointmentDialog({
  prefill,
  onClose,
  onSave,
}: {
  prefill: Prefill;
  onClose: () => void;
  onSave: (input: AddAppointmentInput) => void | Promise<void>;
}) {
  const { patients, setPatients, hydrated } = usePatients();
  const { forDate } = useSchedule();
  const [visible, setVisible] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(prefill.date);
  const [start, setStart] = useState(prefill.start ?? "");
  const [mode, setMode] = useState<Appointment["mode"]>("Online");
  const [type, setType] = useState("");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [plan, setPlan] = useState(getCachedUser()?.plan ?? "");
  const [limitError, setLimitError] = useState("");

  useEffect(() => {
    void fetchSessionUser().then((user) => {
      if (user) setPlan(user.plan);
    });
  }, []);

  useEffect(() => {
    setDate(prefill.date);
    setStart(prefill.start ?? "");
    setTried(false);
    setSaveError("");
    setLimitError("");
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [prefill.date, prefill.start]);

  const dayAppointments = useMemo(
    () => forDate(date, false),
    [forDate, date],
  );

  const slotRows = useMemo(
    () => buildDaySlotRows(dayAppointments),
    [dayAppointments],
  );

  const freeStarts = useMemo(() => {
    const free = new Set(
      slotRows.filter((s) => !s.occupant).map((s) => s.start),
    );
    if (prefill.start && prefill.date === date) free.add(prefill.start);
    return [...free].sort();
  }, [slotRows, prefill.start, prefill.date, date]);

  const selectedPatient = patients.find((p) => p.id === patientId) ?? null;
  const end = start ? addMinutesToTime(start, SESSION_MINUTES) : "";
  const atPatientLimit = !canAddPatient(plan, patients.length);

  const errors = {
    patient: !patientId ? "Selecione um paciente." : undefined,
    date: !date ? "Informe a data." : undefined,
    start: !start
      ? "Escolha um horário."
      : !freeStarts.includes(start)
        ? "Horário indisponível neste dia."
        : undefined,
  };

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  function applyPatient(patient: Patient) {
    setPatientId(patient.id);
    setMode(toAppointmentMode(patient.preferredMode));
    if (!type.trim() && patient.chiefComplaint.trim()) {
      setType(patient.chiefComplaint.trim().slice(0, 80));
    }
  }

  function onPatientChange(id: string) {
    const patient = patients.find((p) => p.id === id);
    if (patient) applyPatient(patient);
    else setPatientId(id);
  }

  function openRegister() {
    setLimitError("");
    if (atPatientLimit) {
      setLimitError(
        `Plano gratuito: limite de ${FREE_PATIENT_LIMIT} pacientes. Faça upgrade para o Pro.`,
      );
      return;
    }
    setRegisterOpen(true);
  }

  async function handleRegisterSave(
    data: ReturnType<typeof emptyPatient> & { avatar: string },
  ) {
    if (!canAddPatient(plan, patients.length)) {
      throw new Error(
        `Plano gratuito: limite de ${FREE_PATIENT_LIMIT} pacientes.`,
      );
    }

    const avatar = data.avatar?.trim() ? data.avatar : DEFAULT_AVATAR;
    const newPatient: Patient = {
      ...data,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      avatar,
    };

    await setPatients((prev) => [newPatient, ...prev]);
    applyPatient(newPatient);
    setTried(false);
    setSaveError("");
    setRegisterOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setSaveError("");
    if (errors.patient || errors.date || errors.start || !selectedPatient) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        date,
        start,
        end,
        patient: selectedPatient.fullName,
        patientId: selectedPatient.id,
        avatar: selectedPatient.avatar || DEFAULT_AVATAR,
        type: type.trim() || selectedPatient.chiefComplaint || "Sessão",
        mode,
      });
      handleClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Não foi possível agendar a sessão.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
        <button
          type="button"
          aria-label="Fechar"
          onClick={handleClose}
          className={`absolute inset-0 bg-brand/25 backdrop-blur-[2px] transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className={`relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ${
            visible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-8 scale-95 opacity-0"
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-brand">
                Nova sessão
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                {prefill.start
                  ? `Horário pré-definido: ${formatFinanceDate(prefill.date)} · ${prefill.start}`
                  : "Escolha o paciente e o horário"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted hover:text-brand"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Paciente *
                </span>
                <button
                  type="button"
                  onClick={openRegister}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                >
                  <UserPlus className="size-3.5" />
                  Cadastrar paciente
                </button>
              </div>
              <PatientSearchSelect
                patients={patients}
                value={patientId}
                onChange={onPatientChange}
                disabled={!hydrated}
                error={Boolean(tried && errors.patient)}
                onRegister={openRegister}
                placeholder="Digite para buscar…"
              />
              {tried && errors.patient ? (
                <span className="mt-1 block text-[11px] text-danger">
                  {errors.patient}
                </span>
              ) : null}
              {limitError ? (
                <p className="mt-2 text-[12px] text-danger">
                  {limitError}{" "}
                  <Link
                    href="/onboarding"
                    className="font-semibold underline"
                  >
                    Ver planos
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Data *
                </span>
                <input
                  type="date"
                  className={tried && errors.date ? inputErrorClass : inputClass}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setStart("");
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Horário *
                </span>
                <select
                  className={
                    tried && errors.start ? inputErrorClass : inputClass
                  }
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {DAY_SLOTS.map((slot) => {
                    const free = freeStarts.includes(slot);
                    return (
                      <option key={slot} value={slot} disabled={!free}>
                        {slot} – {addMinutesToTime(slot, SESSION_MINUTES)}
                        {!free ? " (ocupado)" : ""}
                      </option>
                    );
                  })}
                </select>
                {tried && errors.start ? (
                  <span className="mt-1 block text-[11px] text-danger">
                    {errors.start}
                  </span>
                ) : end ? (
                  <span className="mt-1 block text-[11px] text-muted">
                    Término previsto: {end}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Modalidade
                </span>
                <div className="flex rounded-full border border-line bg-bg p-1">
                  {(
                    [
                      { id: "Online" as const, icon: Video, label: "Online" },
                      {
                        id: "Presencial" as const,
                        icon: MapPin,
                        label: "Presencial",
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMode(opt.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors ${
                        mode === opt.id
                          ? "bg-surface text-brand"
                          : "text-muted hover:text-brand"
                      }`}
                    >
                      <opt.icon className="size-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Foco / tipo
                </span>
                <input
                  className={inputClass}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Ansiedade, retorno…"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted">
              {saveError ? (
                <span className="text-danger">{saveError}</span>
              ) : start && date ? (
                <>
                  Agendar em{" "}
                  <span className="font-semibold text-brand">
                    {formatFinanceDate(date)} · {start}
                    {end ? ` – ${end}` : ""}
                  </span>
                </>
              ) : (
                "Preencha paciente e horário"
              )}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarPlus className="size-4" />
                {saving ? "Salvando…" : "Adicionar à agenda"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {registerOpen && (
        <PatientForm
          lockScroll={false}
          overlayClassName="z-[80]"
          title="Cadastrar paciente"
          subtitle="Depois de salvar, você volta ao agendamento com o paciente selecionado"
          onClose={() => setRegisterOpen(false)}
          onSave={async (data) => {
            await handleRegisterSave(data);
          }}
        />
      )}
    </>
  );
}
