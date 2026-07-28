"use client";

import { Pill } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/dashboard/Header";

export default function NovaReceitaClient() {
  return (
    <div className="min-h-screen bg-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <Header />
        <article className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-brand">
            <Pill className="size-6" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-brand">
            Nova receita
          </h1>
          <p className="max-w-md text-[13px] leading-relaxed text-muted">
            A emissão de Receita Saúde ainda não está disponível neste beta.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-full bg-orange px-5 py-3 text-[13px] font-bold text-brand"
          >
            Voltar ao dashboard
          </Link>
        </article>
      </div>
    </div>
  );
}
