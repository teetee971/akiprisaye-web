# 🎓 Système d'Onboarding Interactif

## Vue d'ensemble

Ce système d'onboarding utilise **React Joyride** pour guider les nouveaux utilisateurs à travers les fonctionnalités principales de l'application A KI PRI SA YÉ.

## Fonctionnalités

### ✅ Détection de première visite
- Utilise `localStorage` pour détecter si c'est la première visite de l'utilisateur
- Déclenche automatiquement le tour après 1,5 secondes de chargement de la page
- Fonctionne sans authentification (utilisateurs anonymes)

### ✅ Tour interactif guidé
Le tour comprend 6 étapes :
1. **Bienvenue** - Message d'accueil et introduction
2. **Carte interactive** - Présentation de la carte des magasins
3. **Comparateur de prix** - Explication du comparateur
4. **Observatoire des prix** - Introduction à l'observatoire
5. **Ti-panier intelligent** - Présentation du panier
6. **Finalisation** - Message de félicitations et rappel du bouton d'aide

### ✅ Bouton d'aide permanent
- Bouton flottant en bas à droite avec icône d'aide (?)
- Accessible à tout moment pour relancer le tour
- Compatible mobile et desktop

### ✅ Options utilisateur
- **Passer le tutoriel** : Bouton "Passer le tutoriel" pour masquer définitivement
- **Navigation** : Boutons "Précédent" et "Suivant" pour naviguer entre les étapes
- **Fermeture** : Possibilité de fermer à tout moment

### ✅ Accessibilité
- Navigation au clavier supportée par React Joyride
- Attributs ARIA intégrés
- Textes simples et clairs
- Overlay semi-transparent pour mettre en valeur les éléments

### ✅ Responsive design
- Adapté pour mobile, tablette et desktop
- Positionnement automatique des tooltips selon l'espace disponible
- Taille de police et espacement optimisés

## Architecture technique

### Composants

#### `/src/types/onboarding.ts`
Définit les types TypeScript pour l'état et le contexte de l'onboarding.

#### `/src/services/onboardingService.ts`
Service de gestion du stockage local avec les fonctions :
- `loadOnboardingState()` - Charge l'état depuis localStorage
- `saveOnboardingState()` - Sauvegarde l'état
- `markOnboardingComplete()` - Marque comme complété
- `dismissOnboarding()` - Masque définitivement
- `resetOnboarding()` - Réinitialise (pour les tests)
- `shouldShowOnboardingTour()` - Vérifie si le tour doit s'afficher

#### `/src/context/OnboardingContext.tsx`
Contexte React qui fournit l'état et les méthodes de contrôle à toute l'application via le hook `useOnboarding()`.

#### `/src/components/OnboardingTour.tsx`
Composant principal qui intègre React Joyride avec :
- Définition des étapes du tour
- Configuration des styles
- Gestion des callbacks (completion, skip)
- Traduction française

#### `/src/components/OnboardingAutoStart.tsx`
Composant qui détecte la première visite et lance automatiquement le tour après un délai.

#### `/src/components/HelpButton.tsx`
Bouton d'aide flottant pour relancer le tour manuellement.

### Intégration

Le système est intégré dans `/src/main.jsx` :
```jsx
<OnboardingProvider>
  {/* App content */}
  <OnboardingAutoStart />
  <OnboardingTour />
  <HelpButton />
</OnboardingProvider>
```

## Utilisation

### Pour les développeurs

#### Ajouter une nouvelle étape au tour
Éditez `/src/components/OnboardingTour.tsx` et ajoutez une nouvelle étape dans `tourSteps` :

```typescript
{
  target: '[data-tour="mon-element"]', // Sélecteur CSS
  content: (
    <div>
      <h4 className="font-bold mb-1">🎯 Titre</h4>
      <p>Description de la fonctionnalité</p>
    </div>
  ),
  placement: 'bottom', // top, bottom, left, right, center
}
```

#### Marquer un élément comme cible
Ajoutez l'attribut `data-tour` à l'élément :
```jsx
<button data-tour="mon-element">Mon bouton</button>
```

#### Réinitialiser l'onboarding pour les tests
```typescript
import { resetOnboarding } from '../services/onboardingService';

// Dans votre composant ou console
resetOnboarding();
```

### Pour les utilisateurs

#### Relancer le tutoriel
1. Cliquez sur le bouton d'aide (?) en bas à droite de l'écran
2. Le tour redémarrera depuis le début

#### Masquer définitivement le tutoriel
1. Lors de l'affichage du tour, cliquez sur "Passer le tutoriel"
2. Le tour ne s'affichera plus automatiquement
3. Vous pouvez toujours le relancer manuellement avec le bouton d'aide

## Stockage des données

### localStorage
Clé : `akiprisaye_onboarding`

Structure :
```json
{
  "isFirstVisit": false,
  "hasCompletedOnboarding": true,
  "currentStep": 0,
  "totalSteps": 6,
  "dismissed": false,
  "firstVisitDate": "2026-02-07T18:00:00.000Z",
  "lastVisitDate": "2026-02-07T19:30:00.000Z"
}
```

### Conformité RGPD
- Aucune donnée personnelle n'est collectée
- Stockage local uniquement (pas de serveur)
- L'utilisateur peut effacer ses données en vidant le localStorage du navigateur

## Dépendances

- `react-joyride` ^2.9.2 - Bibliothèque de tour guidé
- `safeLocalStorage` - Utilitaire interne pour localStorage sécurisé

## Configuration

### Délai de démarrage automatique
Par défaut : 1,5 secondes
Modifier dans `/src/components/OnboardingAutoStart.tsx` :
```typescript
setTimeout(() => {
  if (shouldShowTour()) {
    startTour();
  }
}, 1500); // Modifier ici
```

### Styles du tour
Modifier dans `/src/components/OnboardingTour.tsx` dans la prop `styles` de Joyride.

## Tests

### Tests manuels
1. Vider le localStorage : `localStorage.clear()`
2. Recharger la page
3. Le tour devrait démarrer automatiquement après 1,5s

### Tests de non-régression
1. Vérifier que le tour ne bloque pas la navigation
2. Vérifier que le bouton d'aide est toujours visible
3. Tester sur mobile, tablette et desktop
4. Tester l'accessibilité au clavier (Tab, Enter, Escape)

## Améliorations futures

- [ ] Traduction en créole (locale multilingue)
- [ ] Animations personnalisées
- [ ] Tour contextuel par page (tour spécifique à la carte, au comparateur, etc.)
- [ ] Analytics : suivre le taux de complétion du tour
- [ ] A/B testing : tester différentes versions du contenu
- [ ] Tour intermédiaire pour les fonctionnalités avancées
- [ ] Synchronisation avec compte utilisateur (si connecté)

## Support

Pour toute question ou problème, créer une issue sur le dépôt GitHub.

## License

Voir LICENSE du projet principal.
