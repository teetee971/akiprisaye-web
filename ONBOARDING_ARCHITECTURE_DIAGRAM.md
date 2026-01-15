# 🏗️ Architecture du Système d'Onboarding - Vue Schématique

## Diagramme Global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYSTÈME D'ONBOARDING INTELLIGENT                  │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   PR #1    │→ │   PR #2    │→ │   PR #3    │→ │   PR #4    │       │
│  │Foundation  │  │Questionnaire│  │Recommenda- │  │ Analytics  │       │
│  │            │  │            │  │   tions    │  │            │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PR #1 - Foundation (Infrastructure)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PR #1 - FOUNDATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │  OnboardingContext   │  ← State Management Global            │
│  │  ┌───────────────┐  │                                       │
│  │  │ isFirstVisit  │  │                                       │
│  │  │ completed     │  │                                       │
│  │  │ currentStep   │  │                                       │
│  │  │ dismissedModals│ │                                       │
│  │  │ modalViewCount│  │                                       │
│  │  └───────────────┘  │                                       │
│  └──────────────────────┘                                       │
│             ↓                                                    │
│  ┌──────────────────────┐                                       │
│  │  useOnboarding Hook  │  ← API Publique                      │
│  │  ┌───────────────┐  │                                       │
│  │  │ canShowModal  │  │                                       │
│  │  │ dismissModal  │  │                                       │
│  │  │ completeOnbd  │  │                                       │
│  │  └───────────────┘  │                                       │
│  └──────────────────────┘                                       │
│             ↓                                                    │
│  ┌──────────────────────┐                                       │
│  │  OnboardingModal     │  ← Composant UI                      │
│  │  ┌───────────────┐  │                                       │
│  │  │ Backdrop      │  │                                       │
│  │  │ Focus Trap    │  │                                       │
│  │  │ Accessibility │  │                                       │
│  │  │ Animations    │  │                                       │
│  │  └───────────────┘  │                                       │
│  └──────────────────────┘                                       │
│             ↓                                                    │
│  ┌──────────────────────┐                                       │
│  │  onboardingStorage   │  ← Persistence                       │
│  │  ┌───────────────┐  │                                       │
│  │  │ localStorage  │  │                                       │
│  │  │ get() / set() │  │                                       │
│  │  │ clear()       │  │                                       │
│  │  └───────────────┘  │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## PR #2 - Questionnaire (7 Étapes)

