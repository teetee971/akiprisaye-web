import { auth } from '@/lib/firebase';
import { isStaticPreviewEnv } from './runtimeEnv';

import { resolveApiBaseUrl } from '../apiBaseUrl';

const API_BASE_URL = resolveApiBaseUrl();

export async function getAdminAuthToken(): Promise<string> {
  const firebaseUser = auth?.currentUser;
  if (firebaseUser) {
    return firebaseUser.getIdToken();
  }

  throw new Error('Utilisateur non authentifié (token admin indisponible).');
}

export async function adminFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Admin API error ${response.status}`;
    const isStaticPreview = isStaticPreviewEnv();

    try {
      const body = await response.json();
      if (body?.message) errorMessage = body.message;
    } catch {
      // ignore parse errors
    }

    if (response.status === 404 && isStaticPreview) {
      errorMessage = 'API admin indisponible sur cet environnement de preview statique (404).';
    } else if (response.status >= 500) {
      errorMessage = 'Erreur serveur API admin. Réessayez dans quelques instants.';
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
