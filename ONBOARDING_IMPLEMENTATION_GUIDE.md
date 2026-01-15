# 🚀 Guide d'Implémentation - Système d'Onboarding Intelligent

## Vue d'ensemble

Ce guide explique comment implémenter le système d'onboarding en suivant l'architecture Multi-PR définie dans [ONBOARDING_SYSTEM_SPECIFICATIONS.md](./ONBOARDING_SYSTEM_SPECIFICATIONS.md).

---

## 📦 Architecture Multi-PR

Le système est divisé en **4 Pull Requests indépendantes** pour faciliter la revue de code:

```
PR #1 (Foundation) → PR #2 (Questionnaire) → PR #3 (Recommendations) → PR #4 (Analytics)
   ↓ Merged            ↓ Merged                ↓ Merged                  ↓ Merged
   Base infrastructure  Data collection        Personalization          Metrics
```

---

## 🔧 PR #1 - Contrôle d'accès + Limite modale

**Objectif:** Créer l'infrastructure de base pour gérer les modales d'onboarding.

### Fichiers à Créer

```
src/
├── context/
│   └── OnboardingContext.tsx (nouveau)
├── types/
│   └── onboarding.ts (nouveau)
├── hooks/
│   └── useOnboarding.ts (nouveau)
├── components/
│   └── onboarding/
│       ├── OnboardingModal.tsx (nouveau)
│       └── __tests__/
│           └── OnboardingModal.test.tsx (nouveau)
└── utils/
    └── onboardingStorage.ts (nouveau)
```

### Commandes

```bash
# Créer la branche
git checkout -b feature/onboarding-pr1-foundation

# Créer les fichiers
mkdir -p src/components/onboarding/__tests__
touch src/context/OnboardingContext.tsx
touch src/types/onboarding.ts
touch src/hooks/useOnboarding.ts
touch src/components/onboarding/OnboardingModal.tsx
touch src/components/onboarding/__tests__/OnboardingModal.test.tsx
touch src/utils/onboardingStorage.ts

# Développer selon les specs
# (Voir ONBOARDING_SYSTEM_SPECIFICATIONS.md section PR #1)

# Tester
npm run test -- --run src/context/__tests__/OnboardingContext.test.tsx
npm run test -- --run src/hooks/__tests__/useOnboarding.test.ts
npm run test -- --run src/components/onboarding/__tests__/OnboardingModal.test.tsx

# Vérifier accessibilité
npm run axe:ci

# Vérifier TypeScript
npm run typecheck

# Vérifier linting
npm run lint

# Build
npm run build

# Créer la PR
git add .
git commit -m "feat(onboarding): implement PR #1 - access control and modal limits"
git push origin feature/onboarding-pr1-foundation
# Créer PR sur GitHub
```

### Checklist PR #1

- [ ] OnboardingContext créé avec state management
- [ ] Types TypeScript définis
- [ ] Hook useOnboarding fonctionnel
- [ ] Composant OnboardingModal accessible
- [ ] Tests unitaires > 80% coverage
- [ ] Pas de régression Lighthouse
- [ ] Aucun warning TypeScript/ESLint
- [ ] Documentation JSDoc complète

---

## 📝 PR #2 - Questionnaire d'intégration

**Objectif:** Créer le questionnaire en 7 étapes pour collecter le profil utilisateur.

### Fichiers à Créer

```
src/
├── components/
│   └── onboarding/
│       ├── OnboardingQuestionnaire.tsx (nouveau)
│       ├── steps/
│       │   ├── WelcomeStep.tsx (nouveau)
│       │   ├── TerritoryStep.tsx (nouveau)
│       │   ├── UseCaseStep.tsx (nouveau)
│       │   ├── FrequencyStep.tsx (nouveau)
│       │   ├── BudgetStep.tsx (nouveau)
│       │   ├── NotificationsStep.tsx (nouveau)
│       │   └── SummaryStep.tsx (nouveau)
│       └── __tests__/
│           └── OnboardingQuestionnaire.test.tsx (nouveau)
├── hooks/
│   └── useQuestionnaireState.ts (nouveau)
└── types/
    └── onboarding.ts (extension)
```

### Commandes

