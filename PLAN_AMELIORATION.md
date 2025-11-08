# Plan d'Amélioration - A KI PRI SA YÉ

Ce document fournit un plan d'action concret basé sur l'audit technique complet.

---

## 📋 Sprint 1 - Corrections Critiques (1 semaine)

### 🔴 P0 - Bloquants

- [ ] **Corriger index.html manquant**
  - Fichier: `index.html.html` → `index.html`
  - Commande: `mv index.html.html index.html`
  - Vérifier: `npm run check-assets`
  - Responsable: Dev Lead
  - Durée: 5 min

- [ ] **Configurer les tests unitaires**
  - Installer Vitest: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
  - Créer `vite.config.js` avec configuration test
  - Ajouter script dans `package.json`: `"test": "vitest"`
  - Créer premier test: `src/utils/escapeHtml.test.js`
  - Responsable: Dev Senior
  - Durée: 4h

- [ ] **Supprimer console.log en production**
  - Créer module de logging: `src/utils/logger.js`
  - Remplacer dans: `comparateur-fetch.js`, `firestorePrices.js`, `functions/api/prices.js`
  - Ajouter ESLint rule: `"no-console": "error"`
  - Responsable: Dev Mid
  - Durée: 6h

### 🟠 P1 - Haute Priorité

- [ ] **Ajouter attributs alt sur images**
  - Scanner tous les fichiers HTML: `grep -r "<img" *.html`
  - Ajouter alt descriptif sur chaque image
  - Vérifier avec axe DevTools
  - Responsable: Dev Junior
  - Durée: 3h

- [ ] **Harmoniser versions React**
  - Mettre à jour root `package.json`: `"react": "19.1.1"`, `"react-dom": "19.1.1"`
  - Supprimer dépendance `path` (built-in)
  - Tester: `npm install && npm run build`
  - Responsable: Dev Senior
  - Durée: 1h

---

## 📋 Sprint 2 - Qualité et Performance (2 semaines)

### 🟠 P1 - Haute Priorité

- [ ] **Optimiser les images**
  - Installer imagemin: `npm install -D imagemin imagemin-webp`
  - Convertir PNG en WebP: Script `scripts/convert-images.js`
  - Implémenter `<picture>` avec fallback PNG
  - Ajouter lazy loading: `loading="lazy"`
  - Responsable: Dev Mid
  - Durée: 1 jour

- [ ] **Améliorer la gestion d'erreurs**
  - Créer classe `AppError` centralisée
  - Implémenter error boundaries React
  - Ajouter logging structuré
  - Créer page d'erreur globale
  - Responsable: Dev Senior
  - Durée: 2 jours

- [ ] **Implémenter ARIA et accessibilité**
  - Audit avec Lighthouse et axe DevTools
  - Ajouter `aria-label` sur boutons et liens
  - Implémenter navigation clavier
  - Tester avec lecteur d'écran (NVDA/JAWS)
  - Responsable: Dev Mid
  - Durée: 3 jours

### 🟡 P2 - Moyenne Priorité

- [ ] **Tests E2E basiques**
  - Installer Playwright: `npm install -D @playwright/test`
  - Créer tests: recherche produit, affichage prix
  - Ajouter workflow CI: `.github/workflows/e2e.yml`
  - Responsable: QA/Dev Senior
  - Durée: 3 jours

- [ ] **Consolider configuration Firebase**
  - Fusionner `firebase_config.js` et `firebase-config.js`
  - Utiliser variables d'environnement
  - Créer `.env.example`
  - Documentation: Comment configurer
  - Responsable: Dev Senior
  - Durée: 1 jour

---

## 📋 Sprint 3 - Architecture et Documentation (2-3 semaines)

### 🟠 P1 - Haute Priorité

- [ ] **Restructurer le projet**
  - Créer structure monorepo avec workspaces
  - Organiser: `packages/app-main/`, `packages/shared/`, `packages/ui/`
  - Migrer progressivement les modules
  - Mettre à jour build scripts
  - Responsable: Architecte/Lead
  - Durée: 5 jours

