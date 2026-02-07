# 🧪 Guide de test - Système d'onboarding

## Tests manuels

### Test 1 : Première visite

**Objectif** : Vérifier que le tour se lance automatiquement pour un nouvel utilisateur

**Étapes** :
1. Ouvrir la console développeur du navigateur (F12)
2. Vider le localStorage : `localStorage.clear()`
3. Recharger la page
4. Attendre 1,5 secondes

**Résultat attendu** :
- ✅ Un overlay semi-transparent apparaît
- ✅ Un message de bienvenue s'affiche au centre
- ✅ Les boutons "Passer le tutoriel" et "Suivant" sont visibles

---

### Test 2 : Navigation dans le tour

**Objectif** : Vérifier la navigation entre les étapes

**Étapes** :
1. Lancer le tour (première visite ou bouton d'aide)
2. Cliquer sur "Suivant" pour chaque étape
3. Observer chaque étape (6 au total)

**Résultat attendu** :
- ✅ Étape 1 : Bienvenue (centre)
- ✅ Étape 2 : Carte interactive (navigation)
- ✅ Étape 3 : Comparateur de prix (navigation)
- ✅ Étape 4 : Observatoire des prix (navigation)
- ✅ Étape 5 : Ti-panier intelligent (élément avec data-tour)
- ✅ Étape 6 : Finalisation (centre)
- ✅ Le bouton "Précédent" fonctionne pour revenir en arrière
- ✅ La progression est affichée (ex: "3/6")

---

### Test 3 : Option "Passer le tutoriel"

**Objectif** : Vérifier que l'utilisateur peut masquer définitivement le tour

**Étapes** :
1. Lancer le tour (première visite ou réinitialiser)
2. Cliquer sur "Passer le tutoriel"
3. Recharger la page plusieurs fois

**Résultat attendu** :
- ✅ Le tour se ferme immédiatement
- ✅ Le tour ne se relance PAS automatiquement aux prochains chargements
- ✅ Le bouton d'aide reste visible
- ✅ Le tour peut toujours être relancé manuellement via le bouton d'aide

---

### Test 4 : Bouton d'aide

**Objectif** : Vérifier que le bouton d'aide est accessible et fonctionnel

**Étapes** :
1. Compléter ou passer le tour initial
2. Observer le bouton en bas à droite de l'écran (icône ?)
3. Cliquer sur le bouton

**Résultat attendu** :
- ✅ Le bouton est visible sur toutes les pages
- ✅ Le bouton a un effet hover (agrandissement)
- ✅ Cliquer relance le tour depuis le début
- ✅ Le bouton est accessible au clavier (Tab + Entrée)

**Position du bouton** :
- Desktop : Bas à droite (16px de marge)
- Mobile : Bas à droite, au-dessus de 80px (pour éviter les contrôles)

---

### Test 5 : Responsive design

**Objectif** : Vérifier l'adaptation mobile et desktop

**Étapes Desktop** :
1. Ouvrir sur un écran > 1024px
2. Lancer le tour
3. Observer la position et taille des tooltips

**Étapes Mobile** :
1. Ouvrir sur mobile ou mode responsive (< 768px)
2. Lancer le tour
3. Observer la position et taille des tooltips

**Résultat attendu** :
- ✅ Desktop : Tooltips bien positionnés sous les éléments de navigation
- ✅ Mobile : Tooltips s'adaptent à la taille d'écran
- ✅ Le texte reste lisible sur toutes les tailles
- ✅ Le bouton d'aide ne masque pas d'autres éléments

---

### Test 6 : Accessibilité

**Objectif** : Vérifier la navigation au clavier et la compatibilité lecteurs d'écran

**Navigation clavier** :
1. Lancer le tour
2. Utiliser uniquement le clavier :
   - Tab : Naviguer entre les boutons
   - Entrée : Activer un bouton
   - Escape : Fermer le tour

**Résultat attendu** :
- ✅ Tous les boutons sont accessibles au Tab
- ✅ Le focus est visible (outline)
- ✅ Entrée active les boutons
- ✅ Escape ferme le tour
- ✅ Les textes sont simples et clairs

**Lecteur d'écran** (optionnel) :
- ✅ Les titres sont annoncés
- ✅ Les descriptions sont lues
- ✅ Les boutons ont des labels appropriés

---

### Test 7 : Persistance des données

**Objectif** : Vérifier le stockage dans localStorage

**Étapes** :
1. Lancer et compléter le tour
2. Ouvrir la console développeur
3. Taper : `JSON.parse(localStorage.getItem('akiprisaye_onboarding'))`

**Résultat attendu** :
```json
{
  "isFirstVisit": false,
  "hasCompletedOnboarding": true,
  "currentStep": 0,
  "totalSteps": 6,
  "dismissed": false,
  "firstVisitDate": "2026-02-07T...",
  "lastVisitDate": "2026-02-07T..."
}
```

**Si "Passer le tutoriel" a été cliqué** :
```json
{
  ...
  "dismissed": true
}
```

---

## Tests avec utilitaires de debug

### Afficher l'état actuel

```javascript
// Dans la console développeur
onboardingDebug.state()
```

**Résultat** : Affiche l'état complet de l'onboarding avec toutes les propriétés

---

### Réinitialiser l'onboarding

```javascript
// Simuler une première visite
onboardingDebug.reset()
// Puis recharger la page
```

**Résultat** : Le tour se relance comme si c'était la première fois

---

### Aide des commandes

```javascript
onboardingDebug.help()
```

**Résultat** : Liste toutes les commandes disponibles

---

## Tests de non-régression

### ✅ Le tour ne bloque pas la navigation
- On peut toujours naviguer entre les pages pendant le tour
- Fermer le tour permet d'utiliser l'application normalement

### ✅ Le tour ne provoque pas d'erreurs
- Aucune erreur dans la console
- L'application reste réactive

### ✅ Compatibilité navigateurs
- Chrome/Edge : ✅
- Firefox : ✅
- Safari : ✅
- Mobile Safari : ✅
- Mobile Chrome : ✅

---

## Scénarios de cas limites

### Cas 1 : Éléments de navigation non présents
**Situation** : Sur mobile, certains éléments de navigation peuvent être cachés

**Comportement attendu** : 
- React Joyride passe automatiquement à l'étape suivante si l'élément n'est pas trouvé
- Ou affiche le tooltip au centre si placement impossible

### Cas 2 : localStorage désactivé
**Situation** : Utilisateur en mode privé ou localStorage désactivé

**Comportement attendu** :
- safeLocalStorage gère l'erreur sans crash
- Le tour peut toujours être lancé manuellement
- Les préférences ne sont pas sauvegardées

### Cas 3 : Données corrompues dans localStorage
**Situation** : localStorage contient des données invalides

**Comportement attendu** :
- safeLocalStorage.getJSON retourne les valeurs par défaut
- Aucun crash, l'application fonctionne normalement

---

## Critères de succès

### ✅ Fonctionnalité
- [ ] Le tour se lance automatiquement à la première visite
- [ ] Navigation fluide entre les 6 étapes
- [ ] Option "Passer" fonctionne et mémorise le choix
- [ ] Bouton d'aide visible et fonctionnel partout
- [ ] Persistance des préférences dans localStorage

### ✅ Expérience utilisateur
- [ ] Textes clairs et compréhensibles
- [ ] Design cohérent avec l'application
- [ ] Transitions fluides
- [ ] Pas de blocage de l'interface

### ✅ Accessibilité
- [ ] Navigation au clavier complète
- [ ] Focus visible
- [ ] Textes lisibles (contraste suffisant)
- [ ] Compatible lecteurs d'écran

### ✅ Performance
- [ ] Aucun lag lors de l'affichage du tour
- [ ] Chargement rapide de React Joyride
- [ ] Pas d'impact sur le score Lighthouse

### ✅ Sécurité
- [ ] 0 vulnérabilités npm audit
- [ ] Pas de données sensibles stockées
- [ ] Conformité RGPD (stockage local uniquement)

---

## Rapporter un bug

Si vous trouvez un problème :

1. Notez les étapes pour reproduire
2. Copiez l'état de l'onboarding : `onboardingDebug.state()`
3. Faites une capture d'écran
4. Consultez la console pour les erreurs
5. Créez une issue GitHub avec ces informations

---

## Checklist finale

Avant de marquer la feature comme complète :

- [ ] Tous les tests manuels passent
- [ ] Tests sur mobile ET desktop
- [ ] Navigation au clavier vérifiée
- [ ] Aucune erreur en console
- [ ] Build de production réussi
- [ ] npm audit : 0 vulnérabilités
- [ ] Documentation à jour
- [ ] Screenshots capturés pour la PR

---

**Date du dernier test** : _À compléter_  
**Testeur** : _À compléter_  
**Navigateur** : _À compléter_  
**Résolution** : _À compléter_
