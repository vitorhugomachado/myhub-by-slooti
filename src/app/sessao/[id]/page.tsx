import { notFound } from "next/navigation";
import { SessionRoom } from "@/components/session/SessionRoom";
import { getAppointmentById } from "@/lib/mock-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessaoPage({ params }: PageProps) {
  const { id } = await params;
  const appointmentId = Number(id);
  const appointment = getAppointmentById(appointmentId);

  if (!appointment) notFound();

  return <SessionRoom appointment={appointment} />;
}
