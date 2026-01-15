import React from 'react';
import '../styles/floating-actions.css';

type Props = {
  cartCount?: number;
  onOpenChat?: () => void;
  onOpenCart?: () => void;
};

export const FloatingActions: React.FC<Props> = ({ cartCount = 0, onOpenChat, onOpenCart }) => {
  return (
    <div className="fab-container" aria-hidden={false}>
      <button className="fab" id="chatFab" aria-label="Ouvrir le chat" onClick={onOpenChat}>
        <span className="fab-icon" aria-hidden>💬</span>
      </button>

      <button className="fab fab--large" id="cartFab" aria-label="Panier" onClick={onOpenCart}>
        <span className="fab-icon" aria-hidden>🛒</span>
        <span className="fab-badge" aria-live="polite">{cartCount}</span>
      </button>
    </div>
  );
};

export default FloatingActions;


/* Floating action buttons : empilement vertical, espacement et responsive */
.fab-container {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  z-index: 9999;
  pointer-events: none;
}

/* Chaque bouton garde son propre pointer-events */
.fab {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: linear-gradient(180deg,#1f7bff,#1c5ee0);
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: transform .14s ease, opacity .14s ease;
  font-size: 20px;
}

/* Variante large pour le bouton panier */
.fab--large {
  width: 92px;
  height: 56px;
  padding: 0 12px;
  border-radius: 28px;
  gap: 8px;
  justify-content: center;
  display: inline-flex;
}

.fab-badge {
  background: rgba(255,255,255,0.12);
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

@media (max-width: 420px) {
  .fab { width: 48px; height: 48px; font-size: 18px; }
  .fab--large { width: 76px; height: 48px; }
  .fab-container { right: 10px; bottom: 10px; gap: 8px; }
}

.fab-container--raised {
  bottom: 92px;
}

.fab:focus {
  outline: 3px solid rgba(255,255,255,0.14);
  outline-offset: 3px;
}

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

import React, { useState } from 'react';
import { requestGeolocation } from '../utils/geolocation';

export function LocationButton() {
  const [status, setStatus] = useState<string>('Statut géolocalisation : refusée ou indisponible');

  const showMessage = (m: string, _severity?: string) => {
    setStatus(m);
    // Optionnel : afficher aussi un toast/snackbar global
  };

  const onActivate = async () => {
    setStatus('Demande de position en cours...');
    const pos = await requestGeolocation(showMessage);
    if (pos) {
      setStatus('Position obtenue');
      // utiliser pos.coords.latitude / longitude ici
    }
  };

  return (
    <div>
      <p className="small-text">{status}</p>
      <button onClick={onActivate} className="primary">Activer ma position</button>
    </div>
  );
}

export default LocationButton;

```markdown
# Notes de déploiement — Géolocalisation & Permissions-Policy

Problème observé : "Geolocation has been disabled in this document by permissions policy."  
Causes possibles et solutions :

1) Page chargée dans une iframe
   - Ajouter allow="geolocation" sur l'iframe parent :
     <iframe src="https://example" allow="geolocation"></iframe>

2) En-tête HTTP Permissions-Policy bloque la géoloc
   - Exemple d'en-tête à ajouter côté serveur/CDN pour autoriser la même origine :
     Permissions-Policy: geolocation=(self)
   - Netlify : ajouter un fichier `_headers` à la racine du dossier de build :
     ```
     /*
       Permissions-Policy: geolocation=(self)
     ```
   - Cloudflare Pages / Workers : configurer via rules ou worker pour ajouter l'en-tête.

3) WebView Android/iOS
   - Android WebView :
     webView.getSettings().setGeolocationEnabled(true);
     gérer onGeolocationPermissionsShowPrompt dans WebChromeClient
     demander permission runtime ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
   - iOS WKWebView :
     configurer via the native host app pour autoriser la localisation.

4) GitHub Pages
   - GitHub Pages ne permet pas de définir certains en-têtes. Utiliser un reverse proxy (Cloudflare Workers ou Netlify) si besoin.

---

Test rapide local :
- Lance l'app localement (yarn start / npm run dev)
- Ouvrir Chrome sur mobile ou desktop et tester "Activer ma position"
- Si message d'erreur évoque Permissions-Policy, vérifier en-têtes dans l'onglet Network de DevTools.
```

```markdown
Title: Fix mobile floating action buttons overlap + graceful geolocation error handling and docs

- Problème : sur mobile, les boutons flottants (chat / panier) masquent des éléments interactifs et la géolocalisation peut être bloquée par Permissions-Policy.
- Changements :
  - Ajout d’un composant React `FloatingActions` et du CSS `floating-actions.css`.
  - Ajout d’un utilitaire `requestGeolocation(showMessage)` pour des messages utilisateur clairs.
  - Composant `LocationButton` d’exemple pour le bouton "Activer ma position".
  - `DEPLOYMENT_NOTES.md` : instructions pour corriger l’en‑tête Permissions‑Policy ou l’attribut allow sur une iframe.
- Tests : voir DEPLOYMENT_NOTES.md.
- Remarque : icônes placeholders (emoji) — remplacer par les SVG du projet pour la cohérence visuelle.
```
