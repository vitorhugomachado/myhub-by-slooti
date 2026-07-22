export type PendencyType = "prontuario" | "receita";

export type Pendency = {
  id: string;
  type: PendencyType;
  patientName: string;
  patientId?: string;
  appointmentId: number;
  createdAt: string;
  status: "pending" | "done";
};

export const PENDENCIES_KEY = "myhub_pendencies_v1";
export const PENDENCIES_EVENT = "myhub:pendencies";

export function pendencyLabel(type: PendencyType) {
  return type === "prontuario" ? "Preencher prontuário" : "Preencher receita saúde";
}

export function loadPendencies(): Pendency[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDENCIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Pendency[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePendencies(items: Pendency[]) {
  localStorage.setItem(PENDENCIES_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(PENDENCIES_EVENT));
}

export function addPendency(
  input: Omit<Pendency, "id" | "createdAt" | "status">,
) {
  const items = loadPendencies();
  const exists = items.some(
    (p) =>
      p.status === "pending" &&
      p.type === input.type &&
      p.appointmentId === input.appointmentId,
  );
  if (exists) return items;

  const next: Pendency = {
    ...input,
    id: `pend-${Date.now()}-${input.type}`,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const updated = [next, ...items];
  savePendencies(updated);
  return updated;
}

export function getPendingForPatient(patientName: string) {
  return loadPendencies().filter(
    (p) =>
      p.status === "pending" &&
      p.patientName.toLowerCase() === patientName.toLowerCase(),
  );
}

export function resolvePatientIdByName(
  patientName: string,
  patients: { id: string; fullName: string }[],
) {
  return patients.find(
    (p) => p.fullName.toLowerCase() === patientName.toLowerCase(),
  )?.id;
}
