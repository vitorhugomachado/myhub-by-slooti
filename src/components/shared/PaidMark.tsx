/** Símbolo minimalista de recebimento confirmado. */
export function PaidMark({ className = "" }: { className?: string }) {
  return (
    <span
      title="Recebido"
      aria-label="Recebimento confirmado"
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-bold leading-none text-brand ${className}`}
    >
      $
    </span>
  );
}
