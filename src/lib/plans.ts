export type PlanId = "free" | "pro";

export type PaymentGateway =
  | "stripe"
  | "mercadopago"
  | "asaas"
  | "manual";

export const FREE_PATIENT_LIMIT = 5;

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Gratuito",
  pro: "Pro",
};

export const PAYMENT_GATEWAYS: Array<{
  id: PaymentGateway;
  name: string;
  description: string;
}> = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    description: "Pix, cartão e boleto — popular no Brasil.",
  },
  {
    id: "asaas",
    name: "Asaas",
    description: "Cobranças recorrentes e gestão financeira.",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Pagamentos internacionais e cartão.",
  },
  {
    id: "manual",
    name: "Controle manual",
    description: "Registrar pagamentos no MyHub sem gateway.",
  },
];

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "free" || value === "pro";
}

export function needsPlanOnboarding(plan: string | null | undefined) {
  return !isPlanId(plan);
}

export function hasFinanceAccess(plan: string | null | undefined) {
  return plan === "pro";
}

export function maxPatientsForPlan(plan: string | null | undefined) {
  return plan === "pro" ? Number.POSITIVE_INFINITY : FREE_PATIENT_LIMIT;
}

export function canAddPatient(
  plan: string | null | undefined,
  currentCount: number,
) {
  return currentCount < maxPatientsForPlan(plan);
}

export function postAuthPath(user: {
  plan?: string | null;
  paymentGateway?: string | null;
}) {
  if (needsPlanOnboarding(user.plan)) return "/onboarding";
  if (user.plan === "pro" && !user.paymentGateway) return "/onboarding?step=gateway";
  return "/";
}

export function isPaymentGateway(
  value: string | null | undefined,
): value is PaymentGateway {
  return PAYMENT_GATEWAYS.some((g) => g.id === value);
}
