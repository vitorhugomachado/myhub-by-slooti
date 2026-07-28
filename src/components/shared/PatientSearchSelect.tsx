"use client";

import { Check, ChevronDown, Search, UserPlus, X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Avatar } from "@/components/shared/Avatar";
import { statusLabel, type Patient } from "@/lib/patients";

function displayName(p: Patient) {
  return p.socialName.trim() || p.fullName;
}

function matchesQuery(p: Patient, q: string) {
  if (!q) return true;
  const hay = `${p.fullName} ${p.socialName}`.toLowerCase();
  return hay.includes(q);
}

export function PatientSearchSelect({
  patients,
  value,
  onChange,
  disabled,
  error,
  onRegister,
  placeholder = "Buscar paciente…",
}: {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
  disabled?: boolean;
  error?: boolean;
  onRegister?: () => void;
  placeholder?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = patients.find((p) => p.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter((p) => matchesQuery(p, q))
      .sort((a, b) =>
        displayName(a).localeCompare(displayName(b), "pt-BR"),
      );
  }, [patients, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function openList() {
    if (disabled) return;
    setOpen(true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) =>
        filtered.length ? Math.min(h + 1, filtered.length - 1) : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      if (open && filtered[highlight]) {
        e.preventDefault();
        pick(filtered[highlight]!.id);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }

    if (e.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  }

  const showQuery = open || !selected;
  const inputValue = showQuery
    ? query
    : selected
      ? displayName(selected)
      : "";

  const borderClass = error
    ? "border-danger/50 focus-within:border-danger"
    : "border-line focus-within:border-surface";

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-xl border bg-bg px-3 py-2.5 transition-colors ${borderClass} ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        {selected && !open ? (
          <Avatar
            src={selected.avatar}
            alt={displayName(selected)}
            size={24}
            className="size-6 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[highlight]
              ? `${listId}-opt-${filtered[highlight]!.id}`
              : undefined
          }
          disabled={disabled}
          value={inputValue}
          placeholder={disabled ? "Carregando…" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (selected && e.target.value !== displayName(selected)) {
              // typing while closed selection shows query mode
            }
          }}
          onFocus={() => {
            openList();
            if (selected) setQuery("");
          }}
          onClick={openList}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-normal text-brand outline-none placeholder:text-muted"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            aria-label="Limpar paciente"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-brand"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={`size-4 shrink-0 text-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        )}
      </div>

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-[0_12px_40px_rgba(20,22,26,0.12)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center">
              <p className="text-[13px] text-muted">
                {patients.length === 0
                  ? "Nenhum paciente cadastrado"
                  : "Nenhum paciente encontrado"}
              </p>
              {onRegister ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onRegister();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline"
                >
                  <UserPlus className="size-3.5" />
                  Cadastrar paciente
                </button>
              ) : null}
            </li>
          ) : (
            filtered.map((p, index) => {
              const active = index === highlight;
              const isSelected = p.id === value;
              const name = displayName(p);
              return (
                <li
                  key={p.id}
                  id={`${listId}-opt-${p.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(p.id)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
                    active ? "bg-surface-soft" : "hover:bg-bg"
                  }`}
                >
                  <Avatar
                    src={p.avatar}
                    alt={name}
                    size={32}
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-brand">
                      {name}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {statusLabel(p.status)}
                      {p.preferredMode ? ` · ${p.preferredMode}` : ""}
                    </p>
                  </div>
                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-accent-deep" />
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
