export type SessionPhase = "idle" | "running" | "finished";

export type SessionPhaseState = {
  appointmentId: number;
  phase: SessionPhase;
};

export const SESSION_PHASE_KEY = "myhub_session_phase_v1";

export function loadSessionPhase(): SessionPhaseState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_PHASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionPhaseState;
    if (!parsed?.appointmentId || !parsed.phase) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSessionPhase(state: SessionPhaseState | null) {
  if (typeof window === "undefined") return;
  if (!state || state.phase === "idle") {
    localStorage.removeItem(SESSION_PHASE_KEY);
    return;
  }
  localStorage.setItem(SESSION_PHASE_KEY, JSON.stringify(state));
}
