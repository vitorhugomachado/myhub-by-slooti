import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isPaymentGateway,
  isPlanId,
  type PaymentGateway,
  type PlanId,
} from "@/lib/plans";
import { getSessionUser, toPublicUser } from "@/lib/session";

export async function PUT(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    plan?: string;
    paymentGateway?: string;
  };

  if (!isPlanId(body.plan)) {
    return NextResponse.json(
      { error: "Escolha o plano Gratuito ou Pro." },
      { status: 400 },
    );
  }

  const plan: PlanId = body.plan;
  let paymentGateway = "";

  if (plan === "pro") {
    if (body.paymentGateway && !isPaymentGateway(body.paymentGateway)) {
      return NextResponse.json(
        { error: "Gateway de pagamento inválido." },
        { status: 400 },
      );
    }
    paymentGateway = (body.paymentGateway as PaymentGateway | undefined) ?? "";
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      plan,
      paymentGateway,
    },
  });

  return NextResponse.json({ user: toPublicUser(user) });
}
