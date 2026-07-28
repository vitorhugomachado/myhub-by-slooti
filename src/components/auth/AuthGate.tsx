"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_EVENT, fetchSessionUser, getCachedUser } from "@/lib/auth";
import { needsPlanOnboarding, postAuthPath } from "@/lib/plans";

const PUBLIC_PREFIXES = ["/login", "/auth", "/privacidade"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isOnboardingPath(pathname: string) {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublicPath(pathname);
  const onboardingRoute = isOnboardingPath(pathname);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const user = getCachedUser() ?? (await fetchSessionUser());
      if (cancelled) return;

      const pub = isPublicPath(pathname);
      const onboarding = isOnboardingPath(pathname);

      if (!pub && !onboarding && !user) {
        setReady(false);
        router.replace("/login");
        return;
      }

      if (pathname === "/login" && user) {
        setReady(false);
        router.replace(postAuthPath(user));
        return;
      }

      if (user && needsPlanOnboarding(user.plan) && !onboarding && !pub) {
        setReady(false);
        router.replace("/onboarding");
        return;
      }

      if (
        user &&
        user.plan === "pro" &&
        !user.paymentGateway &&
        !onboarding &&
        !pub
      ) {
        setReady(false);
        router.replace("/onboarding?step=gateway");
        return;
      }

      if (user && onboarding) {
        setReady(true);
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

  if (!ready && !publicRoute && !onboardingRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-surface" />
          <p className="text-[13px] text-muted">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!ready && (publicRoute || onboardingRoute)) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
