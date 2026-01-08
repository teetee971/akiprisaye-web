```markdown
# Notes de déploiement — Géolocalisation & Permissions-Policy

Problème observé : "Geolocation has been disabled in this document by permissions policy."  
Causes possibles et solutions :

1) Page chargée dans une iframe
   - Ajouter `allow="geolocation"` sur l'iframe parent :
     `<iframe src="https://example" allow="geolocation"></iframe>`
   - Si l’iframe est sur un domaine tiers, vérifier que la politique d’hôte le permet.

2) En-tête HTTP Permissions-Policy bloque la géoloc
   - Exemple d'en-tête à ajouter côté serveur/CDN pour autoriser la même origine :
     `Permissions-Policy: geolocation=(self)`
   - Netlify : ajouter un fichier `_headers` à la racine du dossier de build :
     ```
     /*
       Permissions-Policy: geolocation=(self)
     ```
   - Cloudflare Pages / Workers : configurer via Rules ou Worker pour ajouter l'en-tête.

3) WebView Android/iOS
   - Android WebView :
     - `webView.getSettings().setGeolocationEnabled(true);`
     - Gérer `onGeolocationPermissionsShowPrompt` dans `WebChromeClient`.
     - Demander permissions runtime `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`.
   - iOS WKWebView :
     - Autoriser la géolocalisation depuis l'app native (liaison entre WKWebView & host app).

4) Limitations GitHub Pages / hébergeurs
   - GitHub Pages n’autorise pas tous les en-têtes. Si besoin d’en-têtes personnalisés, utiliser un reverse proxy (Cloudflare Workers, Netlify, etc.)

Tests & vérifications
- Lancer l'app localement (`yarn start` / `npm run dev`) et tester le bouton "Activer ma position".
- Ouvrir DevTools → Network pour inspecter les en‑têtes de réponse. Si l’erreur mentionne Permissions-Policy, ajoutez/modifiez l’en‑tête côté serveur ou ajoutez `allow="geolocation"` à l’iframe parent.
- Tester également dans un WebView natif si l’app emballe le site.

Notes
- Le code du projet affiche désormais un message utilisateur lisible quand la géoloc est bloquée ou refusée. Si vous voulez, je fournis un exemple d’injection d’en-tête via Cloudflare Worker en suivi.
```