```
┌──────────────────────────────────────────────────────────────────────┐
│                      PR #2 - QUESTIONNAIRE                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  OnboardingQuestionnaire                                             │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                                                             │     │
│  │  Step 1: WelcomeStep                                       │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ 👋 Bienvenue !                        │                 │     │
│  │  │ Personnalisez votre expérience       │                 │     │
│  │  │ [Commencer] [Ignorer]                │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  │  Step 2: TerritoryStep                                     │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ 🗺️ Votre territoire ?                │                 │     │
│  │  │ [GP] [MQ] [GF] [RE] [YT] ...         │                 │     │
│  │  │ [← Retour] [Suivant →]               │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  │  Step 3: UseCaseStep                                       │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ 🎯 Cas d'usage principal ?           │                 │     │
│  │  │ ○ Comparer les prix                  │                 │     │
│  │  │ ○ Suivre évolution prix              │                 │     │
│  │  │ ○ Trouver magasins moins chers       │                 │     │
│  │  │ ○ Scanner tickets                    │                 │     │
│  │  │ [← Retour] [Suivant →]               │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  │  Step 4: FrequencyStep                                     │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ 🛒 Fréquence d'achat ?               │                 │     │
│  │  │ ○ Quotidienne                        │                 │     │
│  │  │ ○ Hebdomadaire                       │                 │     │
│  │  │ ○ Bimensuelle                        │                 │     │
│  │  │ ○ Mensuelle                          │                 │     │
│  │  │ [← Retour] [Suivant →]               │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  │  Step 5: BudgetStep (optionnel)                            │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ 💰 Budget mensuel ?                  │                 │     │
│  │  │ ○ < 500€                             │                 │     │
│  │  │ ○ 500-1000€                          │                 │     │
│  │  │ ○ 1000-1500€                         │                 │     │
│  │  │ [← Retour] [Suivant →] [Ignorer]    │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  │  Step 6: NotificationsStep (optionnel)                     │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ 🔔 Notifications ?                   │                 │     │
│  │  │ □ Alertes hausses prix               │                 │     │
│  │  │ □ Promotions près de chez moi        │                 │     │
│  │  │ □ Actualités économiques             │                 │     │
│  │  │ [← Retour] [Suivant →]               │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  │  Step 7: SummaryStep                                       │     │
│  │  ┌──────────────────────────────────────┐                 │     │
│  │  │ ✅ Récapitulatif                     │                 │     │
│  │  │ • Territoire: Guadeloupe             │                 │     │
│  │  │ • Usage: Comparer les prix           │                 │     │
│  │  │ • Fréquence: Hebdomadaire            │                 │     │
│  │  │ [← Modifier] [Terminer ✓]           │                 │     │
│  │  └──────────────────────────────────────┘                 │     │
│  │           ↓                                                │     │
│  └───────────┼────────────────────────────────────────────────┘     │
│              ↓                                                       │
│  ┌───────────────────────────────────────────────────────┐          │
│  │ questionnaireStorage.saveAnswers(answers)             │          │
│  │ localStorage: 'akiprisaye_onboarding_questionnaire_v1'│          │
│  └───────────────────────────────────────────────────────┘          │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## PR #3 - Recommendations (Personnalisation)

```
┌───────────────────────────────────────────────────────────────────────┐
│                    PR #3 - PLAN DE RECOMMANDATION                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ RecommendationEngine                                    │          │
│  │ ┌─────────────────────────────────────────────────────┐ │          │
│  │ │ generateRecommendations(profile)                    │ │          │
│  │ │                                                       │ │          │
│  │ │ switch (profile.primaryUseCase) {                   │ │          │
│  │ │   case 'price_comparison':                          │ │          │
│  │ │     → Recommend "Scanner produit"                   │ │          │
│  │ │   case 'store_finding':                             │ │          │
│  │ │     → Recommend "Carte interactive"                 │ │          │
│  │ │   case 'receipt_scanning':                          │ │          │
│  │ │     → Recommend "Scanner ticket"                    │ │          │
│  │ │ }                                                    │ │          │
│  │ │                                                       │ │          │
│  │ │ if (profile.territory) {                            │ │          │
│  │ │   → Add "Prix territoire"                           │ │          │
│  │ │ }                                                    │ │          │
│  │ │                                                       │ │          │
│  │ │ if (profile.frequency === 'weekly') {               │ │          │
│  │ │   → Add "Liste courses intelligente"                │ │          │
│  │ │ }                                                    │ │          │
│  │ │                                                       │ │          │
│  │ │ return recommendations.sort(by priority)            │ │          │
│  │ └─────────────────────────────────────────────────────┘ │          │
│  └─────────────────────────────────────────────────────────┘          │
│                        ↓                                               │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ RecommendationPlan Component                            │          │
│  │ ┌─────────────────────────────────────────────────────┐ │          │
│  │ │ 🎯 Votre plan personnalisé                          │ │          │
│  │ │ ━━━━━━━━━━━━━━━━━━━━━━ 60% ━━━━━━━━━━━━━━━━━━━━   │ │          │
│  │ │ 3 / 5 terminées                                     │ │          │
│  │ │                                                       │ │          │
│  │ │ ✅ [COMPLÉTÉ] Scannez votre premier produit         │ │          │
│  │ │    Vous avez découvert le scanner                   │ │          │
│  │ │                                                       │ │          │
│  │ │ ✅ [COMPLÉTÉ] Explorez la carte des magasins        │ │          │
│  │ │    Carte consultée                                  │ │          │
│  │ │                                                       │ │          │
│  │ │ ✅ [COMPLÉTÉ] Consultez prix Guadeloupe             │ │          │
│  │ │    Observatoire visité                              │ │          │
│  │ │                                                       │ │          │
│  │ │ ⏱️ [EN COURS] Liste de courses intelligente         │ │          │
│  │ │    Optimisez votre trajet                           │ │          │
│  │ │    [Commencer →]                                    │ │          │
│  │ │                                                       │ │          │
│  │ │ 🔲 [À FAIRE] Configurez vos alertes prix           │ │          │
│  │ │    Soyez notifié des hausses                        │ │          │
│  │ │    [Commencer →]                                    │ │          │
│  │ │                                                       │ │          │
│  │ │ [Fermer]                                            │ │          │
│  │ └─────────────────────────────────────────────────────┘ │          │
│  └─────────────────────────────────────────────────────────┘          │
│                        ↓                                               │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ Navigation contextuelle                                 │          │
│  │ onClick → navigate(recommendation.targetRoute)          │          │
│  │ Example: navigate('/liste-courses-intelligente')       │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## PR #4 - Analytics (Métriques)

