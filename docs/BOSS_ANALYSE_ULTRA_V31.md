# Analyse « Boss » — Version Ultra (V3.1)

_Date: 2026-03-28_

## 1) Performance mobile (objectif Lighthouse 100)

### Optimisation 1 — Code-splitting intra-page de `EspaceCreateur`
- **Constat**: la route `/espace-createur` est bien lazy-loadée au niveau routeur, mais une fois chargée, le composant reste très volumineux et rend plusieurs blocs lourds (audience IA, CPC, admin, guides, navigation) dans un seul chunk.
- **Action précise**:
  - Extraire ces blocs en sous-composants lazy:
    - `CreatorAudiencePanel`
    - `CreatorRevenuePanel`
    - `CreatorAdminTools`
    - `CreatorActivationGuide`
  - Ajouter des `Suspense` ciblés (fallback skeleton local) pour éviter de bloquer le TTI mobile.
- **Impact attendu**: baisse du JS exécuté au premier rendu de la page créateur et amélioration de **TBT/INP** sur mobile.

### Optimisation 2 — Memoization/caching des calculs runtime
- **Constat**: certains calculs sont recalculés à chaque rendu (tri complet de territoires, agrégations CPC, construction d’arrays inline).
- **Action précise**:
  - Mémoïser:
    - `mostDormantTerritory` (tri) via `useMemo` indexé sur `byTerritory`
    - métriques CPC (`getConversionStats(30)`, `getDailyStats(7)`, `weeklyRevenue`, `weeklyClicks`, `revenueTrend`) via `useMemo`
  - Sortir les arrays inline statiques hors JSX (cards KPI et quick links) pour éviter une réallocation par render.
- **Impact attendu**: réduction du coût CPU en phase d’update/rerender et meilleure fluidité (INP).

### Optimisation 3 — Assets critiques (icônes + images + CSS)
- **Constat**: `EspaceCreateur` importe un grand set d’icônes `lucide-react`; les pages publiques gardent aussi des assets hérités et des fichiers statiques dupliqués racine/public.
- **Action précise**:
  - Créer un wrapper `LazyIcon` ou regrouper les icônes réellement visibles above-the-fold, puis lazy pour les sections repliées.
  - Passer les images/illustrations créateur en formats compressés (AVIF/WebP + `sizes/srcset`) et `loading="lazy"` hors viewport.
  - Auditer les fichiers statiques dupliqués (`robots`, `sitemap`, `manifest`, logos) pour éviter double maintenance.
- **Impact attendu**: baisse du transfert et du travail JS/CSS initial (LCP + TBT).

---

## 2) Roadmap V3.1 — 3 fonctionnalités Ultra-Premium

### 1. Export Executive « 1 clic » (PDF/PPT + data room)
- Export intelligent de tableaux de bord (branding, période, territoire, KPI sélectionnés).
- Versions:
  - **PDF Board** (direction)
  - **CSV/JSON data room** (analyste)
  - **Snapshot hebdo auto-email**
- Valeur: transforme l’Espace Créateur en outil décisionnel prêt COMEX/clients.

### 2. Centre d’alertes temps réel multi-canaux
- Moteur d’alertes programmable (prix, anomalies de stock, pics de trafic, régressions conversion).
- Canaux: push web, email, Slack/Discord webhook.
- Priorisation IA: « critiques », « opportunités », « bruit ».
- Valeur: passage d’un dashboard passif à un pilotage proactif.

### 3. Copilote IA « Growth Ops » intégré
- Assistant IA branché sur la télémétrie interne:
  - résumés automatiques
  - recommandations d’actions classées par impact/effort
  - génération de plan d’expériences A/B
- Exécution guidée: bouton “Créer le ticket” / “Lancer checklist”.
- Valeur: augmente fortement la vitesse de décision/action du créateur.

---

## 3) Nettoyage — candidats obsolètes à supprimer/archiver

> ⚠️ Ces éléments sont des **candidats**. Valider via une PR de nettoyage dédiée + CI avant suppression définitive.

### A. Scripts legacy maps (probablement morts)
- `scripts/carte-google.js`
- `scripts/load-map.js`
- `scripts/map-init.js`
- Raison: scripts HTML vanilla non branchés au build Vite moderne.

### B. Génération sitemap legacy à la racine
- `scripts/generate-sitemap.mjs` (si workflow SEO actuel ne s’appuie plus dessus)
- `sitemap.xml` racine (si `frontend/public/sitemap.xml` est la source unique)
- Raison: risque de divergence entre plusieurs sources de vérité.

### C. Pages HTML legacy publiques à confirmer
- `public/observatoire.html`
- `public/comparateur.html`
- `public/comparaison-territoires.html`
- `public/anomalies-prix.html`
- `public/anti-crise-personnalisable.html`
- `public/test-observatoire.html`
- Raison: probable reliquat pré-SPA; à supprimer si non indexées et non utilisées en liens externes.

### D. Duplicats statiques racine vs `public/`
- `robots.txt` (racine) vs `public/robots.txt`
- `manifest.webmanifest` (racine) vs `public/manifest.webmanifest`
- `logo-akiprisaye.svg` (racine) vs `public/logo-akiprisaye.svg`
- Raison: simplifier la maintenance et réduire les erreurs de déploiement.
