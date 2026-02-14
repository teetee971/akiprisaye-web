# Audit d'usage du dossier `backend/` (branche `main`)

## Résumé succinct
Le dossier `backend/` contient un backend Node/Express TypeScript complet, mais il n'est **pas intégré** dans la chaîne CI/CD de production actuelle (Cloudflare Pages) qui construit et déploie uniquement le frontend statique. Le frontend consomme majoritairement des endpoints `/api/*` exposés via des Functions côté frontend (`frontend/functions/api/*`) ou des APIs tierces, avec quelques hooks encore orientés backend local (`VITE_API_URL` / `localhost:3001`).

**Conclusion recommandée : `backend prototype inactif` (avec traces d'usage partiel en dev/local).**

---

## 1) Scan de la structure du repo

### 1.1 Contenu API dans `backend/`
- `backend/package.json` définit un service backend autonome (`akiprisaye-backend`) avec scripts `dev`, `build`, `start`, `test`, `lint`, Prisma, etc.
- `backend/src/app.ts` configure un serveur Express, enregistre de nombreuses routes (`/api/auth`, `/api/legal-entities`, `/api/prices`, etc.) et démarre un listener sur `PORT` (défaut `3001`).
- `backend/src/api/routes/map.routes.ts` expose aussi des routes `GET /api/map/nearby` et `GET /api/map/route`.

### 1.2 Package et scripts dédiés backend
- Le backend possède son propre `package.json` et lockfile (`backend/package-lock.json`).
- Les scripts backend sont complets (build/start/test), indépendants du root.

### 1.3 Références backend dans CI/CD / scripts racine
- Le `package.json` racine ne lance que le frontend (`cd frontend && ...`) pour `build`, `dev`, `preview`.
- Le workflow de déploiement (`.github/workflows/deploy.yml`) construit et déploie `frontend/dist` vers Cloudflare Pages; aucune étape ne build/déploie `backend/`.
- Seul `observatory-pipeline.yml` mentionne `backend/**` dans les *triggers* (paths), mais ses jobs exécutent uniquement des tâches frontend/data/scripts.

### 1.4 Consommation backend par le frontend
- Plusieurs pages/components frontend appellent des endpoints relatifs `/api/...`.
- Les hooks de carte (`useNearbyStores`, `useRoute`) ciblent explicitement `VITE_API_URL` ou `http://localhost:3001`, donc un backend Node local est attendu en fallback.
- En parallèle, le repo contient des Functions HTTP dans `frontend/functions/api/*` (ex: `health`, `product`, `local-price`, `web-price`, `price-search`) qui couvrent une partie des endpoints consommés par le frontend, sans dépendre de `backend/`.

---

## 2) Identification de l'usage réel

## 2.1 Backend déployé/consommé en prod ?
**Indice principal : non, pas via les workflows versionnés.**
- La pipeline de déploiement officielle ne publie que `frontend/dist` sur Cloudflare Pages.
- Aucun job de CI/CD n'installe/build/lance `backend/` en production.

## 2.2 Usage partiel / incohérences
- Le frontend expose la route publique `/carte-interactive` qui utilise des hooks appelant `/api/map/*` via `localhost:3001` par défaut.
- Or, ces endpoints `/api/map/*` existent dans `backend/src/api/routes/map.routes.ts`, mais ce routeur n'est pas monté dans `backend/src/app.ts` (qui monte `geocoding`, `stores`, `products`, etc.).
- Cela indique un couplage inachevé: même en exécutant `backend/`, la carte interactive ne pointera pas automatiquement sur ces routes sans correction de montage/contrat API.

---

## 3) Verdict et recommandation

### Verdict
**`backend prototype inactif`**
- Backend techniquement riche et exploitable en local.
- Mais non branché à la CI/CD de prod actuelle.
- Frontend en prod semble prioritairement orienté statique + functions légères + APIs externes.

### Recommandations
1. **Option A — Suppression/archivage du backend (si non stratégique)**
   - Bénéfices: réduction de dette technique, CI plus simple, moins de confusion (`/api` du frontend vs backend Express), maintenance sécurité réduite.

2. **Option B — Refactor isolé vers Cloudflare Pages Functions / Workers**
   - Migrer les endpoints réellement utilisés vers `frontend/functions/api/*` (ou `functions/*` selon cible runtime).
   - Harmoniser les contrats API (`/api/map/*` vs `/api/stores/*`) pour supprimer les routes orphelines.

3. **Option C — Réactivation backend “vraie prod”**
   - Ajouter pipeline build/test/deploy dédiée backend.
   - Publier URL backend (ex: `https://api...`) et renseigner `VITE_API_URL` en production.
   - Aligner le frontend sur les endpoints effectivement exposés par `backend/src/app.ts`.

### Priorité pratique
- À court terme: **documenter explicitement** le statut du backend (actif/inactif) + corriger la route carte interactive (désactiver fallback `localhost` en prod, ou connecter un endpoint réel).
- À moyen terme: choisir entre **consolidation serverless** (Functions) ou **backend séparé industrialisé** (Express+Prisma déployé).
