import { notFound, redirect } from "next/navigation";
import { SessionRoom } from "@/components/session/SessionRoom";
import { prisma } from "@/lib/db";
import { toAppointment } from "@/lib/mappers";
import { getSessionUser } from "@/lib/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessaoPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    notFound();
  }

  const row = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  });
  if (!row) {
    notFound();
  }

  return <SessionRoom appointment={toAppointment(row)} />;
}