```bash
# Créer la branche (après merge de PR #1)
git checkout main
git pull origin main
git checkout -b feature/onboarding-pr2-questionnaire

# Créer les fichiers
mkdir -p src/components/onboarding/steps
touch src/components/onboarding/OnboardingQuestionnaire.tsx
touch src/components/onboarding/steps/WelcomeStep.tsx
touch src/components/onboarding/steps/TerritoryStep.tsx
touch src/components/onboarding/steps/UseCaseStep.tsx
touch src/components/onboarding/steps/FrequencyStep.tsx
touch src/components/onboarding/steps/BudgetStep.tsx
touch src/components/onboarding/steps/NotificationsStep.tsx
touch src/components/onboarding/steps/SummaryStep.tsx
touch src/hooks/useQuestionnaireState.ts
touch src/components/onboarding/__tests__/OnboardingQuestionnaire.test.tsx

# Développer selon les specs
# (Voir ONBOARDING_SYSTEM_SPECIFICATIONS.md section PR #2)

# Tester
npm run test -- --run src/components/onboarding/__tests__/OnboardingQuestionnaire.test.tsx
npm run test -- --run src/hooks/__tests__/useQuestionnaireState.test.ts

# Créer la PR
git add .
git commit -m "feat(onboarding): implement PR #2 - integration questionnaire"
git push origin feature/onboarding-pr2-questionnaire
```

### Checklist PR #2

- [ ] 7 étapes du questionnaire créées
- [ ] Navigation fluide (prev/next/skip)
- [ ] Validation par étape
- [ ] Sauvegarde localStorage
- [ ] Design responsive
- [ ] Tests unitaires > 80% coverage
- [ ] Accessibilité validée
- [ ] Aucun warning

---

## 🎯 PR #3 - Plan de recommandation

**Objectif:** Générer des recommandations personnalisées et guider l'utilisateur.

### Fichiers à Créer

```
src/
├── services/
│   └── recommendationEngine.ts (nouveau)
├── components/
│   └── onboarding/
│       ├── RecommendationPlan.tsx (nouveau)
│       ├── RecommendationCard.tsx (nouveau)
│       └── __tests__/
│           ├── RecommendationPlan.test.tsx (nouveau)
│           └── RecommendationCard.test.tsx (nouveau)
└── hooks/
    └── useRecommendations.ts (nouveau)
```

### Commandes

```bash
# Créer la branche (après merge de PR #2)
git checkout main
git pull origin main
git checkout -b feature/onboarding-pr3-recommendations

# Créer les fichiers
touch src/services/recommendationEngine.ts
touch src/components/onboarding/RecommendationPlan.tsx
touch src/components/onboarding/RecommendationCard.tsx
touch src/hooks/useRecommendations.ts
touch src/components/onboarding/__tests__/RecommendationPlan.test.tsx
touch src/components/onboarding/__tests__/RecommendationCard.test.tsx

# Développer selon les specs
# (Voir ONBOARDING_SYSTEM_SPECIFICATIONS.md section PR #3)

# Tester
npm run test -- --run src/services/__tests__/recommendationEngine.test.ts
npm run test -- --run src/components/onboarding/__tests__/RecommendationPlan.test.tsx

# Créer la PR
git add .
git commit -m "feat(onboarding): implement PR #3 - recommendation plan"
git push origin feature/onboarding-pr3-recommendations
```

### Checklist PR #3

- [ ] Recommendation engine fonctionnel
- [ ] Plan personnalisé généré
- [ ] Navigation vers routes recommandées
- [ ] Progression sauvegardée
- [ ] Tests unitaires > 80% coverage
- [ ] Documentation complète
- [ ] Intégration PR #1 + PR #2 validée

---

## 📊 PR #4 - Analyse

**Objectif:** Collecter des métriques anonymes pour optimiser l'onboarding.

### Fichiers à Créer

```
src/
├── services/
│   └── onboardingAnalytics.ts (nouveau)
├── hooks/
│   └── useOnboardingAnalytics.ts (nouveau)
└── components/
    └── admin/
        └── OnboardingMetricsDashboard.tsx (nouveau)
```

### Commandes

```bash
# Créer la branche (après merge de PR #3)
git checkout main
git pull origin main
git checkout -b feature/onboarding-pr4-analytics

# Créer les fichiers
mkdir -p src/components/admin
touch src/services/onboardingAnalytics.ts
touch src/hooks/useOnboardingAnalytics.ts
touch src/components/admin/OnboardingMetricsDashboard.tsx

# Développer selon les specs
# (Voir ONBOARDING_SYSTEM_SPECIFICATIONS.md section PR #4)

# Tester
npm run test -- --run src/services/__tests__/onboardingAnalytics.test.ts
npm run test -- --run src/hooks/__tests__/useOnboardingAnalytics.test.ts

# Créer la PR
git add .
git commit -m "feat(onboarding): implement PR #4 - analytics"
git push origin feature/onboarding-pr4-analytics
```

