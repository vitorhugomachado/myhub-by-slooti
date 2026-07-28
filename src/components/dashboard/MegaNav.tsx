"use client";

import { ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  filterMegaNav,
  megaItemIsActive,
  megaNavItems,
  type MegaNavItem,
} from "@/lib/navigation";

export function MegaNav({ showFinance }: { showFinance: boolean }) {
  const pathname = usePathname();
  const items = filterMegaNav(megaNavItems, showFinance);
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    if (!openId) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpenId(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <nav
        aria-label="Principal"
        className="header-nav flex min-w-0 items-center justify-start gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth rounded-full border border-line/80 bg-bg p-1 lg:justify-center"
      >
        {items.map((item) => {
          const hasMega = Boolean(item.columns?.length);
          const active = megaItemIsActive(pathname, item);
          const open = openId === item.id;
          const panelId = `${baseId}-${item.id}`;

          if (!hasMega && item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200 sm:px-3.5 sm:text-[13px] ${
                  active
                    ? "bg-surface text-brand"
                    : "text-muted hover:text-brand"
                }`}
              >
                {item.label}
                {item.locked ? (
                  <span className="rounded-full bg-accent-deep/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-accent-deep uppercase">
                    Pro
                  </span>
                ) : null}
              </Link>
            );
          }

          return (
            <div key={item.id} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                aria-haspopup="true"
                onClick={() => toggle(item.id)}
                onMouseEnter={() => {
                  if (window.matchMedia("(hover: hover)").matches) {
                    setOpenId(item.id);
                  }
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200 sm:px-3.5 sm:text-[13px] ${
                  active || open
                    ? "bg-surface text-brand"
                    : "text-muted hover:text-brand"
                }`}
              >
                {item.label}
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          );
        })}
      </nav>

      {items.map((item) => {
        if (!item.columns?.length) return null;
        const open = openId === item.id;
        const panelId = `${baseId}-${item.id}`;
        return (
          <MegaPanel
            key={item.id}
            id={panelId}
            item={item}
            open={open}
            onClose={() => setOpenId(null)}
            onMouseEnter={() => setOpenId(item.id)}
          />
        );
      })}
    </div>
  );
}

function MegaPanel({
  id,
  item,
  open,
  onClose,
  onMouseEnter,
}: {
  id: string;
  item: MegaNavItem;
  open: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
}) {
  const cols = item.columns ?? [];
  const colCount = Math.min(Math.max(cols.length, 1), 3);

  return (
    <div
      id={id}
      role="region"
      aria-label={`Submenu ${item.label}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onClose}
      className={`mega-nav-panel absolute top-[calc(100%+10px)] left-1/2 z-50 w-[min(100vw-1.5rem,42rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_50px_rgba(20,22,26,0.12)] transition-all duration-200 ${
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0"
      }`}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
        }}
      >
        {cols.map((column) => (
          <div
            key={column.title}
            className={`border-line p-4 sm:p-5 ${
              column.highlight ? "bg-surface-soft/70" : "bg-card"
            } ${cols.length > 1 ? "border-r last:border-r-0" : ""}`}
          >
            <p className="mb-3 text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
              {column.title}
            </p>
            <ul className="space-y-1">
              {column.items.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block rounded-xl px-2.5 py-2.5 transition-colors hover:bg-bg"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-brand">
                      {link.label}
                      {link.locked ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-deep/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-accent-deep uppercase">
                          <Lock className="size-2.5" />
                          Pro
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                      {link.locked
                        ? "Prévia disponível — contrate o Pro para liberar"
                        : link.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
