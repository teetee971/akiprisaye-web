# 🎓 Système d'Onboarding Intelligent - Spécifications Complètes
## A KI PRI SA YÉ

**Version:** 1.0.0  
**Date:** 14 Janvier 2026  
**Statut:** 📋 Spécifications Complètes

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Multi-PR](#architecture-multi-pr)
3. [PR #1 - Contrôle d'accès + Limite modale](#pr-1---contrôle-daccès--limite-modale)
4. [PR #2 - Questionnaire d'intégration](#pr-2---questionnaire-dintégration)
5. [PR #3 - Plan de recommandation](#pr-3---plan-de-recommandation)
6. [PR #4 - Analyse](#pr-4---analyse)
7. [Principes Fondamentaux](#principes-fondamentaux)
8. [Architecture Technique](#architecture-technique)
9. [Conformité et Sécurité](#conformité-et-sécurité)

---

## 🎯 Vue d'ensemble

Le **Système d'Onboarding Intelligent** est conçu pour guider les nouveaux utilisateurs à travers les fonctionnalités de l'application A KI PRI SA YÉ de manière progressive, contextuelle et personnalisée.

### Objectifs Principaux

- ✅ **Réduire la friction** lors de la première utilisation
- ✅ **Maximiser la découverte** des fonctionnalités clés
- ✅ **Personnaliser l'expérience** selon le profil utilisateur
- ✅ **Augmenter la rétention** à 7, 14 et 30 jours
- ✅ **Respecter la vie privée** (RGPD compliant)
- ✅ **Garantir l'accessibilité** (WCAG 2.1 AA)

### Méthodologie de Développement

Pour faciliter la revue de code et le déploiement progressif, le système est divisé en **4 Pull Requests (PR) indépendantes** :

1. **PR #1** : Contrôle d'accès + Limite modale (Infrastructure)
2. **PR #2** : Questionnaire d'intégration (Collecte de données)
3. **PR #3** : Plan de recommandation (Personnalisation)
4. **PR #4** : Analyse (Métriques et optimisation)

---

## 🏗️ Architecture Multi-PR

### Principe de Séparation

Chaque PR est **autonome et testable** :
- Peut être déployée indépendamment
- Tests unitaires et d'intégration complets
- Documentation spécifique
- Migration de données si nécessaire
- Backward compatible

### Dépendances entre PRs

```
PR #1 (Foundation)
    ↓
PR #2 (Data Collection) ← Dépend de PR #1
    ↓
PR #3 (Personalization) ← Dépend de PR #1 + PR #2
    ↓
PR #4 (Analytics) ← Dépend de PR #1 + PR #2 + PR #3
```

### Timeline Suggérée

| PR | Durée Estimation | Dépendances | Priorité |
|----|------------------|-------------|----------|
| #1 | 3-5 jours | Aucune | 🔴 Critique |
| #2 | 5-7 jours | PR #1 merged | 🟠 Haute |
| #3 | 7-10 jours | PR #1, PR #2 merged | 🟡 Moyenne |
| #4 | 5-7 jours | PR #1, PR #2, PR #3 merged | 🟢 Basse |

**Total estimé:** 20-29 jours ouvrés

---

## 📦 PR #1 - Contrôle d'accès + Limite modale

### Objectif

Créer l'infrastructure de base pour gérer l'affichage des modales d'onboarding avec contrôle d'accès et limites d'affichage.

### Composants à Créer

#### 1. OnboardingContext (`src/context/OnboardingContext.tsx`)

```typescript
interface OnboardingState {
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  dismissedModals: string[];
  modalViewCount: Record<string, number>;
}

interface OnboardingContextType {
  state: OnboardingState;
  markModalAsViewed: (modalId: string) => void;
  dismissModal: (modalId: string) => void;
  canShowModal: (modalId: string, maxViews: number) => boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}
```

**Fonctionnalités clés:**
- Détection première visite (localStorage)
- Gestion état d'affichage des modales
- Compteur de vues par modale
- Persistance locale (RGPD compliant)

#### 2. Types TypeScript (`src/types/onboarding.ts`)

```typescript
export interface OnboardingModal {
  id: string;
  title: string;
  description: string;
  maxViews: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggerCondition?: () => boolean;
  expiryDate?: Date;
}

export interface OnboardingStep {
  id: string;
  order: number;
  component: React.ComponentType<any>;
  isOptional: boolean;
  requiredForCompletion: boolean;
}

export interface UserOnboardingProfile {
  userId?: string; // null pour anonymes
  territory: string;
  language: 'fr' | 'en';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  firstVisitDate: string;
  lastVisitDate: string;
  completionStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped';
}
```

#### 3. Hook useOnboarding (`src/hooks/useOnboarding.ts`)

```typescript
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  const showModalWithLimit = useCallback((modalId: string, maxViews: number) => {
    return context.canShowModal(modalId, maxViews);
  }, [context]);

  const trackModalView = useCallback((modalId: string) => {
    context.markModalAsViewed(modalId);
    // Analytics (PR #4)
  }, [context]);

  return {
    ...context,
    showModalWithLimit,
    trackModalView,
  };
}
```

#### 4. Composant OnboardingModal (`src/components/onboarding/OnboardingModal.tsx`)

```typescript
interface OnboardingModalProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  maxViews?: number; // Default: 3
  onClose: () => void;
  onComplete?: () => void;
  dismissible?: boolean; // Default: true
  showProgress?: boolean;
}
```

**Features:**
- Backdrop avec blur
- Animation entrée/sortie (framer-motion ou CSS)
- Bouton fermeture accessible (Escape key)
- Focus trap pour accessibilité
- Aria labels complets
- Responsive mobile/desktop

#### 5. Stockage Local (`src/utils/onboardingStorage.ts`)

```typescript
const STORAGE_KEY = 'akiprisaye_onboarding_v1';

export const onboardingStorage = {
  get: (): OnboardingState | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  
  set: (state: OnboardingState): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Cannot save onboarding state:', error);
    }
  },
  
  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
```

### Tests Unitaires (PR #1)

```typescript
// src/context/__tests__/OnboardingContext.test.tsx
describe('OnboardingContext', () => {
  test('détecte première visite correctement', () => {});
  test('limite affichage modale à N fois', () => {});
  test('persiste état dans localStorage', () => {});
  test('respecte les modales dismissées', () => {});
});

// src/hooks/__tests__/useOnboarding.test.ts
describe('useOnboarding', () => {
  test('retourne état onboarding', () => {});
  test('met à jour compteur vues', () => {});
});
```

### Critères de Validation PR #1

- [ ] Context React fonctionnel
- [ ] Hook useOnboarding exporté
- [ ] Types TypeScript complets
- [ ] Composant OnboardingModal accessible (axe-core)
- [ ] Tests unitaires > 80% coverage
- [ ] Documentation JSDoc complète
- [ ] Pas de régression Lighthouse
- [ ] Aucun warning TypeScript/ESLint
- [ ] Revue de code approuvée

---

## 📝 PR #2 - Questionnaire d'intégration

### Objectif

Collecter les informations de profil utilisateur pour personnaliser l'expérience (territoire, cas d'usage, préférences).

### Composants à Créer

#### 1. OnboardingQuestionnaire (`src/components/onboarding/OnboardingQuestionnaire.tsx`)

**Étapes du questionnaire:**

##### Étape 1: Bienvenue
- Message d'accueil chaleureux
- Explication de l'objectif (30 secondes)
- Bouton "Commencer" / "Ignorer"

##### Étape 2: Territoire
- Sélecteur des 12 territoires DOM-COM
- Icônes drapeaux
- Auto-détection géolocalisation (optionnelle, avec consentement)

##### Étape 3: Cas d'Usage Principal
Options:
- 🛒 Comparer les prix avant d'acheter
- 📊 Suivre l'évolution des prix dans le temps
- 🗺️ Trouver les magasins les moins chers
- 🧾 Scanner mes tickets de caisse
- 📈 Comprendre l'économie locale
- 🤝 Participer à la solidarité (Ti-Panié)

##### Étape 4: Fréquence d'Achat
- Quotidienne
- Hebdomadaire
- Bimensuelle
- Mensuelle
- Occasionnelle

##### Étape 5: Budget Mensuel (optionnel)
- Ranges: <500€, 500-1000€, 1000-1500€, 1500-2000€, >2000€
- Possibilité de skip
- Mention: "Ces données restent sur votre appareil"

##### Étape 6: Notifications (optionnel)
- Alertes hausses de prix
- Promotions près de chez moi
- Actualités économiques locales
- Jamais (opt-out par défaut)

##### Étape 7: Finalisation
- Récapitulatif des choix
- Possibilité de modifier
- Bouton "Terminer"

#### 2. Types Questionnaire (`src/types/onboarding.ts` - extension)

```typescript
export type UseCaseType = 
  | 'price_comparison'
  | 'price_tracking'
  | 'store_finding'
  | 'receipt_scanning'
  | 'economy_understanding'
  | 'solidarity';

export type ShoppingFrequency = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'occasional';

export type BudgetRange = 
  | 'under_500'
  | '500_1000'
  | '1000_1500'
  | '1500_2000'
  | 'over_2000'
  | 'not_specified';

export interface OnboardingQuestionnaireAnswers {
  territory: string;
  primaryUseCase: UseCaseType;
  shoppingFrequency: ShoppingFrequency;
  budgetRange?: BudgetRange;
  notificationsEnabled: boolean;
  completedAt: string; // ISO date
}
```

#### 3. Hook useQuestionnaireState (`src/hooks/useQuestionnaireState.ts`)

```typescript
export function useQuestionnaireState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingQuestionnaireAnswers>>({});
  
  const updateAnswer = <K extends keyof OnboardingQuestionnaireAnswers>(
    key: K,
    value: OnboardingQuestionnaireAnswers[K]
  ) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const goToNextStep = () => setCurrentStep(prev => prev + 1);
  const goToPreviousStep = () => setCurrentStep(prev => prev - 1);
  const skipQuestionnaire = () => { /* ... */ };

  return {
    currentStep,
    answers,
    updateAnswer,
    goToNextStep,
    goToPreviousStep,
    skipQuestionnaire,
  };
}
```

#### 4. Composants Étapes

Créer des composants réutilisables:
- `WelcomeStep.tsx`
- `TerritoryStep.tsx`
- `UseCaseStep.tsx`
- `FrequencyStep.tsx`
- `BudgetStep.tsx`
- `NotificationsStep.tsx`
- `SummaryStep.tsx`

**Pattern commun:**
```typescript
interface StepProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  onSkip?: () => void;
  initialValue?: any;
}
```

### Stockage des Réponses

Utiliser le même système que PR #1:
```typescript
const QUESTIONNAIRE_KEY = 'akiprisaye_onboarding_questionnaire_v1';

export const questionnaireStorage = {
  saveAnswers: (answers: OnboardingQuestionnaireAnswers) => {
    localStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify(answers));
  },
  getAnswers: (): OnboardingQuestionnaireAnswers | null => {
    const data = localStorage.getItem(QUESTIONNAIRE_KEY);
    return data ? JSON.parse(data) : null;
  }
};
```

### Tests Unitaires (PR #2)

```typescript
describe('OnboardingQuestionnaire', () => {
  test('affiche étape 1 par défaut', () => {});
  test('navigation entre étapes fonctionne', () => {});
  test('sauvegarde réponses dans localStorage', () => {});
  test('permet de skip questionnaire', () => {});
  test('validation données avant finalisation', () => {});
});

describe('Territory selection', () => {
  test('affiche 12 territoires', () => {});
  test('sélection territoire enregistrée', () => {});
});
```

### Critères de Validation PR #2

- [ ] Questionnaire complet 7 étapes
- [ ] Navigation fluide (prev/next/skip)
- [ ] Validation données par étape
- [ ] Sauvegarde localStorage
- [ ] Composants accessibles (clavier, screen readers)
- [ ] Tests unitaires > 80% coverage
- [ ] Design responsive mobile/desktop
- [ ] Animations smooth (pas de jank)
- [ ] Aucun warning ESLint/TypeScript
- [ ] Revue de code approuvée

---

## 🎯 PR #3 - Plan de recommandation

### Objectif

Générer des recommandations personnalisées basées sur les réponses du questionnaire et guider l'utilisateur vers les fonctionnalités pertinentes.

### Composants à Créer

#### 1. Recommendation Engine (`src/services/recommendationEngine.ts`)

```typescript
export interface Recommendation {
  id: string;
  type: 'feature' | 'tutorial' | 'tip' | 'shortcut';
  title: string;
  description: string;
  icon: string;
  priority: number; // 1-10
  targetRoute?: string;
  action?: () => void;
  estimatedTime?: string; // "2 min"
  completed?: boolean;
}

export class RecommendationEngine {
  generateRecommendations(
    profile: OnboardingQuestionnaireAnswers
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Logique de recommandation basée sur primaryUseCase
    switch (profile.primaryUseCase) {
      case 'price_comparison':
        recommendations.push({
          id: 'scan_first_product',
          type: 'tutorial',
          title: 'Scannez votre premier produit',
          description: 'Comparez les prix en scannant un code-barres',
          icon: '📷',
          priority: 10,
          targetRoute: '/scanner',
          estimatedTime: '1 min'
        });
        break;
      
      case 'store_finding':
        recommendations.push({
          id: 'explore_map',
          type: 'feature',
          title: 'Explorez la carte des magasins',
          description: 'Trouvez les enseignes près de chez vous',
          icon: '🗺️',
          priority: 10,
          targetRoute: '/carte',
          estimatedTime: '2 min'
        });
        break;
      
      case 'receipt_scanning':
        recommendations.push({
          id: 'scan_receipt',
          type: 'tutorial',
          title: 'Scannez un ticket de caisse',
          description: 'Extrayez les prix avec notre OCR local',
          icon: '🧾',
          priority: 10,
          targetRoute: '/scan',
          estimatedTime: '1 min'
        });
        break;
        
      // ... autres cas
    }
    
    // Recommandations basées sur territoire
    if (profile.territory) {
      recommendations.push({
        id: 'territory_prices',
        type: 'feature',
        title: `Prix en ${getTerritoryName(profile.territory)}`,
        description: 'Consultez les prix spécifiques à votre territoire',
        icon: '📊',
        priority: 8,
        targetRoute: `/observatoire?territory=${profile.territory}`,
        estimatedTime: '3 min'
      });
    }
    
    // Recommandations basées sur fréquence
    if (profile.shoppingFrequency === 'weekly' || profile.shoppingFrequency === 'biweekly') {
      recommendations.push({
        id: 'shopping_list',
        type: 'feature',
        title: 'Liste de courses intelligente',
        description: 'Optimisez votre trajet entre magasins',
        icon: '📝',
        priority: 7,
        targetRoute: '/liste-courses-intelligente',
        estimatedTime: '5 min'
      });
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
}
```

#### 2. RecommendationPlan Component (`src/components/onboarding/RecommendationPlan.tsx`)

```typescript
interface RecommendationPlanProps {
  recommendations: Recommendation[];
  onCompleteRecommendation: (id: string) => void;
  onDismiss: () => void;
}

export function RecommendationPlan({ 
  recommendations, 
  onCompleteRecommendation,
  onDismiss 
}: RecommendationPlanProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  
  const progress = (completedIds.size / recommendations.length) * 100;
  
  return (
    <div className="recommendation-plan">
      <header>
        <h2>🎯 Votre plan personnalisé</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p>{completedIds.size} / {recommendations.length} terminées</p>
      </header>
      
      <div className="recommendations-list">
        {recommendations.map(rec => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            isCompleted={completedIds.has(rec.id)}
            onComplete={() => {
              setCompletedIds(prev => new Set([...prev, rec.id]));
              onCompleteRecommendation(rec.id);
            }}
          />
        ))}
      </div>
      
      <footer>
        <button onClick={onDismiss}>Fermer</button>
      </footer>
    </div>
  );
}
```

#### 3. RecommendationCard Component (`src/components/onboarding/RecommendationCard.tsx`)

```typescript
interface RecommendationCardProps {
  recommendation: Recommendation;
  isCompleted: boolean;
  onComplete: () => void;
}

export function RecommendationCard({ 
  recommendation, 
  isCompleted,
  onComplete 
}: RecommendationCardProps) {
  const navigate = useNavigate();
  
  const handleAction = () => {
    if (recommendation.targetRoute) {
      navigate(recommendation.targetRoute);
    } else if (recommendation.action) {
      recommendation.action();
    }
    onComplete();
  };
  
  return (
    <div className={`recommendation-card ${isCompleted ? 'completed' : ''}`}>
      <div className="card-icon">{recommendation.icon}</div>
      <div className="card-content">
        <h3>{recommendation.title}</h3>
        <p>{recommendation.description}</p>
        {recommendation.estimatedTime && (
          <span className="time-badge">⏱️ {recommendation.estimatedTime}</span>
        )}
      </div>
      <div className="card-action">
        {isCompleted ? (
          <span className="completed-badge">✅</span>
        ) : (
          <button onClick={handleAction} className="btn-primary">
            Commencer
          </button>
        )}
      </div>
    </div>
  );
}
```

#### 4. Hook useRecommendations (`src/hooks/useRecommendations.ts`)

```typescript
export function useRecommendations() {
  const { state } = useOnboarding();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const answers = questionnaireStorage.getAnswers();
    if (answers) {
      const engine = new RecommendationEngine();
      const recs = engine.generateRecommendations(answers);
      setRecommendations(recs);
    }
    setLoading(false);
  }, []);
  
  const completeRecommendation = useCallback((id: string) => {
    // Sauvegarder dans localStorage
    const completed = getCompletedRecommendations();
    completed.add(id);
    saveCompletedRecommendations(completed);
    
    // Mettre à jour état local
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, completed: true } : rec
      )
    );
  }, []);
  
  return {
    recommendations,
    loading,
    completeRecommendation,
  };
}
```

### Intégration avec Navigation

Ajouter un bouton d'accès rapide au plan de recommandation:

```typescript
// Dans Layout.tsx ou NavBar
<button 
  onClick={() => setShowRecommendationPlan(true)}
  className="recommendation-plan-trigger"
  aria-label="Voir mon plan personnalisé"
>
  🎯 Mon plan ({completedCount}/{totalCount})
</button>
```

### Tests Unitaires (PR #3)

```typescript
describe('RecommendationEngine', () => {
  test('génère recommandations selon use case', () => {});
  test('priorise recommandations correctement', () => {});
  test('adapte au territoire utilisateur', () => {});
});

describe('RecommendationPlan', () => {
  test('affiche toutes les recommandations', () => {});
  test('marque recommandation comme complétée', () => {});
  test('calcule progression correctement', () => {});
});
```

### Critères de Validation PR #3

- [ ] Recommendation engine fonctionnel
- [ ] Plan personnalisé généré depuis questionnaire
- [ ] Navigation vers routes recommandées fonctionne
- [ ] Progression sauvegardée dans localStorage
- [ ] Design responsive et accessible
- [ ] Tests unitaires > 80% coverage
- [ ] Documentation JSDoc complète
- [ ] Intégration avec PR #1 et PR #2 validée
- [ ] Aucun warning ESLint/TypeScript
- [ ] Revue de code approuvée

---

## 📊 PR #4 - Analyse

### Objectif

Collecter des métriques anonymes sur l'utilisation du système d'onboarding pour l'optimiser (taux de complétion, abandons, temps passé).

### Composants à Créer

#### 1. Analytics Service (`src/services/onboardingAnalytics.ts`)

```typescript
export interface OnboardingEvent {
  eventType: 
    | 'onboarding_started'
    | 'onboarding_completed'
    | 'onboarding_skipped'
    | 'questionnaire_step_viewed'
    | 'questionnaire_step_completed'
    | 'recommendation_viewed'
    | 'recommendation_completed'
    | 'modal_viewed'
    | 'modal_dismissed';
  timestamp: string;
  data?: Record<string, any>;
}

export interface OnboardingMetrics {
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  averageTimeToComplete: number; // en secondes
  dropoffByStep: Record<number, number>;
  mostCompletedRecommendations: string[];
  leastCompletedRecommendations: string[];
}

export class OnboardingAnalytics {
  private events: OnboardingEvent[] = [];
  
  trackEvent(eventType: OnboardingEvent['eventType'], data?: Record<string, any>) {
    const event: OnboardingEvent = {
      eventType,
      timestamp: new Date().toISOString(),
      data,
    };
    
    this.events.push(event);
    this.persistEvents();
    
    // Optionnel: envoyer à analytics externe (Google Analytics, Mixpanel, etc.)
    if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
      this.sendToExternalAnalytics(event);
    }
  }
  
  private persistEvents() {
    try {
      const stored = localStorage.getItem('onboarding_events') || '[]';
      const allEvents = [...JSON.parse(stored), ...this.events];
      
      // Garder seulement les 1000 derniers événements
      const recentEvents = allEvents.slice(-1000);
      localStorage.setItem('onboarding_events', JSON.stringify(recentEvents));
      
      this.events = [];
    } catch (error) {
      console.warn('Cannot persist onboarding events:', error);
    }
  }
  
  private sendToExternalAnalytics(event: OnboardingEvent) {
    // Intégration Google Analytics 4 / Mixpanel / Amplitude
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.eventType, {
        ...event.data,
        timestamp: event.timestamp,
      });
    }
  }
  
  getMetrics(): OnboardingMetrics {
    const storedEvents = this.getStoredEvents();
    
    const starts = storedEvents.filter(e => e.eventType === 'onboarding_started').length;
    const completions = storedEvents.filter(e => e.eventType === 'onboarding_completed').length;
    
    return {
      totalStarts: starts,
      totalCompletions: completions,
      completionRate: starts > 0 ? (completions / starts) * 100 : 0,
      averageTimeToComplete: this.calculateAverageTime(storedEvents),
      dropoffByStep: this.calculateDropoffByStep(storedEvents),
      mostCompletedRecommendations: this.getMostCompletedRecommendations(storedEvents),
      leastCompletedRecommendations: this.getLeastCompletedRecommendations(storedEvents),
    };
  }
  
  private getStoredEvents(): OnboardingEvent[] {
    try {
      const data = localStorage.getItem('onboarding_events');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  private calculateAverageTime(events: OnboardingEvent[]): number {
    // Logique calcul temps moyen
    return 0;
  }
  
  private calculateDropoffByStep(events: OnboardingEvent[]): Record<number, number> {
    // Logique calcul abandons par étape
    return {};
  }
  
  private getMostCompletedRecommendations(events: OnboardingEvent[]): string[] {
    // Logique top recommendations
    return [];
  }
  
  private getLeastCompletedRecommendations(events: OnboardingEvent[]): string[] {
    // Logique least completed recommendations
    return [];
  }
}

// Singleton instance
export const onboardingAnalytics = new OnboardingAnalytics();
```

#### 2. Hook useOnboardingAnalytics (`src/hooks/useOnboardingAnalytics.ts`)

```typescript
export function useOnboardingAnalytics() {
  const trackStart = useCallback(() => {
    onboardingAnalytics.trackEvent('onboarding_started');
  }, []);
  
  const trackComplete = useCallback(() => {
    onboardingAnalytics.trackEvent('onboarding_completed');
  }, []);
  
  const trackSkip = useCallback(() => {
    onboardingAnalytics.trackEvent('onboarding_skipped');
  }, []);
  
  const trackStepView = useCallback((stepNumber: number) => {
    onboardingAnalytics.trackEvent('questionnaire_step_viewed', { stepNumber });
  }, []);
  
  const trackRecommendationComplete = useCallback((recommendationId: string) => {
    onboardingAnalytics.trackEvent('recommendation_completed', { recommendationId });
  }, []);
  
  return {
    trackStart,
    trackComplete,
    trackSkip,
    trackStepView,
    trackRecommendationComplete,
  };
}
```

#### 3. Admin Dashboard Component (`src/components/admin/OnboardingMetricsDashboard.tsx`)

Tableau de bord pour visualiser les métriques d'onboarding (réservé aux admins):

```typescript
export function OnboardingMetricsDashboard() {
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
  
  useEffect(() => {
    const analytics = new OnboardingAnalytics();
    setMetrics(analytics.getMetrics());
  }, []);
  
  if (!metrics) return <div>Chargement...</div>;
  
  return (
    <div className="metrics-dashboard">
      <h2>📊 Métriques d'Onboarding</h2>
      
      <div className="metrics-grid">
        <MetricCard
          title="Taux de complétion"
          value={`${metrics.completionRate.toFixed(1)}%`}
          icon="✅"
        />
        <MetricCard
          title="Temps moyen"
          value={`${Math.floor(metrics.averageTimeToComplete / 60)} min`}
          icon="⏱️"
        />
        <MetricCard
          title="Démarrages"
          value={metrics.totalStarts}
          icon="🚀"
        />
        <MetricCard
          title="Complétés"
          value={metrics.totalCompletions}
          icon="🎉"
        />
      </div>
      
      <div className="dropoff-chart">
        <h3>Abandons par étape</h3>
        {/* Chart avec Chart.js ou Recharts */}
      </div>
      
      <div className="recommendations-ranking">
        <h3>Top Recommandations</h3>
        <ul>
          {metrics.mostCompletedRecommendations.map(recId => (
            <li key={recId}>{recId}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

#### 4. Intégration dans les Composants Existants

Ajouter les tracking calls dans:
- `OnboardingQuestionnaire.tsx`
- `RecommendationPlan.tsx`
- `OnboardingModal.tsx`

Exemple:
```typescript
// Dans OnboardingQuestionnaire
const { trackStart, trackStepView, trackComplete } = useOnboardingAnalytics();

useEffect(() => {
  trackStart();
}, []);

useEffect(() => {
  trackStepView(currentStep);
}, [currentStep]);

const handleComplete = () => {
  trackComplete();
  completeOnboarding();
};
```

### Privacy & RGPD

**Important:** Toutes les données collectées sont:
- ✅ Anonymes (pas d'ID utilisateur)
- ✅ Stockées localement (localStorage)
- ✅ Optionnelles (consentement via cookie consent existant)
- ✅ Supprimables (bouton "Supprimer mes données")

### Tests Unitaires (PR #4)

```typescript
describe('OnboardingAnalytics', () => {
  test('track event ajoute événement', () => {});
  test('persiste événements dans localStorage', () => {});
  test('calcule métriques correctement', () => {});
  test('limite événements stockés à 1000', () => {});
});

describe('useOnboardingAnalytics', () => {
  test('trackStart enregistre événement', () => {});
  test('trackComplete enregistre événement', () => {});
});
```

### Critères de Validation PR #4

- [ ] Service analytics fonctionnel
- [ ] Événements trackés correctement
- [ ] Métriques calculées avec précision
- [ ] Dashboard admin accessible
- [ ] Respect RGPD (données anonymes)
- [ ] Tests unitaires > 80% coverage
- [ ] Documentation JSDoc complète
- [ ] Intégration avec PR #1, #2, #3 validée
- [ ] Aucun warning ESLint/TypeScript
- [ ] Revue de code approuvée

---

## 🎨 Principes Fondamentaux

### 1. Mobile-First

Toutes les modales et composants d'onboarding doivent:
- S'afficher correctement sur mobile (320px minimum)
- Utiliser des touch targets ≥ 44px
- Éviter les scrolls horizontaux
- Supporter les gestes tactiles

### 2. Accessibilité (WCAG 2.1 AA)

- ✅ Contrastes de couleurs ≥ 4.5:1
- ✅ Navigation clavier complète (Tab, Escape, Enter)
- ✅ Focus visible sur tous les éléments interactifs
- ✅ Aria labels sur tous les boutons/liens
- ✅ Screen reader friendly
- ✅ Pas d'animations pour `prefers-reduced-motion`

### 3. Performance

- ✅ Lazy loading des composants d'onboarding
- ✅ Code splitting par PR
- ✅ Pas de dépassement de budget (voir README)
- ✅ Images optimisées (WebP/AVIF)
- ✅ Animations 60fps (GPU accelerated)

### 4. RGPD & Vie Privée

- ✅ Pas de tracking sans consentement
- ✅ Données stockées localement (localStorage)
- ✅ Possibilité de tout effacer
- ✅ Export des données (format JSON)
- ✅ Transparence totale (méthodologie publique)

### 5. Progressive Enhancement

Le système d'onboarding doit fonctionner:
- ✅ Sans JavaScript (fallback HTML)
- ✅ Sans localStorage (mode dégradé)
- ✅ Sur navigateurs anciens (transpilation Babel)

---

## 🏗️ Architecture Technique

### Stack Technologique

- **Frontend:** React 18.3.1 + TypeScript 5.9.3
- **Build:** Vite 7.2.2
- **State Management:** Context API + Hooks
- **Styling:** Tailwind CSS 4.1.17 + CSS Modules
- **Animations:** CSS Transitions + Framer Motion (optionnel)
- **Storage:** localStorage (+ sessionStorage fallback)
- **Testing:** Vitest 4.0.8 + Testing Library
- **Accessibility:** axe-core 4.11.1

### Structure des Fichiers

```
src/
├── components/
│   ├── onboarding/
│   │   ├── OnboardingModal.tsx
│   │   ├── OnboardingQuestionnaire.tsx
│   │   ├── RecommendationPlan.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── steps/
│   │   │   ├── WelcomeStep.tsx
│   │   │   ├── TerritoryStep.tsx
│   │   │   ├── UseCaseStep.tsx
│   │   │   ├── FrequencyStep.tsx
│   │   │   ├── BudgetStep.tsx
│   │   │   ├── NotificationsStep.tsx
│   │   │   └── SummaryStep.tsx
│   │   └── __tests__/
│   └── admin/
│       └── OnboardingMetricsDashboard.tsx
├── context/
│   └── OnboardingContext.tsx
├── hooks/
│   ├── useOnboarding.ts
│   ├── useQuestionnaireState.ts
│   ├── useRecommendations.ts
│   └── useOnboardingAnalytics.ts
├── types/
│   └── onboarding.ts
├── services/
│   ├── recommendationEngine.ts
│   └── onboardingAnalytics.ts
├── utils/
│   └── onboardingStorage.ts
└── styles/
    └── onboarding.css
```

### Intégration avec Pages Existantes

#### Page d'Accueil (Home.tsx)

```typescript
// Afficher modale onboarding première visite
useEffect(() => {
  if (isFirstVisit && !hasCompletedOnboarding) {
    setShowOnboardingModal(true);
  }
}, [isFirstVisit, hasCompletedOnboarding]);
```

#### Scanner (ScannerHub.tsx)

```typescript
// Afficher tooltip contextuel
const { showModalWithLimit } = useOnboarding();

useEffect(() => {
  if (showModalWithLimit('scanner_first_use', 1)) {
    setShowScannerTutorial(true);
  }
}, []);
```

#### Carte (Carte.jsx)

```typescript
// Afficher tips interactifs
const { canShowModal } = useOnboarding();

if (canShowModal('map_geolocation_tip', 2)) {
  // Afficher tip géolocalisation
}
```

---

## 🔒 Conformité et Sécurité

### RGPD

- ✅ Pas de données personnelles collectées
- ✅ Consentement explicite pour analytics
- ✅ Droit à l'effacement (bouton "Supprimer mes données")
- ✅ Droit à la portabilité (export JSON)
- ✅ Transparence totale (documentation publique)

### Sécurité

- ✅ Pas de XSS (sanitization des inputs)
- ✅ Pas de fuite de données (localStorage sécurisé)
- ✅ CSP compliant
- ✅ Pas de scripts tiers non autorisés

### Tests de Sécurité

- ✅ CodeQL scan (automatique en CI)
- ✅ npm audit (dépendances)
- ✅ OWASP Top 10 check

---

## 📈 Métriques de Succès

### KPIs à Suivre

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Taux de démarrage | > 70% | % utilisateurs qui lancent onboarding |
| Taux de complétion | > 50% | % utilisateurs qui terminent onboarding |
| Temps moyen | < 5 min | Durée moyenne du questionnaire |
| Taux d'abandon | < 20% | % utilisateurs qui quittent en cours |
| Recommandations complétées | > 3/5 | Nombre moyen de recommandations suivies |
| Rétention J+7 | > 40% | % utilisateurs revenant après 7 jours |

### A/B Testing (Futur)

Possibilité de tester différentes variantes:
- Questionnaire court (3 étapes) vs long (7 étapes)
- Recommandations avec/sans gamification
- Modales vs inline onboarding

---

## 🚀 Roadmap Post-Launch

### Phase 2 (Q2 2026)

- [ ] Onboarding personnalisé par persona
- [ ] Animations avancées (Lottie)
- [ ] Vidéos tutoriels intégrées
- [ ] Chatbot d'assistance onboarding

### Phase 3 (Q3 2026)

- [ ] Onboarding progressif (contextuel)
- [ ] Badges et achievements
- [ ] Leaderboard communautaire
- [ ] Partage social des progrès

---

## 📚 Ressources & Références

### Documentation Interne

- [README.md](./README.md) - Vue d'ensemble projet
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique
- [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) - Guidelines accessibilité
- [UserJourneyMap_v3.md](./UserJourneyMap_v3.md) - Parcours utilisateur

### Standards & Best Practices

- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RGPD - CNIL](https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on)

### Inspiration UX

- Duolingo onboarding
- Notion first-time experience
- Stripe dashboard onboarding
- Linear app guided tour

---

## ✅ Checklist Finale

### PR #1 - Contrôle d'accès + Limite modale
- [ ] OnboardingContext créé et testé
- [ ] Hook useOnboarding fonctionnel
- [ ] Types TypeScript complets
- [ ] Composant OnboardingModal accessible
- [ ] Tests unitaires > 80% coverage
- [ ] Documentation JSDoc complète
- [ ] Lighthouse CI ✅ (pas de régression)
- [ ] Aucun warning TypeScript/ESLint
- [ ] Code review approuvée
- [ ] Merged dans main

### PR #2 - Questionnaire d'intégration
- [ ] 7 étapes questionnaire implémentées
- [ ] Navigation fluide (prev/next/skip)
- [ ] Validation données par étape
- [ ] Sauvegarde localStorage
- [ ] Design responsive mobile/desktop
- [ ] Tests unitaires > 80% coverage
- [ ] Accessibilité validée (axe-core)
- [ ] Code review approuvée
- [ ] Merged dans main

### PR #3 - Plan de recommandation
- [ ] Recommendation engine fonctionnel
- [ ] Plan personnalisé généré
- [ ] Navigation vers routes recommandées
- [ ] Progression sauvegardée
- [ ] Tests unitaires > 80% coverage
- [ ] Documentation JSDoc complète
- [ ] Code review approuvée
- [ ] Merged dans main

### PR #4 - Analyse
- [ ] Service analytics fonctionnel
- [ ] Événements trackés correctement
- [ ] Métriques calculées
- [ ] Dashboard admin accessible
- [ ] Respect RGPD
- [ ] Tests unitaires > 80% coverage
- [ ] Code review approuvée
- [ ] Merged dans main

---

## 🎯 Conclusion

Ce système d'onboarding intelligent, divisé en 4 PRs indépendantes, permettra de:
1. **Guider les nouveaux utilisateurs** de manière progressive
2. **Personnaliser l'expérience** selon leur profil
3. **Augmenter la rétention** grâce aux recommandations
4. **Optimiser continuellement** via les analytics

**Estimation totale:** 20-29 jours ouvrés  
**Impact attendu:** +40% rétention J+7, +50% feature discovery

---

**Dernière mise à jour:** 14 Janvier 2026  
**Mainteneur:** Équipe A KI PRI SA YÉ  
**Contact:** [Via Issues GitHub](https://github.com/teetee971/akiprisaye-web/issues)
