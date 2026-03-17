# Security Audit – akiprisaye-web

**Last Updated**: 2026-03-14  
**Context**: Audit complet — sécurité, typage, React, revue de code  
**Location**: `frontend/`

## Summary

Current status: **0 vulnerabilities** ✅

- Critical: 0
- High: 0
- Moderate: 0
- Low: 0
- Total: 0

## Code Audit Findings (2026-03-14)

### JSON.parse non protégé — ✅ FIXED

**Fichiers corrigés** : `frontend/src/services/proAccountService.ts`

Deux fonctions (`loadProProfile`, `loadProAnnonces`) appelaient `JSON.parse()` directement sur des données lues en localStorage, sans bloc try/catch.
Un JSON corrompu (données altérées, quota plein, migration entre versions) aurait provoqué une exception non interceptée.

**Correction** : Remplacement par `safeLocalStorage.getJSON<T>(key, fallback)`, le wrapper interne qui gère le try/catch et la validation de type.

```ts
// Avant (dangereux)
return raw ? (JSON.parse(raw) as ProProfile) : null;

// Après (sûr)
return safeLocalStorage.getJSON<ProProfile | null>(STORAGE_PROFILE, null);
```

---

### console.log en production — ✅ FIXED

**Fichiers corrigés** :
- `frontend/src/components/products/ProductPhotoUpload.tsx`
- `frontend/src/components/products/AddMissingProduct.tsx`

Des appels `console.log()` non gardés loguaient des données utilisateur (nom de fichier, consentement, données produit) en production.

**Correction** : Encapsulation dans `if (import.meta.env.DEV)` — Vite supprime ces branches dans le bundle de production (tree-shaking).

---

### Clés React `key={index}` — ✅ FIXED

**Fichiers corrigés** : 13 composants

