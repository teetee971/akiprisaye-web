# Guide d'Amélioration de l'Accessibilité
## A KI PRI SA YÉ - WCAG 2.1 Level AA

---

## Objectif

Rendre l'application **A KI PRI SA YÉ** accessible à tous les utilisateurs, y compris ceux utilisant des technologies d'assistance (lecteurs d'écran, navigation au clavier, etc.).

**Norme cible:** WCAG 2.1 Level AA

---

## Attributs ARIA à Ajouter

### 1. Formulaires

#### Exemple: Formulaire de Recherche EAN

**Avant:**
```html
<form id="comparateur-form">
  <label>Code EAN:</label>
  <input id="ean-input" type="text">
  <button>Rechercher</button>
</form>
```

**Après:**
```html
<form id="comparateur-form" 
      role="search"
      aria-label="Recherche de prix par code EAN">
  <label for="ean-input">Code EAN:</label>
  <input id="ean-input" 
         type="text" 
         aria-describedby="ean-help"
         aria-required="true"
         aria-invalid="false"
         placeholder="Ex: 3017620422003">
  <span id="ean-help" class="sr-only">
    Entrez le code-barres à 13 chiffres du produit
  </span>
  <button type="submit" 
          aria-label="Rechercher les prix">
    Rechercher
  </button>
</form>
```

### 2. Zones de Résultats Dynamiques

**Avant:**
```html
<div id="price-results"></div>
```

**Après:**
```html
<div id="price-results" 
     role="region" 
     aria-live="polite" 
     aria-atomic="true"
     aria-label="Résultats de prix">
  <!-- Contenu dynamique -->
</div>
```

### 3. Navigation

**Avant:**
```html
<div class="banner">
  🎗️ Lutte contre la vie chère
</div>
```

**Après:**
```html
<nav aria-label="Navigation principale">
  <div class="banner" role="banner">
    <span aria-hidden="true">🎗️</span> 
    <span>Lutte contre la vie chère – Mobilisation Outre-mer / Métropole</span>
  </div>
</nav>
```

### 4. Boutons d'Action

**Avant:**
```html
<button onclick="scanBarcode()">📷</button>
```

**Après:**
```html
<button onclick="scanBarcode()" 
        aria-label="Scanner un code-barres avec la caméra"
        type="button">
  <span aria-hidden="true">📷</span>
  <span class="sr-only">Scanner</span>
</button>
```

---

## Navigation au Clavier

### Focus Visible

**CSS à ajouter dans style.css:**

```css
/* Focus visible pour tous les éléments interactifs */
*:focus {
  outline: 3px solid #0f62fe;
  outline-offset: 2px;
}

/* Focus amélioré pour les boutons */
button:focus,
a:focus {
  outline: 3px solid #0f62fe;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(15, 98, 254, 0.2);
}

/* Focus pour les champs de formulaire */
input:focus,
textarea:focus,
select:focus {
  outline: 3px solid #0f62fe;
  outline-offset: 2px;
  border-color: #0f62fe;
}

/* Ne jamais supprimer le focus sans alternative! */
/* INTERDIT: *:focus { outline: none; } */
```

### Skip Links

**HTML à ajouter au début du body:**

```html
<a href="#main-content" class="skip-link">
  Aller au contenu principal
</a>

<!-- CSS pour skip link -->
<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0f62fe;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 10000;
}

.skip-link:focus {
  top: 0;
}
</style>
```

### Ordre de Tabulation Logique

Assurez-vous que l'ordre de tabulation (Tab) suit l'ordre visuel:

```html
<!-- Bon ordre -->
<input tabindex="0"> <!-- Ordre naturel -->
<button tabindex="0">Submit</button>

<!-- Mauvais ordre -->
<input tabindex="3">
<button tabindex="1">  <!-- Se focus avant l'input! -->
```

**Règle:** Évitez `tabindex` > 0, utilisez l'ordre DOM naturel.

---

## Contraste des Couleurs

### Exigences WCAG 2.1 AA

- **Texte normal:** Ratio minimum 4.5:1
- **Texte large (18pt+ ou 14pt+ gras):** Ratio minimum 3:1
- **Composants UI:** Ratio minimum 3:1

### Vérification

Utilisez ces outils:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- DevTools > Lighthouse > Accessibility

### Exemples à Corriger

```css
/* ❌ MAUVAIS - Contraste insuffisant */
.testimonial {
  background: #2a2a2a;
  color: #666666;  /* Ratio: 2.5:1 - FAIL */
}

/* ✅ BON - Contraste suffisant */
.testimonial {
  background: #2a2a2a;
  color: #e0e0e0;  /* Ratio: 10.4:1 - PASS */
}
```

---

## Textes Alternatifs

### Images

**Avant:**
```html
<img src="logo.png">
```

**Après:**
```html
<img src="logo.png" 
     alt="Logo A KI PRI SA YÉ - Comparateur de prix">
```

### Images Décoratives

```html
<!-- Image purement décorative -->
<img src="decoration.png" alt="" role="presentation">
```

### Icônes

**Avant:**
```html
<span class="icon">🔍</span>
```

**Après:**
```html
<span class="icon" aria-hidden="true">🔍</span>
<span class="sr-only">Rechercher</span>
```

---

## Tableaux Accessibles

### Structure de Tableau

**Avant:**
```html
<table>
  <tr>
    <td>Magasin</td>
    <td>Prix</td>
  </tr>
  <tr>
    <td>Carrefour</td>
    <td>5,99€</td>
  </tr>
</table>
```

**Après:**
```html
<table role="table" aria-label="Comparaison des prix">
  <caption>Prix du produit dans différents magasins</caption>
  <thead>
    <tr>
      <th scope="col">Magasin</th>
      <th scope="col">Territoire</th>
      <th scope="col">Prix</th>
      <th scope="col">Prix/unité</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Carrefour</th>
      <td>Martinique</td>
      <td>5,99€</td>
      <td>1,20€/kg</td>
    </tr>
  </tbody>
</table>
```

---

## Lecteurs d'Écran

### Classe .sr-only (Screen Reader Only)

**CSS à ajouter:**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Utilisation

```html
<button>
  <span aria-hidden="true">🗑️</span>
  <span class="sr-only">Supprimer l'élément</span>
</button>
```

---

## Langue et Direction

### Définir la Langue

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>A KI PRI SA YÉ</title>
  </head>
</html>
```

### Sections en Langue Étrangère

```html
<p>Le prix est de <span lang="en">5 dollars</span></p>
```

---

## États et Propriétés ARIA

### Boutons Toggle

```html
<button aria-pressed="false" 
        onclick="toggleFavorite(this)">
  <span aria-hidden="true">⭐</span>
  <span class="sr-only">Ajouter aux favoris</span>
</button>

<script>
function toggleFavorite(btn) {
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', !pressed);
}
</script>
```

### Champs Invalides

```html
<label for="email">Email:</label>
<input id="email" 
       type="email" 
       aria-invalid="true"
       aria-describedby="email-error">
<span id="email-error" role="alert">
  Veuillez entrer une adresse email valide
</span>
```

### Chargement

```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Chargement des prix en cours...</span>
  <div class="spinner" aria-hidden="true"></div>
</div>
```

---

## Checklist d'Accessibilité par Page

### Pour Chaque Page HTML

- [ ] Attribut `lang="fr"` sur `<html>`
- [ ] Meta viewport présent
- [ ] Titre `<title>` descriptif et unique
- [ ] Structure de headings logique (h1 > h2 > h3)
- [ ] Tous les formulaires ont des labels
- [ ] Tous les boutons ont un texte ou aria-label
- [ ] Toutes les images ont un alt
- [ ] Contraste des couleurs ≥ 4.5:1
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Navigation au clavier possible
- [ ] Pas de pièges au clavier
- [ ] Zones dynamiques avec aria-live
- [ ] Skip links présents
- [ ] Tableaux avec caption et scope
- [ ] ARIA utilisé correctement (pas de sur-utilisation)

---

## Outils de Test

### Automatiques

1. **Lighthouse** (Chrome DevTools)
   ```bash
   npm install -g lighthouse
   lighthouse https://akiprisaye.pages.dev/ --view
   ```

2. **axe DevTools** (Extension Chrome/Firefox)
   - Détecte automatiquement les problèmes WCAG

3. **WAVE** (WebAIM)
   - Outil en ligne: https://wave.webaim.org/

### Manuels

1. **Navigation au clavier**
   - Débranchez la souris et naviguez avec Tab, Enter, Espace

2. **Lecteur d'écran**
   - Windows: NVDA (gratuit)
   - Mac: VoiceOver (intégré)
   - Linux: Orca

3. **Zoom**
   - Testez jusqu'à 200% de zoom

4. **Contraste**
   - Simulez différents types de daltonisme

---

## Implémentation Progressive

### Phase 1 (Semaine 1) - Critiques
- [ ] Ajouter les attributs `lang`
- [ ] Corriger les labels de formulaires
- [ ] Ajouter `alt` sur toutes les images
- [ ] Focus visible sur tous les éléments

### Phase 2 (Semaine 2-3) - Importantes
- [ ] ARIA sur les zones dynamiques
- [ ] Skip links
- [ ] Améliorer les contrastes
- [ ] Attributs ARIA sur les boutons

### Phase 3 (Semaine 4-6) - Optimisations
- [ ] Navigation au clavier avancée
- [ ] Tests avec lecteurs d'écran
- [ ] Documentation pour les développeurs
- [ ] Formation de l'équipe

---

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

---

*Guide créé: Novembre 2025*  
*Objectif: 95+ sur Lighthouse Accessibility*