```
┌───────────────────────────────────────────────────────────────────────┐
│                         PR #4 - ANALYTICS                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ OnboardingAnalytics Service                             │          │
│  │ ┌─────────────────────────────────────────────────────┐ │          │
│  │ │ trackEvent(eventType, data)                         │ │          │
│  │ │                                                       │ │          │
│  │ │ Events tracked:                                      │ │          │
│  │ │ • onboarding_started                                │ │          │
│  │ │ • onboarding_completed                              │ │          │
│  │ │ • onboarding_skipped                                │ │          │
│  │ │ • questionnaire_step_viewed                         │ │          │
│  │ │ • questionnaire_step_completed                      │ │          │
│  │ │ • recommendation_viewed                             │ │          │
│  │ │ • recommendation_completed                          │ │          │
│  │ │ • modal_viewed                                      │ │          │
│  │ │ • modal_dismissed                                   │ │          │
│  │ │                                                       │ │          │
│  │ │ Storage:                                            │ │          │
│  │ │ localStorage: 'onboarding_events' (max 1000)       │ │          │
│  │ └─────────────────────────────────────────────────────┘ │          │
│  └─────────────────────────────────────────────────────────┘          │
│                        ↓                                               │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ OnboardingMetricsDashboard (Admin)                      │          │
│  │ ┌─────────────────────────────────────────────────────┐ │          │
│  │ │ 📊 Métriques d'Onboarding                           │ │          │
│  │ │                                                       │ │          │
│  │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│ │          │
│  │ │ │   75%    │ │  4.2 min │ │   1,234  │ │   925    ││ │          │
│  │ │ │ Taux de  │ │  Temps   │ │ Démarra- │ │ Complé-  ││ │          │
│  │ │ │complétion│ │  moyen   │ │   ges    │ │   tés    ││ │          │
│  │ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘│ │          │
│  │ │                                                       │ │          │
│  │ │ 📉 Abandons par étape:                              │ │          │
│  │ │ Step 1: ████████████████████ 5%                     │ │          │
│  │ │ Step 2: █████████████████ 8%                        │ │          │
│  │ │ Step 3: ████████████ 12%                            │ │          │
│  │ │ Step 4: █████████ 10%                               │ │          │
│  │ │ Step 5: ███████ 7%                                  │ │          │
│  │ │ Step 6: ████ 4%                                     │ │          │
│  │ │ Step 7: ██ 2%                                       │ │          │
│  │ │                                                       │ │          │
│  │ │ 🏆 Top Recommandations:                             │ │          │
│  │ │ 1. Scanner produit (92% complétion)                │ │          │
│  │ │ 2. Carte interactive (87% complétion)              │ │          │
│  │ │ 3. Prix territoire (81% complétion)                │ │          │
│  │ └─────────────────────────────────────────────────────┘ │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                        │
│  Privacy:                                                              │
│  ✅ Données anonymes (pas d'userId)                                   │
│  ✅ Stockage local uniquement                                         │
│  ✅ Consentement explicite requis                                     │
│  ✅ Suppression possible à tout moment                                │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Flux Complet Utilisateur

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FLUX UTILISATEUR COMPLET                             │
└────────────────────────────────────────────────────────────────────────┘

Utilisateur arrive sur l'app (première visite)
        ↓
┌───────────────────────────────────────┐
│ OnboardingContext détecte première    │
│ visite via localStorage                │
│ → isFirstVisit = true                 │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ OnboardingModal s'affiche             │
│ "👋 Bienvenue ! Personnalisez votre   │
│ expérience en 5 minutes"              │
│ [Commencer] [Plus tard]               │
└───────────────────────────────────────┘
        ↓ (Clique "Commencer")
┌───────────────────────────────────────┐
│ OnboardingQuestionnaire s'ouvre       │
│ Step 1/7 → WelcomeStep                │
│ ⏱️ trackEvent('onboarding_started')  │
└───────────────────────────────────────┘
        ↓ (Navigation étapes)
┌───────────────────────────────────────┐
│ Step 2/7 → TerritoryStep              │
│ Sélectionne: Guadeloupe               │
│ ⏱️ trackEvent('step_viewed', {2})    │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ Step 3/7 → UseCaseStep                │
│ Sélectionne: price_comparison         │
└───────────────────────────────────────┘
        ↓ (Continue...)
┌───────────────────────────────────────┐
│ Step 7/7 → SummaryStep                │
│ Récap + Validation                    │
│ [Terminer ✓]                          │
└───────────────────────────────────────┘
        ↓ (Clique "Terminer")
┌───────────────────────────────────────┐
│ questionnaireStorage.saveAnswers()    │
│ ⏱️ trackEvent('onboarding_completed')│
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ RecommendationEngine génère plan      │
│ basé sur réponses questionnaire       │
│ → 5 recommandations personnalisées    │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ RecommendationPlan s'affiche          │
│ "🎯 Votre plan personnalisé"          │
│ Liste des 5 recommandations           │
└───────────────────────────────────────┘
        ↓ (Clique "Scanner produit")
┌───────────────────────────────────────┐
│ navigate('/scanner')                  │
│ ⏱️ trackEvent('recommendation_       │
│              completed', {id})        │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ Utilisateur utilise le scanner        │
│ Expérience personnalisée continue...  │
└───────────────────────────────────────┘
```

