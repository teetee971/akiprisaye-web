# Cadre Qualité & Transparence — A KI PRI SA YÉ

## 🎯 Vision

A KI PRI SA YÉ applique une **gouvernance qualité stricte et vérifiable** pour garantir :
1. Une expérience utilisateur décente même sur réseaux dégradés (DOM/ROM/COM)
2. Une accessibilité universelle (WCAG 2.1 AA)
3. Une transparence totale sur les métriques techniques
4. Une crédibilité institutionnelle (pas de marketing creux)

## 🔒 Principes Non Négociables

### 1. Zéro Warning Autorisé

Tout warning, quelle que soit sa nature, est traité comme une erreur bloquante :
- TypeScript : `tsc --noEmit --pretty false`
- ESLint : `--max-warnings=0`
- Build Vite : Aucun warning accepté
- npm audit : Vulnérabilités ≥ moderate bloquent le build

### 2. Qualité Mesurable

Toutes les métriques de qualité sont :
- **Automatisées** (CI/CD)
- **Bloquantes** (échec = pas de merge)
- **Publiques** (rapports accessibles)
- **Traçables** (historique conservé)

### 3. Pas de Régression

Aucune Pull Request ne peut :
- Dégrader les scores Lighthouse
- Violer les budgets performance
- Casser l'accessibilité
- Introduire des vulnérabilités

## 📊 Métriques & Seuils

### Lighthouse CI

| Catégorie | Seuil | Justification |
|-----------|-------|---------------|
| Performance | ≥ 85 | Navigation fluide en 3G/4G instable |
| Accessibilité | ≥ 95 | Utilisable par tous, handicaps inclus |
| Best Practices | ≥ 95 | Sécurité et compatibilité |
| SEO | ≥ 90 | Visibilité et partage |

### Core Web Vitals

| Métrique | Seuil | Impact |
|----------|-------|--------|
| LCP (Largest Contentful Paint) | < 3.5s | Ressenti de chargement |
| CLS (Cumulative Layout Shift) | < 0.1 | Stabilité visuelle |
| FCP (First Contentful Paint) | < 2.5s | Premier contenu visible |
| TBT (Total Blocking Time) | < 300ms | Réactivité interaction |
| Speed Index | < 4.0s | Vitesse de rendu |

### Budgets Performance

| Ressource | Budget | Contrôle |
|-----------|--------|----------|
| Scripts JS | 350 KB | Lighthouse |
| Images | 500 KB | Lighthouse |
| CSS | 50 KB | Lighthouse |
| **Total page** | **1.2 MB** | **Lighthouse** |

### Accessibilité WCAG 2.1 AA

Tests automatisés via `axe-core` :

#### Critères bloquants
- ✅ Contraste de couleurs ≥ 4.5:1 (texte normal)
- ✅ Contraste de couleurs ≥ 3:1 (texte large)
- ✅ Navigation clavier complète
- ✅ Focus visible sur tous les éléments interactifs
- ✅ ARIA labels sur éléments non natifs
- ✅ ARIA roles valides et appropriés
- ✅ Alt text sur toutes les images
- ✅ Labels sur tous les formulaires
- ✅ Ordre des titres logique (h1 → h2 → h3...)
- ✅ Structure sémantique HTML5

#### Pages testées
- `/` (Accueil)
- `/#/anti-crise` (Module Anti-Crise)
- `/#/comparateur` (Comparateur prix)
- `/#/observatoire` (Observatoire temps réel)

## 🔧 Pipeline CI/CD

### Étapes (ordre strict)

```
1. Install dependencies (npm ci)
2. TypeScript strict check (tsc --noEmit)
3. ESLint strict (--max-warnings=0)
4. Build Vite (zero warnings)
5. Tests fonctionnels (Vitest)
6. Security audit (npm audit)
7. Accessibility tests (axe-core)
8. Lighthouse CI (performance + budgets)
9. Deploy to Cloudflare Pages
```

### Échec à n'importe quelle étape = PR rejetée

Aucun bypass n'est possible, même pour les admins.

## 📈 Transparence Publique

### Rapports Lighthouse

- **URL publique** générée à chaque build
- Postée automatiquement en commentaire de PR
- Conservée 30 jours dans GitHub Actions artifacts
- Accessible sans authentification

### Prochaine étape : Page `/transparence/qualite-technique`