### Checklist PR #4

- [ ] Service analytics fonctionnel
- [ ] Événements trackés
- [ ] Métriques calculées
- [ ] Dashboard admin
- [ ] Respect RGPD
- [ ] Tests unitaires > 80% coverage
- [ ] Intégration complète validée

---

## 🧪 Tests & Validation

### Tests Unitaires

```bash
# Tous les tests onboarding
npm run test -- --run src/components/onboarding
npm run test -- --run src/hooks/useOnboarding
npm run test -- --run src/services/recommendationEngine

# Coverage
npm run test -- --coverage
```

### Tests Accessibilité

```bash
# Tests axe-core
npm run axe:ci

# Test manuel avec screen reader
# - VoiceOver (macOS): Cmd + F5
# - NVDA (Windows): Ctrl + Alt + N
```

### Tests Performance

```bash
# Lighthouse CI
npm run lhci

# Vérifier budgets
npm run build
# Vérifier dist/ size
```

---

## 🔐 Conformité RGPD

### Checklist

- [ ] Pas de données personnelles sans consentement
- [ ] Stockage 100% local (localStorage)
- [ ] Bouton "Supprimer mes données"
- [ ] Export JSON disponible
- [ ] Documentation transparence publiée

### Code Exemple

```typescript
// Bouton effacement dans MonCompte.tsx
<button onClick={() => {
  onboardingStorage.clear();
  questionnaireStorage.clear();
  alert('Toutes vos données d\'onboarding ont été supprimées.');
}}>
  🗑️ Supprimer mes données d'onboarding
</button>

// Bouton export
<button onClick={() => {
  const data = {
    onboarding: onboardingStorage.get(),
    questionnaire: questionnaireStorage.getAnswers(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mes-donnees-onboarding.json';
  a.click();
}}>
  📥 Exporter mes données
</button>
```

---

## 🚀 Déploiement

### Ordre de Déploiement

1. **PR #1** → Déployer en production (infrastructure silencieuse)
2. **PR #2** → Déployer en production (questionnaire actif pour nouveaux utilisateurs)
3. **PR #3** → Déployer en production (recommandations activées)
4. **PR #4** → Déployer en production (analytics activé)

### Feature Flags (Optionnel)

```typescript
// .env
VITE_ONBOARDING_ENABLED=true
VITE_ONBOARDING_ANALYTICS_ENABLED=true

// Dans le code
if (import.meta.env.VITE_ONBOARDING_ENABLED === 'true') {
  // Afficher onboarding
}
```

---

## 📈 Métriques de Succès

### KPIs à Suivre

| Métrique | Objectif | Méthode de mesure |
|----------|----------|-------------------|
| Taux de démarrage | > 70% | `onboarding_started / total_visitors` |
| Taux de complétion | > 50% | `onboarding_completed / onboarding_started` |
| Temps moyen | < 5 min | Moyenne `completed_at - started_at` |
| Rétention J+7 | > 40% | Utilisateurs revenant après 7 jours |

### Dashboard Admin

Accès: `/admin/onboarding-metrics`

---

## 🛠️ Dépannage

### Problèmes Courants

**localStorage plein:**
```typescript
// Limiter historique à 1000 événements max
const recentEvents = allEvents.slice(-1000);
```

**Modale ne s'affiche pas:**
```typescript
// Vérifier limites
const canShow = canShowModal('modal_id', 3);
console.log('Can show modal:', canShow);
```

**Tests échouent:**
```bash
# Nettoyer cache
rm -rf node_modules/.vite
npm run build
npm run test
```

---

## 📚 Ressources

- [Spécifications complètes](./ONBOARDING_SYSTEM_SPECIFICATIONS.md)
- [README principal](./README.md)
- [Architecture](./ARCHITECTURE.md)
- [Guide accessibilité](./ACCESSIBILITY_GUIDE.md)

---

## ✅ Checklist Finale

### Avant Merge en Main

- [ ] Les 4 PRs sont merged
- [ ] Tests complets passent
- [ ] Lighthouse CI ✅
- [ ] Accessibilité validée
- [ ] Documentation à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Version bump (package.json)

### Après Déploiement

- [ ] Monitoring activé
- [ ] Métriques collectées
- [ ] Feedback utilisateurs recueillis
- [ ] Optimisations planifiées

---

**Dernière mise à jour:** 14 Janvier 2026  
**Mainteneur:** Équipe A KI PRI SA YÉ
