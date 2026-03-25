import { activateIncidentMode, clearIncidentMode } from './incidentMode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface LiveApiOptions extends RequestInit {
  timeoutMs?: number;
  incidentReason?: string;
}

export async function liveApiFetchJson<T>(path: string, options: LiveApiOptions = {}): Promise<T> {
  const { timeoutMs = 10000, incidentReason = 'live_api_unavailable', ...init } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      activateIncidentMode(incidentReason);
      throw new Error(`Live API error ${response.status}`);
    }

    clearIncidentMode();
    return response.json() as Promise<T>;
  } catch (error) {
    activateIncidentMode(incidentReason);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

