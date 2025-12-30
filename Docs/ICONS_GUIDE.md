# Guide d'Utilisation des Icônes

Ce document décrit les icônes optimisées disponibles pour l'application A KI PRI SA YÉ.

## Icônes DOM-TOM

Les icônes DOM-TOM représentent les Départements et Régions d'Outre-Mer français.

### Fichiers disponibles

- **`dom-tom-icon.svg`** (100x100px) - Icône détaillée montrant la carte des territoires
  - Guadeloupe (GP)
  - Martinique (MQ)
  - Guyane française (GF)
  - La Réunion (RE)
  - Mayotte (YT)
  - Nouvelle-Calédonie (NC)
  - Polynésie française (PF)

- **`dom-tom-simple.svg`** (64x64px) - Icône simplifiée pour usage compact
  - Représentation stylisée d'une île tropicale
  - Couleurs du drapeau français intégrées
  - Texte "DOM-TOM"

### Utilisation

```html
<!-- Icône détaillée -->
<img src="/public/assets/dom-tom-icon.svg" alt="DOM-TOM" width="100" height="100">

<!-- Icône simple -->
<img src="/public/assets/dom-tom-simple.svg" alt="DOM-TOM" width="64" height="64">
```

### Cas d'usage

- Indiquer l'origine géographique des prix
- Filtrer par territoire
- Afficher les statistiques par région
- Navigation vers des pages spécifiques aux territoires

## Icônes Nutri-Score

Le Nutri-Score est un système d'étiquetage nutritionnel français avec 5 niveaux (A à E).

### Fichiers disponibles

#### Logos complets (200x100px)

- **`nutriscore-a.svg`** - Score A (meilleure qualité nutritionnelle, vert foncé)
- **`nutriscore-b.svg`** - Score B (bonne qualité, vert clair)
- **`nutriscore-c.svg`** - Score C (qualité moyenne, jaune)
- **`nutriscore-d.svg`** - Score D (qualité faible, orange)
- **`nutriscore-e.svg`** - Score E (qualité médiocre, rouge)

Chaque fichier met en évidence la note active et affiche les autres notes en transparence.

#### Logo de référence

- **`nutriscore-logo.svg`** (200x100px) - Affiche toutes les notes de manière égale

### Utilisation

```html
<!-- Afficher le Nutri-Score d'un produit -->
<img src="/public/assets/nutriscore-a.svg" alt="Nutri-Score A" width="200" height="100">

<!-- Logo complet pour page d'information -->
<img src="/public/assets/nutriscore-logo.svg" alt="Nutri-Score" width="200" height="100">
```

### Utilisation dynamique en JavaScript

```javascript
// Fonction pour obtenir l'icône appropriée selon le score
function getNutriScoreIcon(score) {
  const normalizedScore = score.toUpperCase();
  if (!['A', 'B', 'C', 'D', 'E'].includes(normalizedScore)) {
    return null;
  }
  return `/public/assets/nutriscore-${normalizedScore.toLowerCase()}.svg`;
}

// Exemple d'usage
const productScore = 'B';
const iconPath = getNutriScoreIcon(productScore);
document.getElementById('nutriscore').src = iconPath;
```

### Cas d'usage

- Afficher la qualité nutritionnelle des produits
- Comparer les produits selon leur Nutri-Score
- Filtrer les produits par score nutritionnel
- Éduquer les utilisateurs sur la nutrition

## Optimisation

Toutes les icônes sont au format **SVG** (Scalable Vector Graphics) pour :

- ✅ **Taille de fichier optimale** : Les SVG sont beaucoup plus légers que les PNG
- ✅ **Qualité parfaite** : Rendu net à toutes les tailles
- ✅ **Accessibilité** : Balises `<title>` intégrées pour les lecteurs d'écran
- ✅ **Performance** : Chargement rapide et mise en cache efficace

## Intégration CSS

```css
/* Exemple de style pour les icônes DOM-TOM */
.dom-tom-icon {
  width: 64px;
  height: 64px;
  display: inline-block;
  vertical-align: middle;
}

/* Exemple de style pour les Nutri-Score */
.nutriscore {
  width: 200px;
  height: 100px;
  display: block;
  margin: 10px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .nutriscore {
    width: 150px;
    height: 75px;
  }
}
```

## Accessibilité

Lors de l'utilisation de ces icônes, assurez-vous de toujours :

1. Ajouter un attribut `alt` descriptif
2. Utiliser `aria-label` si l'icône est interactive
3. Fournir un contexte textuel supplémentaire si nécessaire

```html
<!-- Bon exemple -->
<img 
  src="/public/assets/nutriscore-a.svg" 
  alt="Produit avec Nutri-Score A - Très bonne qualité nutritionnelle" 
  width="200" 
  height="100"
>

<!-- Icône interactive -->
<button aria-label="Filtrer par territoires DOM-TOM">
  <img src="/public/assets/dom-tom-simple.svg" alt="" width="24" height="24">
</button>
```

## Couleurs utilisées

### DOM-TOM
- Bleu France : `#0055A4`
- Rouge France : `#EF4135`
- Vert (végétation) : `#009E60`, `#4a7c2c`
- Océan : `#0088cc`, `#006699`

### Nutri-Score
- Score A : `#038141` (vert foncé)
- Score B : `#85BB2F` (vert clair)
- Score C : `#FECB02` (jaune)
- Score D : `#EE8100` (orange)
- Score E : `#E63E11` (rouge)

Ces couleurs respectent les standards officiels du Nutri-Score français.

## Licence

Ces icônes sont créées spécifiquement pour le projet A KI PRI SA YÉ et sont disponibles sous la même licence que le projet.

Le concept Nutri-Score est une marque officielle du Ministère de la Santé français. L'utilisation de ces représentations doit respecter les directives officielles.

---

*Dernière mise à jour : Novembre 2025*