---

## Intégration avec Pages Existantes

```
┌──────────────────────────────────────────────────────────────────┐
│                   PAGES EXISTANTES                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Home.tsx (Page d'accueil)                                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ useEffect(() => {                                      │     │
│  │   if (isFirstVisit && !hasCompletedOnboarding) {      │     │
│  │     setShowOnboardingModal(true);                     │     │
│  │   }                                                     │     │
│  │ }, []);                                                 │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ScannerHub.tsx (Scanner)                                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ const { showModalWithLimit } = useOnboarding();        │     │
│  │                                                         │     │
│  │ useEffect(() => {                                       │     │
│  │   if (showModalWithLimit('scanner_first_use', 1)) {    │     │
│  │     setShowScannerTutorial(true);                      │     │
│  │   }                                                      │     │
│  │ }, []);                                                  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Carte.jsx (Carte interactive)                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ const { canShowModal } = useOnboarding();              │     │
│  │                                                         │     │
│  │ if (canShowModal('map_geolocation_tip', 2)) {          │     │
│  │   // Afficher tip géolocalisation                      │     │
│  │ }                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layout.tsx (Navigation globale)                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ const { recommendations, completedCount } =            │     │
│  │        useRecommendations();                           │     │
│  │                                                         │     │
│  │ <button onClick={() => setShowPlan(true)}>            │     │
│  │   🎯 Mon plan ({completedCount}/{total})              │     │
│  │ </button>                                              │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stack Technique

```
┌──────────────────────────────────────────────────────────────────┐
│                      STACK TECHNIQUE                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend                                                         │
│  ├─ React 18.3.1                                                 │
│  ├─ TypeScript 5.9.3                                             │
│  ├─ Vite 7.2.2                                                   │
│  └─ Tailwind CSS 4.1.17                                          │
│                                                                   │
│  State Management                                                 │
│  ├─ Context API                                                  │
│  ├─ Custom Hooks                                                 │
│  └─ localStorage                                                 │
│                                                                   │
│  Animations (Optionnel)                                           │
│  └─ Framer Motion ou CSS Transitions                             │
│                                                                   │
│  Testing                                                          │
│  ├─ Vitest 4.0.8                                                 │
│  ├─ Testing Library                                              │
│  └─ axe-core (Accessibilité)                                     │
│                                                                   │
│  CI/CD                                                            │
│  ├─ GitHub Actions                                               │
│  ├─ Lighthouse CI                                                │
│  └─ Cloudflare Pages                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Dépendances entre PRs