- [ ] **Documenter l'API**
  - Créer spec OpenAPI: `docs/api/openapi.yml`
  - Documenter endpoint `/api/prices`
  - Ajouter exemples de requêtes/réponses
  - Setup Swagger UI pour visualisation
  - Responsable: Dev Senior
  - Durée: 2 jours

- [ ] **Créer guide de contribution**
  - Fichier: `CONTRIBUTING.md`
  - Sections: Setup, Standards, PR process, Tests
  - Ajouter templates: `.github/PULL_REQUEST_TEMPLATE.md`
  - Documentation commit convention
  - Responsable: Lead
  - Durée: 1 jour

### 🟡 P2 - Moyenne Priorité

- [ ] **Améliorer Service Worker**
  - Implémenter stratégies par type de ressource
  - Ajouter cache size limit
  - Network-first pour API
  - Tester offline functionality
  - Responsable: Dev Senior
  - Durée: 2 jours

- [ ] **Configurer Prettier et Husky**
  - Installer: `npm install -D prettier husky lint-staged`
  - Config: `.prettierrc`, `.prettierignore`
  - Pre-commit hooks: `npx husky init`
  - Formater tout le code existant
  - Responsable: Dev Mid
  - Durée: 1 jour

---

## 📋 Sprint 4 - Sécurité et Monitoring (2 semaines)

### 🟠 P1 - Haute Priorité

- [ ] **Implémenter Content Security Policy**
  - Définir CSP headers
  - Ajouter meta tag CSP
  - Tester avec csp-evaluator
  - Responsable: Security/Dev Senior
  - Durée: 1 jour

- [ ] **Setup monitoring et observabilité**
  - Intégrer Sentry pour error tracking
  - Configurer custom error boundaries
  - Ajouter performance monitoring
  - Dashboard pour métriques clés
  - Responsable: DevOps/Dev Senior
  - Durée: 2 jours

- [ ] **Audit sécurité approfondi**
  - Scanner secrets avec git-secrets
  - Vérifier règles Firestore
  - Implémenter rate limiting API
  - Documentation sécurité
  - Responsable: Security Lead
  - Durée: 3 jours

### 🟡 P2 - Moyenne Priorité

- [ ] **Automatiser déploiement**
  - Workflow: `.github/workflows/deploy.yml`
  - Environments: staging, production
  - Smoke tests post-déploiement
  - Rollback automatique si échec
  - Responsable: DevOps
  - Durée: 2 jours

- [ ] **Configurer Dependabot**
  - Fichier: `.github/dependabot.yml`
  - Auto-merge pour patches sécurité
  - Notifications Slack/Discord
  - Responsable: Lead
  - Durée: 1h

---

## 📋 Backlog - Améliorations Futures

### 🟢 P3 - Basse Priorité (Nice to Have)

- [ ] **Internationalisation complète**
  - Installer i18next
  - Extraire tous les textes
  - Support EN, FR, créole
  - Durée: 5-7 jours

- [ ] **Storybook pour composants UI**
  - Setup Storybook
  - Documenter composants
  - Visual regression tests
  - Durée: 3-5 jours

- [ ] **Analytics et insights**
  - Plausible ou PostHog
  - Privacy-friendly analytics
  - Dashboards utilisateurs
  - Durée: 2 jours

- [ ] **Performance budgets**
  - Lighthouse CI avec thresholds
  - Budget bundle size
  - Monitoring continu
  - Durée: 1 jour

- [ ] **Progressive Web App avancée**
  - Background sync
  - Push notifications
  - Add to home screen prompt
  - Durée: 3-5 jours

---

## 🎯 Métriques de Succès

### Objectifs Quantitatifs

