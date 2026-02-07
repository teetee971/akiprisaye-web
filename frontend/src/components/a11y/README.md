# Composants d'Accessibilité (A11Y)

Ce répertoire contient tous les composants dédiés à l'amélioration de l'accessibilité de l'application A KI PRI SA YÉ, conformément aux normes RGAA 4.1 et WCAG 2.1 Level AA.

## 📁 Structure

```
a11y/
├── A11ySettingsPanel.tsx      # Panneau modal de paramètres d'accessibilité
├── FontSizeControl.tsx        # Contrôle de la taille de police (80-200%)
├── HighContrastToggle.tsx     # Bascule mode contraste élevé
├── ReducedMotionToggle.tsx    # Bascule animations réduites
└── SkipLinks.tsx              # Liens d'évitement pour navigation clavier
```

## 🎯 Composants

### SkipLinks
**Emplacement :** Intégré dans `Layout.jsx`  
**Fonction :** Permet aux utilisateurs de navigation clavier de sauter directement au contenu principal, à la navigation ou au footer.  
**Norme :** WCAG 2.4.1 (Bypass Blocks)

```tsx
import SkipLinks from './a11y/SkipLinks';

// Dans Layout
<SkipLinks />
```

### A11ySettingsPanel
**Emplacement :** Intégré dans `Layout.jsx`  
**Fonction :** Panneau modal accessible via bouton flottant ♿ permettant de configurer toutes les préférences d'accessibilité.  
**Fonctionnalités :**
- Contrôle de taille de police
- Mode contraste élevé
- Réduction des animations
- Modes daltoniens (Protanopie, Deutéranopie, Tritanopie)
- Réinitialisation des paramètres

```tsx
import A11ySettingsPanel from './a11y/A11ySettingsPanel';

// Dans Layout
<A11ySettingsPanel />
```

### FontSizeControl
**Fonction :** Contrôle interactif de la taille de police avec slider et boutons +/-.  
**Plage :** 80% à 200%  
**Norme :** WCAG 1.4.4 (Resize text)

```tsx
import FontSizeControl from './a11y/FontSizeControl';

<FontSizeControl />
```

### HighContrastToggle
**Fonction :** Active/désactive le mode contraste élevé.  
**Norme :** WCAG 1.4.3 (Contrast Minimum) et 1.4.6 (Contrast Enhanced)

```tsx
import HighContrastToggle from './a11y/HighContrastToggle';

<HighContrastToggle />
```

### ReducedMotionToggle
**Fonction :** Active/désactive la réduction des animations.  
**Détection :** Respecte automatiquement `prefers-reduced-motion` du système.  
**Norme :** WCAG 2.3.3 (Animation from Interactions)

```tsx
import ReducedMotionToggle from './a11y/ReducedMotionToggle';

<ReducedMotionToggle />
```

## 🔧 Hook useA11yPreferences

Hook personnalisé pour gérer les préférences d'accessibilité.

### Interface

```typescript
interface A11yPreferences {
  fontSize: number;          // 80-200
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}
```

### Utilisation

```tsx
import { useA11yPreferences } from '../../hooks/useA11yPreferences';

function MyComponent() {
  const { 
    preferences,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setColorBlindMode,
    resetToDefaults
  } = useA11yPreferences();

  return (
    <div>
      <p>Taille actuelle: {preferences.fontSize}%</p>
      <button onClick={() => setFontSize(preferences.fontSize + 10)}>
        Augmenter
      </button>
      <button onClick={toggleHighContrast}>
        {preferences.highContrast ? 'Désactiver' : 'Activer'} contraste élevé
      </button>
    </div>
  );
}
```

### Fonctions disponibles

- `setFontSize(size: number)` - Définit la taille de police (80-200)
- `toggleHighContrast()` - Bascule le mode contraste élevé
- `toggleReducedMotion()` - Bascule les animations réduites
- `setColorBlindMode(mode)` - Définit le mode daltonien
- `resetToDefaults()` - Réinitialise toutes les préférences
- `savePreferences(partial)` - Sauvegarde des préférences partielles

## 💾 Persistance

Les préférences sont automatiquement sauvegardées dans `localStorage` avec la clé `akiprisaye_a11y_preferences` via `safeLocalStorage` pour éviter les crashs en cas de données corrompues.

## 🎨 Classes CSS

Les préférences appliquent automatiquement des classes CSS au `<html>` :

- `.high-contrast` - Mode contraste élevé actif
- `.reduce-motion` - Animations réduites actives
- `[data-colorblind-mode="protanopia|deuteranopia|tritanopia"]` - Mode daltonien actif
- `font-size` sur `<html>` ajusté selon la préférence

## 🧪 Tests

Pour tester l'accessibilité :

```bash
# Navigation clavier
# 1. Appuyez sur Tab au chargement pour voir les skip links
# 2. Utilisez Tab pour naviguer
# 3. Vérifiez que le focus est toujours visible

# Lecteur d'écran
# Windows: Testez avec NVDA
# macOS: Testez avec VoiceOver (Cmd+F5)

# Contraste
# Ouvrez le panneau ♿ et activez le mode contraste élevé

# Taille de police
# Ouvrez le panneau ♿ et ajustez le slider
# Vérifiez que le contenu reste lisible jusqu'à 200%
```

## 📚 Ressources

- [ACCESSIBILITY_GUIDE.md](../../../ACCESSIBILITY_GUIDE.md) - Guide complet d'accessibilité
- [KEYBOARD_SHORTCUTS.md](../../../KEYBOARD_SHORTCUTS.md) - Documentation des raccourcis clavier
- [RGAA 4.1](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Conformité :** RGAA 4.1 / WCAG 2.1 Level AA  
**Dernière mise à jour :** Février 2026
