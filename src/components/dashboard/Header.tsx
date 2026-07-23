"use client";

import {
  ChevronDown,
  LogOut,
  Settings,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PsychologistProfileForm } from "@/components/profile/PsychologistProfileForm";
import { useProfile } from "@/hooks/useProfile";
import { logout } from "@/lib/auth";
import { navItems } from "@/lib/mock-data";
import { profileDisplayName } from "@/lib/profile";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, update } = useProfile();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = profileDisplayName(profile);

  const updatePill = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeIndex = navItems.findIndex((item) =>
      isActivePath(pathname, item.href),
    );
    const el = itemRefs.current[activeIndex];
    if (!el || activeIndex < 0) {
      setPill((prev) => ({ ...prev, ready: false, width: 0 }));
      return;
    }

    setPill({
      left: el.offsetLeft,
      width: el.offsetWidth,
      ready: true,
    });
  }, [pathname]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onResize = () => updatePill();
    const onScroll = () => updatePill();
    window.addEventListener("resize", onResize);
    nav.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(onResize);
    ro.observe(nav);
    itemRefs.current.forEach((el) => el && ro.observe(el));

    return () => {
      window.removeEventListener("resize", onResize);
      nav.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updatePill]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeIndex = navItems.findIndex((item) =>
      isActivePath(pathname, item.href),
    );
    const el = itemRefs.current[activeIndex];
    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/login");
  }

  function openSettings() {
    setMenuOpen(false);
    setSettingsOpen(true);
  }

  function openProfile() {
    setMenuOpen(false);
    setSettingsOpen(false);
    setProfileOpen(true);
  }

  return (
    <>
      <header className="card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand text-card">
            <TrendingUp className="size-[18px]" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight text-brand">
            MyHub
          </span>
        </Link>

        <nav
          ref={navRef}
          aria-label="Principal"
          className="header-nav relative flex min-w-0 items-center justify-start gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth px-1 lg:justify-center"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 z-0 h-8 -translate-y-1/2 rounded-full bg-surface transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: pill.left,
              width: pill.width,
              opacity: pill.ready ? 1 : 0,
            }}
          />

          {navItems.map((item, index) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                className={`relative z-10 shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200 sm:px-3.5 sm:text-[13px] ${
                  active ? "text-brand" : "text-muted hover:text-brand"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative shrink-0 justify-self-end" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Conta de ${displayName}`}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex max-w-[min(100%,220px)] items-center gap-2 rounded-full border border-line bg-bg py-1 pr-2 pl-1 transition-colors hover:border-surface sm:gap-2.5 sm:pr-3"
          >
            <Image
              src={profile.avatar}
              alt=""
              width={32}
              height={32}
              unoptimized={
                profile.avatar.startsWith("data:") ||
                profile.avatar.startsWith("blob:")
              }
              className="size-8 shrink-0 rounded-full object-cover"
            />
            <span className="hidden min-w-0 text-left md:block">
              <span className="block truncate text-[13px] font-semibold leading-tight text-brand">
                {displayName}
              </span>
              <span className="block truncate text-[11px] leading-tight text-muted">
                {profile.email}
              </span>
            </span>
            <ChevronDown
              className={`hidden size-4 shrink-0 text-muted transition-transform md:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-card shadow-[0_16px_40px_rgba(20,22,26,0.12)]"
            >
              <div className="border-b border-line px-3.5 py-3 md:hidden">
                <p className="truncate text-[13px] font-semibold text-brand">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-muted">{profile.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={openProfile}
                className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[13px] font-semibold text-brand transition-colors hover:bg-bg"
              >
                <UserRound className="size-4 shrink-0 text-muted" />
                Meu perfil
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={openSettings}
                className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-3 text-left text-[13px] font-semibold text-brand transition-colors hover:bg-bg"
              >
                <Settings className="size-4 shrink-0 text-muted" />
                Configurações
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-3 text-left text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="size-4 shrink-0" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {settingsOpen && (
        <SettingsDialog
          onClose={() => setSettingsOpen(false)}
          onOpenProfile={openProfile}
        />
      )}

      {profileOpen && (
        <PsychologistProfileForm
          initial={profile}
          onClose={() => setProfileOpen(false)}
          onSave={update}
        />
      )}
    </>
  );
}

function SettingsDialog({
  onClose,
  onOpenProfile,
}: {
  onClose: () => void;
  onOpenProfile: () => void;
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
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
        aria-label="Configurações"
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_80px_rgba(20,22,26,0.18)] transition-all duration-300 ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-brand">
              Configurações
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Preferências do MyHub
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

        <div className="space-y-3 px-5 py-5">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-bg p-3.5 text-left transition-colors hover:border-surface hover:bg-surface-soft/60"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-surface text-brand">
              <UserRound className="size-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-brand">
                Meu perfil profissional
              </span>
              <span className="block text-[11px] text-muted">
                CPF, CRP, endereço e dados fiscais
              </span>
            </span>
          </button>
          <p className="text-[11px] leading-relaxed text-muted">
            Preferências de notificação e integrações entram aqui em breve.
          </p>
        </div>

        <div className="flex justify-end border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-line bg-bg px-5 py-3 text-[13px] font-semibold text-brand"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
