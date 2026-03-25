import { activateIncidentMode, clearIncidentMode } from './incidentMode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function checkLiveApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: controller.signal });
    if (!response.ok) {
      activateIncidentMode('live_api_healthcheck_failed');
      return false;
    }
    clearIncidentMode();
    return true;
  } catch (error) {
    console.warn('[liveApiHealthService] healthcheck failure', error);
    activateIncidentMode('live_api_healthcheck_unreachable');
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
