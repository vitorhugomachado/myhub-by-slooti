"use client";

import { ChevronDown, Settings, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { currentUser, navItems } from "@/lib/mock-data";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

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

    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPill({
      left: elRect.left - navRect.left + nav.scrollLeft,
      width: elRect.width,
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
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(onResize);
    ro.observe(nav);
    itemRefs.current.forEach((el) => el && ro.observe(el));

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [updatePill]);

  return (
    <header className="card flex flex-wrap items-center gap-3 px-3 py-2.5 sm:px-4 lg:gap-4">
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-brand text-card">
          <TrendingUp className="size-[18px]" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold tracking-tight text-brand">
          MyHub
        </span>
      </Link>

      <nav
        ref={navRef}
        className="relative order-3 flex w-full flex-nowrap items-center gap-0.5 overflow-x-auto lg:order-none lg:w-auto lg:flex-1 lg:justify-center"
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
              className={`relative z-10 shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                active
                  ? "text-brand"
                  : "text-muted hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full border border-line bg-bg py-1 pr-3 pl-1 transition-colors hover:border-surface"
        >
          <Image
            src={currentUser.avatar}
            alt={currentUser.name}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
          <span className="hidden text-left sm:block">
            <span className="block text-[13px] font-semibold leading-tight text-brand">
              {currentUser.name}
            </span>
            <span className="block text-[11px] leading-tight text-muted">
              {currentUser.email}
            </span>
          </span>
          <ChevronDown className="hidden size-4 text-muted sm:block" />
        </button>

        <button
          type="button"
          aria-label="Configurações"
          className="flex size-9 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:bg-surface-soft hover:text-brand"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
}