L'utilisation de l'index de tableau comme clé React (`key={index}`) peut provoquer des problèmes de réconciliation (rendu incorrect, perte d'état) lorsque les listes sont filtrées, triées ou modifiées.

| Composant | Clé stable utilisée |
|-----------|---------------------|
| `TerritoryPriceChart.tsx` | `entry.territory` |
| `DailyShockCard.tsx` | `` `${shock.productName}-${shock.territory}` `` |
| `AnomalyBadge.tsx` | `` `${anomaly.type}-${anomaly.severity}-...` `` |
| `OptimalRoutePreview.tsx` | `stop.store` |
| `StatsOverview.tsx` | `stat.label` |
| `SyncStats.tsx` | `stat.label` |
| `AntiCrisisReadingPanel.tsx` | `category` (string) |
| `StoreHoursDisplay.tsx` | `special.date` |
| `ProductSuggestionsDisplay.tsx` | `suggestion.product` |
| `LocationButton.tsx` | `suggestion` (string) |
| `OCRResultView.tsx` | `keyword` (string) |
| `DataUploadZone.tsx` | `file.name` |
| `ComprendrePromotionsPrixBarres.tsx` | valeur de chaque item (string) |

---

## Vulnerability Resolution

### flatted (GHSA-25h7-pfq9-p65f) - ✅ FIXED

**Previous Status**: High — unbounded recursion DoS in `parse()` revive phase  
**Package**: `flatted` (transitive dev dependency via `eslint` → `file-entry-cache` → `flat-cache`)  
**Affected Versions**: flatted < 3.4.0  
**Previous Version**: flatted 3.3.4  
**Current Version**: flatted 3.4.1

#### Resolution
- **Date Fixed**: 2026-03-13
- **Action Taken**: `npm audit fix` — upgraded flatted 3.3.4 → 3.4.1
- **Impact**: Dev-only dependency; no effect on production bundle
- **Build Status**: ✅ Success

---

### undici (multiple CVEs) - ✅ FIXED

**Previous Status**: High — WebSocket parser overflow, HTTP smuggling, memory DoS  
**Package**: `undici` (transitive dev dependency via `jsdom`)  
**Affected Versions**: undici 7.0.0 – 7.23.0  
**Previous Version**: undici 7.22.0  
**Current Version**: undici 7.24.1

#### Resolution
- **Date Fixed**: 2026-03-13
- **Action Taken**: `npm audit fix` — upgraded undici 7.22.0 → 7.24.1
- **Impact**: Dev-only dependency (`jsdom` used in test environment); no effect on production bundle
- **Build Status**: ✅ Success

---

### esbuild ≤0.24.2 (GHSA-67mh-4wv8-2f99) - ✅ FIXED

**Previous Status**: Moderate (CVSS 5.3) - Development server CORS vulnerability  
**Package**: `esbuild` (transitive dependency via `vite`)  
**Affected Versions**: esbuild ≤0.24.2, vite 0.11.0 - 6.1.6  
**Previous Version**: vite 5.4.21  
**Current Version**: vite 7.3.1, esbuild 0.27.3

#### Resolution
- **Date Fixed**: 2026-02-07
- **Action Taken**: Upgraded vite from 5.4.21 to 7.3.1 (major version upgrade)
- **esbuild Version**: Now using esbuild 0.27.3 (fixes the vulnerability)
- **Breaking Changes**: Tested and confirmed no breaking changes affecting this project
- **Build Status**: ✅ Success - all builds passing with vite 7.3.1

#### Testing Performed
- ✅ Production build completed successfully (3019 modules, 20.95s)
- ✅ Bundle sizes remain optimized and comparable to previous builds
- ✅ All vite plugins working correctly (@vitejs/plugin-react, vite-plugin-static-copy)
- ✅ npm audit shows 0 vulnerabilities
- ✅ Configuration file (vite.config.ts) compatible without modifications

## Production Build Validation

✅ **Build Status**: Success  
✅ **Bundle Size**: Optimized with lazy loading  
✅ **Security**: ✅ **0 vulnerabilities** (all fixed)  
✅ **Performance**: Initial bundle optimized with code splitting

```bash
# Latest build results (2026-02-07, vite 7.3.1)
npm run build
# vite v7.3.1 building client environment for production...
# ✓ 3019 modules transformed
# dist/assets/index-CToczNsB.js: 456.36 kB (140.26 kB gzip)
# + 50+ lazy-loaded chunks
# ✓ built in 20.95s
```

### Key Improvements
- **Security**: ✅ All npm vulnerabilities resolved
- **Vite Version**: 5.4.21 → 7.3.1 (major upgrade, no breaking changes)
- **esbuild Version**: 0.24.x → 0.27.3 (security fix)
- **Bundle Performance**: Maintained optimized bundle sizes with lazy loading
- All page components lazy-loaded via React.lazy()
- Critical components (Layout, ErrorBoundary, Providers) remain eager-loaded

## Developer Guidelines

### Security Best Practices
1. ✅ **DO**: Keep dependencies up to date with `npm audit` and `npm update`
2. ✅ **DO**: Review security advisories regularly
3. ✅ **DO**: Test builds after dependency updates
4. ✅ **DO**: Run development servers only on localhost for additional security
5. ✅ **DO**: Use `safeLocalStorage.getJSON<T>(key, fallback)` instead of bare `JSON.parse(localStorage.getItem(key))`
6. ✅ **DO**: Guard `console.log` with `if (import.meta.env.DEV)` in production components
7. ✅ **DO**: Use stable keys (id, name, or composite) instead of `key={index}` in React lists

### Build Commands
```bash
cd frontend
npm ci                 # Install exact versions from package-lock.json
npm audit              # Review vulnerabilities (should show 0)
npm run build          # Production build
```

## Upgrade Summary

### Completed (2026-03-13)
- ✅ flatted upgraded from 3.3.4 to 3.4.1 (fixes GHSA-25h7-pfq9-p65f)
- ✅ undici upgraded from 7.22.0 to 7.24.1 (fixes multiple WebSocket/HTTP CVEs)
- ✅ `npm audit` now reports **0 vulnerabilities**
- ✅ All builds and tests pass after upgrade

### Completed (2026-02-07)
- ✅ Upgraded vite from 5.4.21 to 7.3.1
- ✅ esbuild upgraded to 0.27.3 (fixes GHSA-67mh-4wv8-2f99)
- ✅ All security vulnerabilities resolved
- ✅ Production build tested and confirmed working
- ✅ No breaking changes affecting this project
- ✅ Bundle optimization maintained

## Audit History

| Date | Vulnerabilities | Action | Status |
|------|----------------|--------|--------|
| 2026-01-27 | 2 moderate (esbuild) | Initial documentation | Documented |
| 2026-02-06 | 2 moderate (esbuild) | Bundle optimization + audit update | Accepted |
| 2026-02-07 | 0 | Upgraded vite to 7.3.1, fixed all vulnerabilities | ✅ **RESOLVED** |
| 2026-03-13 | 2 high (flatted, undici) | `npm audit fix`: flatted 3.3.4→3.4.1, undici 7.22.0→7.24.1 | ✅ **RESOLVED** |
| 2026-03-14 | Code audit | JSON.parse non protégé (2 fonctions), console.log prod (2 fichiers), key={index} (13 fichiers) | ✅ **RÉSOLU** |
| 2026-03-15 | Firebase `API_KEY_INVALID` prod | Bundle `index-DHqr0YlO.js` obsolète avec clé transposée — correctif + gardes CI + audit post-déploiement | ✅ **RÉSOLU** |

## Next Review

**Scheduled**: Q3 2026 or when new vulnerabilities are reported  
**Trigger**: New vulnerability disclosure or major dependency updates

## Verification Commands

```bash
# Check current vulnerabilities
cd frontend
npm audit

# Expected output: found 0 vulnerabilities

# Verify production build
npm run build
# Expected: Success with vite 7.3.1, optimized bundle sizes

# Check versions
npm list vite esbuild
# Expected: vite@7.3.1, esbuild@0.27.3
```

---

**Status**: ✅ **ALL VULNERABILITIES RESOLVED**  
**Security Status**: 0 vulnerabilities  
**Last Updated**: 2026-03-13  
**Next Review**: Q3 2026