```
                    Temps →
┌─────────┬─────────┬─────────┬─────────┬──────────┐
│         │         │         │         │          │
│  PR #1  │  PR #2  │  PR #3  │  PR #4  │          │
│ (3-5j)  │ (5-7j)  │ (7-10j) │ (5-7j)  │ COMPLET! │
│         │         │         │         │          │
│ ███████ │         │         │         │          │
│ ███████ │         │         │         │          │
│ ███████ │ ███████ │         │         │          │
│         │ ███████ │         │         │          │
│         │ ███████ │ ███████ │         │          │
│         │ ███████ │ ███████ │         │          │
│         │         │ ███████ │ ███████ │          │
│         │         │ ███████ │ ███████ │          │
│         │         │         │ ███████ │   ✅     │
│         │         │         │         │          │
└─────────┴─────────┴─────────┴─────────┴──────────┘

Légende:
███ = Développement actif
✅  = Système complet déployé
```

---

## Checklist Visuelle

```
PR #1 - Foundation
┌─────────────────────────────────┐
│ [✅] OnboardingContext          │
│ [✅] useOnboarding Hook         │
│ [✅] OnboardingModal Component  │
│ [✅] onboardingStorage          │
│ [✅] Types TypeScript           │
│ [✅] Tests > 80% coverage       │
│ [✅] Accessibilité WCAG 2.1 AA  │
│ [✅] Documentation JSDoc        │
└─────────────────────────────────┘

PR #2 - Questionnaire
┌─────────────────────────────────┐
│ [✅] 7 Steps Components         │
│ [✅] Navigation prev/next/skip  │
│ [✅] useQuestionnaireState Hook │
│ [✅] Validation par étape       │
│ [✅] questionnaireStorage       │
│ [✅] Tests > 80% coverage       │
│ [✅] Design responsive          │
└─────────────────────────────────┘

PR #3 - Recommendations
┌─────────────────────────────────┐
│ [✅] RecommendationEngine       │
│ [✅] RecommendationPlan UI      │
│ [✅] RecommendationCard UI      │
│ [✅] useRecommendations Hook    │
│ [✅] Navigation contextuelle    │
│ [✅] Tests > 80% coverage       │
│ [✅] Intégration complète       │
└─────────────────────────────────┘

PR #4 - Analytics
┌─────────────────────────────────┐
│ [✅] OnboardingAnalytics        │
│ [✅] useOnboardingAnalytics     │
│ [✅] MetricsDashboard (Admin)   │
│ [✅] Event tracking             │
│ [✅] RGPD compliance            │
│ [✅] Tests > 80% coverage       │
└─────────────────────────────────┘
```

---

**Date:** 14 Janvier 2026  
**Mainteneur:** Équipe A KI PRI SA YÉ
