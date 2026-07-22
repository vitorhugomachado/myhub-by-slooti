"use client";

import { ArrowLeft, Pill } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";

export default function NovaReceitaClient() {
  const params = useSearchParams();
  const patient = params.get("patient") ?? "Paciente";

  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-[800px] flex-col gap-4">
        <Header />
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Voltar ao hub
        </Link>
        <article className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
            <Pill className="size-6" />
          </span>
          <h1 className="text-xl font-bold text-brand">Receita Saúde</h1>
          <p className="max-w-md text-[13px] leading-relaxed text-muted">
            Nova aba para emissão de receita saúde de{" "}
            <span className="font-semibold text-brand">{patient}</span>. Este
            módulo será criado em seguida.
          </p>
          <span className="rounded-full bg-bg px-3 py-1 text-[11px] font-semibold text-muted">
            Em breve
          </span>
        </article>
      </div>
    </div>
  );
}
