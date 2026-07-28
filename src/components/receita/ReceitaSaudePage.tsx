"use client";

import { Pill } from "lucide-react";
import { Header } from "@/components/dashboard/Header";

export function ReceitaSaudePage() {
  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-4">
        <Header />
        <article className="card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
            <Pill className="size-6" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-brand sm:text-2xl">
            Receita Saúde
          </h1>
          <p className="max-w-md text-[13px] leading-relaxed text-muted">
            A emissão fiscal ainda não está disponível. Em breve você poderá
            gerar e acompanhar documentos por aqui.
          </p>
          <span className="mt-1 rounded-full bg-bg px-3 py-1 text-[11px] font-semibold text-muted">
            Em breve
          </span>
        </article>
      </div>
    </div>
  );
}
