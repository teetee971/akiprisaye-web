export type ShowMessageFn = (message: string, severity?: 'info'|'warning'|'error') => void;

/**
 * Demande la géolocalisation et affiche un message lisible en cas d'erreur.
 * Retourne la position ou null.
 */
export async function requestGeolocation(showMessage: ShowMessageFn) : Promise<GeolocationPosition | null> {
  try {
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        const perm = await (navigator.permissions as any).query({ name: 'geolocation' });
        if (perm && perm.state === 'denied') {
          showMessage('Géolocalisation : permission refusée. Activez la localisation pour ce site dans les paramètres du navigateur.', 'warning');
          return null;
        }
      } catch (e) {
        // ignore si non supporté
      }
    }
  } catch (err) {
    // ignore
  }

  if (!('geolocation' in navigator)) {
    showMessage("La géolocalisation n'est pas disponible sur cet appareil.", 'error');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => {
        console.error('Geolocation error', err);
        const msg = (err && (err as any).message) ? String((err as any).message) : '';
        if (msg.includes('Permissions-Policy') || msg.toLowerCase().includes('disabled in this document')) {
          showMessage("La géolocalisation est bloquée par la politique du site (Permissions-Policy). Si le site est intégré dans une iframe, vérifiez que l'iframe a allow=\"geolocation\" ou configurez l'en-tête Permissions-Policy côté serveur.", 'error');
        } else if ((err as any).code === (err as any).PERMISSION_DENIED) {
          showMessage("Permission de localisation refusée : activez-la dans les paramètres du navigateur.", 'warning');
        } else if ((err as any).code === (err as any).POSITION_UNAVAILABLE) {
          showMessage("Position indisponible. Vérifiez la configuration GPS de votre appareil.", 'error');
        } else if ((err as any).code === (err as any).TIMEOUT) {
          showMessage("La requête de localisation a expiré. Réessayez.", 'warning');
        } else {
          showMessage("Impossible d'obtenir la position : " + (msg || 'erreur inconnue'), 'error');
        }
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}