Contenu prévu :
- Historique des scores Lighthouse (graphiques)
- Tendances Core Web Vitals
- Justification des choix techniques
- Comparaison avec d'autres plateformes DOM
- Open data sur les métriques qualité

## 🎨 Bonnes Pratiques Appliquées

### Performance

- **Code splitting** : Routes chargées à la demande
- **Lazy loading** : Cartes Leaflet chargées uniquement si affichées
- **Image optimization** : WebP/AVIF avec fallback
- **Compression** : Gzip/Brotli activé
- **Fonts locales** : Pas de Google Fonts (latence DOM)
- **Tree shaking** : Code mort éliminé
- **Caching** : Service Worker + Cache API

### Accessibilité

- **Mobile-first** : Design responsive natif
- **Navigation clavier** : Tab, Shift+Tab, Enter, Espace
- **Skip links** : Lien "Aller au contenu principal"
- **ARIA** : Utilisé uniquement quand HTML natif insuffisant
- **Contrastes** : Testés automatiquement (WCAG AA)
- **Focus visible** : Outline claire sur tous les éléments
- **Alternatives texte** : Images, icônes, graphiques

### Sécurité

- **CSP** (Content Security Policy) : Activé sur Cloudflare
- **HTTPS only** : Pas de HTTP
- **No third-party trackers** : Aucun tracker marketing
- **npm audit** : Automatisé en CI
- **Dependencies** : Mises à jour régulières (non-breaking)

### Respect utilisateurs

- **Pas de dark patterns** : Pas de FOMO artificiel
- **Pas de prix simulés** : Données réelles uniquement
- **Transparence sources** : Enseignes et dates visibles
- **RGPD** : Pas de collecte sans consentement
- **Offline-ready** : Service Worker pour cache local

## 🧪 Tests Locaux

### Avant de commit

```bash
# Vérification complète
npm run ci:strict

# Lighthouse + Accessibilité
npm run ci:full
```

### Tests individuels

```bash
# TypeScript
npm run typecheck

# ESLint
npm run lint

# Build
npm run build

# Accessibilité
npm run axe

# Lighthouse
npm run lhci
```

## 🚫 Anti-Patterns Interdits

- ❌ Supprimer un warning au lieu de le corriger
- ❌ Utiliser `any` TypeScript sans justification
- ❌ Désactiver une règle ESLint localement
- ❌ Merge une PR avec CI en échec
- ❌ Ignorer un warning "pour plus tard"
- ❌ Ajouter une dépendance sans vérifier les alternatives
- ❌ Dupliquer du code au lieu de refactoriser
- ❌ Commiter du code non formatté

## 📚 Ressources

### Documentation officielle
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe-core](https://github.com/dequelabs/axe-core)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)

### Outils recommandés
- [Lighthouse Chrome Extension](https://chrome.google.com/webstore/detail/lighthouse/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebPageTest](https://www.webpagetest.org/)

## 🎯 Positionnement Stratégique

### Ce que nous ne sommes PAS

- ❌ Une app "bons plans" avec prix simulés
- ❌ Un site avec dark patterns
- ❌ Une plateforme d'affiliation déguisée
- ❌ Un service freemium avec fonctions bridées

### Ce que nous SOMMES

- ✅ Données réelles et vérifiables
- ✅ Qualité mesurée objectivement
- ✅ Respect des utilisateurs DOM/ROM/COM
- ✅ Transparence totale (code, méthodes, sources)
- ✅ Open source (licence à définir)

### Résultat attendu

**Crédibilité institutionnelle** auprès de :
- Collectivités territoriales
- Associations de consommateurs
- Médias locaux et nationaux
- Chercheurs en économie
- Institutions publiques (INSEE, DGCCRF, etc.)

## 📝 Changelog Qualité

### 2026-01-12 : Mise en place CI Strict
- ✅ Lighthouse CI avec seuils stricts
- ✅ Budgets performance bloquants
- ✅ Tests accessibilité automatisés (axe-core)
- ✅ TypeScript strict mode
- ✅ ESLint --max-warnings=0
- ✅ Rapports publics automatiques
- ✅ Documentation complète

### Prochaines étapes
- [ ] Page publique `/transparence/qualite-technique`
- [ ] Historique graphique des scores
- [ ] Tests E2E avec Playwright
- [ ] Visual regression testing
- [ ] Performance monitoring en production

---

**Dernière mise à jour :** 2026-01-12  
**Maintenu par :** Équipe A KI PRI SA YÉ  
**Contact :** Via GitHub Issues
