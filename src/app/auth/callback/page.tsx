"use client";

import { Loader2, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { loginWithGoogle, postAuthPath } from "@/lib/auth";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const google = searchParams.get("google");
      if (google === "denied") {
        setError("Login com Google cancelado.");
        return;
      }
      if (google === "error" || google === "missing") {
        setError(
          google === "missing"
            ? "Google OAuth não está configurado no servidor."
            : "Não foi possível conectar com o Google.",
        );
        return;
      }

      const result = await loginWithGoogle();
      if (!result.ok) {
        if (!cancelled) setError(result.error);
        return;
      }

      if (!cancelled) router.replace(postAuthPath(result.user));
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4">
        <p className="max-w-sm text-center text-[14px] text-danger">{error}</p>
        <a
          href="/login"
          className="rounded-full bg-surface px-5 py-2.5 text-[13px] font-bold text-brand"
        >
          Voltar ao login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
      <Loader2 className="size-8 animate-spin text-brand" />
      <div className="flex items-center gap-2 text-brand">
        <TrendingUp className="size-4" />
        <p className="text-[13px] font-semibold">Entrando com Google…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
