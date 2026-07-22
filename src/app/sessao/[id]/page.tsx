import { notFound } from "next/navigation";
import { SessionRoom } from "@/components/session/SessionRoom";
import { getAppointmentById, getPatientProfile } from "@/lib/mock-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessaoPage({ params }: PageProps) {
  const { id } = await params;
  const appointmentId = Number(id);
  const appointment = getAppointmentById(appointmentId);
  const profile = getPatientProfile(appointmentId);

  if (!appointment || !profile) notFound();

  return <SessionRoom appointment={appointment} profile={profile} />;
}
