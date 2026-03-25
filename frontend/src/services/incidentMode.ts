const INCIDENT_EVENT = 'akiprisaye:incident-mode';
const INCIDENT_KEY = 'incident_mode_active';

export function activateIncidentMode(reason: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(INCIDENT_KEY, reason || 'unknown');
  window.dispatchEvent(new CustomEvent(INCIDENT_EVENT, { detail: { reason } }));
}

export function clearIncidentMode(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(INCIDENT_KEY);
  window.dispatchEvent(new CustomEvent(INCIDENT_EVENT, { detail: { reason: null } }));
}

export function getIncidentReason(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(INCIDENT_KEY);
}

export function onIncidentModeChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(INCIDENT_EVENT, handler as EventListener);
  return () => window.removeEventListener(INCIDENT_EVENT, handler as EventListener);
}