| Métrique | Actuel | Objectif Sprint 2 | Objectif Sprint 4 |
|----------|---------|-------------------|-------------------|
| **Couverture tests** | 0% | 40% | 70% |
| **Lighthouse Performance** | ? | >80 | >90 |
| **Lighthouse Accessibility** | ? | >85 | >95 |
| **Bundle size** | 9.4MB | <2MB | <500KB |
| **Bugs critiques** | 4 | 0 | 0 |
| **Vulnérabilités** | 0 | 0 | 0 |
| **Time to Interactive** | ? | <3s | <2s |

### Objectifs Qualitatifs

- [ ] Code 100% linted et formatté
- [ ] Documentation complète et à jour
- [ ] WCAG 2.1 AA compliant
- [ ] Zero runtime errors en production
- [ ] CI/CD fully automated
- [ ] Monitoring et alerting opérationnels

---

## 📊 Estimation Globale

### Temps Total par Sprint

- **Sprint 1** (Critiques): ~3 jours dev
- **Sprint 2** (Qualité): ~10 jours dev
- **Sprint 3** (Architecture): ~12 jours dev
- **Sprint 4** (Sécurité): ~8 jours dev

**Total**: ~33 jours dev (environ 7 semaines calendaires avec 1 dev)

### Ressources Recommandées

- **1 Dev Senior**: Architecture, sécurité, reviews
- **1 Dev Mid**: Features, optimisations
- **1 Dev Junior**: Tests, documentation, fixes
- **1 QA/Test**: Tests E2E, validation

---

## 🔄 Process de Suivi

### Réunions

- **Daily standup** (15 min): Blockers, progrès
- **Sprint planning** (2h): Planification du sprint
- **Sprint review** (1h): Démo et validation
- **Retrospective** (1h): Amélioration continue

### Outils

- **Trello/Jira**: Suivi des tâches
- **GitHub Projects**: Board kanban
- **Slack/Discord**: Communication équipe
- **Confluence/Notion**: Documentation collaborative

### Revue de Code

- **Chaque PR**: Au moins 1 approbation
- **Changements critiques**: 2 approbations
- **Tests requis**: Tous verts avant merge
- **Documentation**: À jour avec les changements

---

## 📝 Notes d'Implémentation

### Commandes Utiles

```bash
# Tests
npm test                    # Lancer tous les tests
npm run test:watch         # Mode watch
npm run test:coverage      # Avec couverture

# Qualité
npm run lint               # Linter
npm run lint:fix           # Auto-fix
npm run format             # Prettier
npm run type-check         # TypeScript

# Build et déploiement
npm run build              # Build production
npm run preview            # Preview du build
npm run deploy             # Déployer (à créer)

# Outils
npm run check-assets       # Vérifier assets
npm audit                  # Audit sécurité
npm outdated               # Dépendances obsolètes
```

### Templates de Code

#### Logger
```javascript
// src/utils/logger.js
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'error';

export const logger = {
  debug: (...args) => LOG_LEVEL === 'debug' && console.log(...args),
  info: (...args) => ['debug', 'info'].includes(LOG_LEVEL) && console.info(...args),
  warn: (...args) => ['debug', 'info', 'warn'].includes(LOG_LEVEL) && console.warn(...args),
  error: (...args) => console.error(...args),
};
```

#### Error Boundary
```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';
import { logger } from '../utils/logger';

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Une erreur est survenue. Veuillez rafraîchir la page.</div>;
    }
    return this.props.children;
  }
}
```

---

## ✅ Checklist Avant Production

Avant chaque déploiement en production, vérifier:

- [ ] Tous les tests passent (unitaires + E2E)
- [ ] Lighthouse score >90 (performance, accessibilité, SEO)
- [ ] Aucune vulnérabilité npm audit
- [ ] Bundle size dans les limites (<500KB)
- [ ] Documentation à jour
- [ ] Changelog mis à jour
- [ ] Variables d'environnement configurées
- [ ] Monitoring opérationnel
- [ ] Backup des données Firebase
- [ ] Plan de rollback préparé

---

**Document version:** 1.0  
**Dernière mise à jour:** 2025-11-08  
**Contact:** dev@akiprisaye.fr
