const meetLinks = new Map<number, { meetingUri: string; spaceName?: string; mock: boolean }>();

export function getStoredMeetLink(appointmentId: number) {
  return meetLinks.get(appointmentId) ?? null;
}

export function setStoredMeetLink(
  appointmentId: number,
  data: { meetingUri: string; spaceName?: string; mock: boolean },
) {
  meetLinks.set(appointmentId, data);
  return data;
}

export function createMockMeetUri() {
  const part = () =>
    Math.random().toString(36).slice(2, 5) +
    Math.random().toString(36).slice(2, 5);
  return `https://meet.google.com/${part()}-${part()}-${part()}`;
}
