export type MeetLinkData = {
  meetingUri: string;
  spaceName?: string;
  mock: boolean;
};

export const MEET_STORE_KEY = "myhub_meet_links_v1";

const memory = new Map<number, MeetLinkData>();

function readLocal(): Record<string, MeetLinkData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEET_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MeetLinkData>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(appointmentId: number, data: MeetLinkData) {
  if (typeof window === "undefined") return;
  const map = readLocal();
  map[String(appointmentId)] = data;
  localStorage.setItem(MEET_STORE_KEY, JSON.stringify(map));
}

export function getStoredMeetLink(appointmentId: number) {
  const fromMemory = memory.get(appointmentId);
  if (fromMemory) return fromMemory;
  if (typeof window !== "undefined") {
    return readLocal()[String(appointmentId)] ?? null;
  }
  return null;
}

export function setStoredMeetLink(appointmentId: number, data: MeetLinkData) {
  memory.set(appointmentId, data);
  writeLocal(appointmentId, data);
  return data;
}

export function createMockMeetUri() {
  const part = () =>
    Math.random().toString(36).slice(2, 5) +
    Math.random().toString(36).slice(2, 5);
  return `https://meet.google.com/${part()}-${part()}-${part()}`;
}
