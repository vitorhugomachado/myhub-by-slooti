"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_EVENT, fetchSessionUser, getCachedUser } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublicPath(pathname);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const user = getCachedUser() ?? (await fetchSessionUser());
      if (cancelled) return;

      const pub = isPublicPath(pathname);

      if (!pub && !user) {
        setReady(false);
        router.replace("/login");
        return;
      }

      if (pathname === "/login" && user) {
        setReady(false);
        router.replace("/");
        return;
      }

      setReady(true);
    }

    void check();

    function onAuth() {
      void check();
    }
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EVENT, onAuth);
    };
  }, [pathname, router]);

  if (!ready && !publicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-surface" />
          <p className="text-[13px] text-muted">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!ready && publicRoute) {
    // Allow login/auth pages to render while session resolves
    return <>{children}</>;
  }

  return <>{children}</>;
}
