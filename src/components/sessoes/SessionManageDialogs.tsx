"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  MapPin,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AGENDA_TODAY,
  formatDayLabel,
  parseISODate,
  toLocalISODate,
  type DatedAppointment,
} from "@/lib/agenda";
import { formatFinanceDate } from "@/lib/finance";
import { addMinutesToTime } from "@/lib/schedule";
import { useSchedule } from "@/hooks/useSchedule";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DRAG_TYPE = "application/x-myhub-reschedule";
const SESSION_MINUTES = 50;

/** Horários de trabalho padrão (sessões de 50 min). */
const DAY_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart)
  );
}

function isDragPayload(e: React.DragEvent) {
  return [...e.dataTransfer.types].includes(DRAG_TYPE);
}

export function RescheduleDialog({
  appointment,
  onClose,
  onSave,
}: {
  appointment: DatedAppointment;
  onClose: () => void;
  onSave: (patch: { date: string; start: string; end: string }) => void;
}) {
  const { forDate } = useSchedule();
  const reference = useMemo(() => parseISODate(AGENDA_TODAY), []);
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(appointment.date);
  const [start, setStart] = useState(appointment.start);
  const [end, setEnd] = useState(appointment.end);
  const [slotsDay, setSlotsDay] = useState<string | null>(appointment.date);
  const [cursor, setCursor] = useState(
    () => new Date(reference.getFullYear(), reference.getMonth(), 1),
  );
  const [dragging, setDragging] = useState(false);
  const [dropOverDay, setDropOverDay] = useState<string | null>(null);
  const [dropOverSlot, setDropOverSlot] = useState<string | null>(null);

  useEffect(() => {
    setDate(appointment.date);
    setStart(appointment.start);
    setEnd(appointment.end);
    setSlotsDay(appointment.date);
    const [y, m] = appointment.date.split("-").map(Number);
    setCursor(new Date(y, m - 1, 1));
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [appointment]);

  const previewDay = dropOverDay ?? slotsDay;
  const dayAppointments = useMemo(
    () => (previewDay ? forDate(previewDay, false) : []),
    [forDate, previewDay],
  );

  const slotRows = useMemo(() => {
    if (!previewDay) return [];

    const extras = dayAppointments.filter((a) => {
      if (a.id === appointment.id) return false;
      return !DAY_SLOTS.some((slot) =>
        slotsOverlap(a.start, a.end, slot, addMinutesToTime(slot, SESSION_MINUTES)),
      );
    });

    const base = DAY_SLOTS.map((slotStart) => {
      const slotEnd = addMinutesToTime(slotStart, SESSION_MINUTES);
      const occupant = dayAppointments.find(
        (a) =>
          a.id !== appointment.id &&
          slotsOverlap(a.start, a.end, slotStart, slotEnd),
      );
      return { start: slotStart, end: slotEnd, occupant: occupant ?? null };
    });

    const extraRows = extras.map((a) => ({
      start: a.start,
      end: a.end,
      occupant: a,
    }));

    return [...base, ...extraRows].sort((a, b) =>
      a.start.localeCompare(b.start),
    );
  }, [appointment.id, dayAppointments, previewDay]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !start || !end) return;
    onSave({ date, start, end });
    handleClose();
  }

  function openDay(iso: string) {
    setSlotsDay(iso);
    setDate(iso);
  }

  function pickSlot(iso: string, slotStart: string, slotEnd: string) {
    setSlotsDay(iso);
    setDate(iso);
    setStart(slotStart);
    setEnd(slotEnd);
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(DRAG_TYPE, appointment.id.toString());
    e.dataTransfer.effectAllowed = "move";
    setDragging(true);
  }

  function onDragEnd() {
    setDragging(false);
    setDropOverDay(null);
    setDropOverSlot(null);
  }

  function onDayDragOver(e: React.DragEvent, iso: string) {
    if (!isDragPayload(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropOverDay(iso);
    setSlotsDay(iso);
  }

  function onDayDrop(e: React.DragEvent, iso: string) {
    e.preventDefault();
    const payload = e.dataTransfer.getData(DRAG_TYPE);
    if (payload !== appointment.id.toString()) return;
    openDay(iso);
    setDropOverDay(null);
    setDropOverSlot(null);
    setDragging(false);
  }

  function onSlotDragOver(e: React.DragEvent, slotStart: string, free: boolean) {
    if (!isDragPayload(e) || !free || !previewDay) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropOverDay(previewDay);
    setDropOverSlot(slotStart);
  }

  function onSlotDrop(
    e: React.DragEvent,
    slotStart: string,
    slotEnd: string,
    free: boolean,
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (!free || !previewDay) return;
    const payload = e.dataTransfer.getData(DRAG_TYPE);
    if (payload !== appointment.id.toString()) return;
    pickSlot(previewDay, slotStart, slotEnd);
    setDropOverDay(null);
    setDropOverSlot(null);
    setDragging(false);
  }

  const cells = monthMatrix(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const selectionReady =
    date !== appointment.date ||
    start !== appointment.start ||
    end !== appointment.end;

  return (
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
        onSubmit={handleSubmit}
        className={`relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-brand">
              Remarcar sessão
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Arraste o paciente sobre um dia para ver os horários disponíveis
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

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[220px_minmax(0,1fr)_280px]">
          <aside className="border-b border-line bg-bg/60 p-4 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Paciente
            </p>
            <div
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              className={`cursor-grab rounded-2xl border border-line bg-card p-3 shadow-sm transition-all active:cursor-grabbing ${
                dragging
                  ? "scale-[0.98] opacity-60 ring-2 ring-surface"
                  : "hover:border-surface hover:bg-surface-soft/50"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <GripVertical className="mt-2 size-4 shrink-0 text-muted" />
                <Image
                  src={appointment.avatar}
                  alt={appointment.patient}
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-brand">
                    {appointment.patient}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {appointment.type}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                    {appointment.mode === "Online" ? (
                      <Video className="size-3" />
                    ) : (
                      <MapPin className="size-3" />
                    )}
                    {appointment.mode}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-bg px-3 py-2 text-[11px] text-muted">
                <p>
                  Atual:{" "}
                  <span className="font-semibold text-brand">
                    {formatFinanceDate(appointment.date)}
                  </span>
                </p>
                <p className="mt-0.5">
                  {appointment.start} – {appointment.end}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Passe o card sobre um dia para abrir os horários. Solte em um
              horário livre ou toque nele.
            </p>
          </aside>

          <div className="flex flex-col border-b border-line p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold capitalize text-brand">
                {monthLabel}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Mês anterior"
                  onClick={() =>
                    setCursor(
                      new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:text-brand"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCursor(
                      new Date(
                        reference.getFullYear(),
                        reference.getMonth(),
                        1,
                      ),
                    );
                    openDay(AGENDA_TODAY);
                  }}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-bg hover:text-brand"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  aria-label="Próximo mês"
                  onClick={() =>
                    setCursor(
                      new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:text-brand"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }

                const iso = toLocalISODate(cell);
                const isSelected = iso === date || iso === previewDay;
                const isToday = iso === AGENDA_TODAY;
                const isCurrent = iso === appointment.date;
                const isDropTarget = dropOverDay === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => openDay(iso)}
                    onDragOver={(e) => onDayDragOver(e, iso)}
                    onDragLeave={() =>
                      setDropOverDay((cur) => (cur === iso ? null : cur))
                    }
                    onDrop={(e) => onDayDrop(e, iso)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-[13px] font-semibold transition-all ${
                      isDropTarget
                        ? "scale-[1.03] bg-surface ring-2 ring-accent-deep text-brand"
                        : isSelected
                          ? "bg-surface text-brand"
                          : isToday
                            ? "bg-surface-soft text-brand"
                            : "text-brand hover:bg-bg"
                    } ${dragging && !isDropTarget ? "border border-dashed border-line" : ""}`}
                  >
                    {cell.getDate()}
                    {isCurrent && !isSelected && (
                      <span className="mt-0.5 size-1 rounded-full bg-muted" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-[280px] flex-col bg-bg/40 p-4">
            {previewDay ? (
              <>
                <div className="mb-3 shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Horários
                  </p>
                  <h3 className="mt-0.5 text-[14px] font-bold capitalize text-brand">
                    {formatDayLabel(previewDay)}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {slotRows.filter((s) => !s.occupant).length} disponíveis ·{" "}
                    {slotRows.filter((s) => s.occupant).length} ocupados
                  </p>
                </div>

                <ul className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                  {slotRows.map((slot) => {
                    const occupied = Boolean(slot.occupant);
                    const isPicked =
                      date === previewDay && start === slot.start;
                    const isDropTarget =
                      dropOverSlot === slot.start && !occupied;

                    if (occupied && slot.occupant) {
                      const occ = slot.occupant;
                      return (
                        <li
                          key={`${slot.start}-${occ.id}`}
                          className="rounded-2xl border border-line bg-card p-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <Image
                              src={occ.avatar}
                              alt={occ.patient}
                              width={36}
                              height={36}
                              className="size-9 shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-[13px] font-semibold text-brand">
                                  {occ.patient}
                                </p>
                                <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                                  Ocupado
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] text-muted">
                                {slot.start} – {slot.end}
                                <span className="text-muted/40"> · </span>
                                {occ.type}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={slot.start}>
                        <button
                          type="button"
                          onClick={() =>
                            pickSlot(previewDay, slot.start, slot.end)
                          }
                          onDragOver={(e) =>
                            onSlotDragOver(e, slot.start, true)
                          }
                          onDragLeave={() =>
                            setDropOverSlot((cur) =>
                              cur === slot.start ? null : cur,
                            )
                          }
                          onDrop={(e) =>
                            onSlotDrop(e, slot.start, slot.end, true)
                          }
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                            isDropTarget
                              ? "scale-[1.01] border-accent-deep bg-surface ring-2 ring-accent-deep/40"
                              : isPicked
                                ? "border-surface bg-surface text-brand"
                                : "border-line bg-card text-brand hover:border-surface hover:bg-surface-soft/60"
                          } ${dragging && !isDropTarget ? "border-dashed" : ""}`}
                        >
                          <div>
                            <p className="text-[13px] font-semibold">
                              {slot.start} – {slot.end}
                            </p>
                            <p className="text-[11px] text-muted">
                              {isPicked ? "Selecionado" : "Disponível"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              isPicked
                                ? "bg-brand/10 text-brand"
                                : "bg-surface-soft text-accent-deep"
                            }`}
                          >
                            {isPicked ? "OK" : "Livre"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-2 text-center text-[13px] text-muted">
                Arraste o paciente sobre um dia para ver os horários.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted">
            {selectionReady ? (
              <>
                Remarcar para{" "}
                <span className="font-semibold text-brand">
                  {formatFinanceDate(date)} · {start} – {end}
                </span>
              </>
            ) : (
              "Escolha um dia e um horário livre"
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
              disabled={!selectionReady}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-5 py-3 text-[13px] font-bold text-brand disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CalendarDays className="size-4" />
              Confirmar remarcação
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function CancelSessionDialog({
  appointment,
  onClose,
  onConfirm,
}: {
  appointment: DatedAppointment;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 200);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
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
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold tracking-tight text-brand">
            Cancelar sessão?
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {appointment.patient} · {appointment.start} – {appointment.end} ·{" "}
            {appointment.date.split("-").reverse().slice(0, 2).join("/")}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[14px] leading-relaxed text-brand">
            A sessão será marcada como cancelada e sairá da agenda ativa. Você
            ainda pode vê-la no filtro Canceladas.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="rounded-full bg-danger/90 px-5 py-3 text-[13px] font-bold text-card"
          >
            Confirmar cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}
