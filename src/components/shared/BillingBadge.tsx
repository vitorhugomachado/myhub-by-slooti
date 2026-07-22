import { patientBillingBadge } from "@/lib/billing";
import type { Patient } from "@/lib/patients";

export function BillingBadge({ patient }: { patient: Patient }) {
  const badge = patientBillingBadge(patient);
  const styles =
    badge.tone === "warn"
      ? "bg-orange/15 text-orange"
      : badge.tone === "mint"
        ? "bg-surface text-brand"
        : "bg-bg text-muted";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles}`}
    >
      {badge.label}
    </span>
  );
}

export function RenewalPill({ className = "" }: { className?: string }) {
  return (
    <span
      className={`rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange ${className}`}
    >
      Renovar pacote
    </span>
  );
}
