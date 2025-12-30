# Guide de Test - Extension A KI PRI SA YÉ

Ce guide fournit des procédures de test pour valider l'extension browser.

## 🧪 Tests Fonctionnels

### Test 1: Installation et Configuration

**Objectif**: Vérifier que l'extension s'installe correctement

**Étapes**:
1. Charger l'extension en mode développeur
2. Vérifier l'apparition de l'icône dans la toolbar
3. Cliquer sur l'icône
4. Vérifier l'affichage du popup

**Résultat attendu**:
- ✅ Icône visible dans la toolbar
- ✅ Popup s'ouvre sans erreur
- ✅ Tous les éléments UI sont visibles
- ✅ Territoire par défaut = "France Métropolitaine"

### Test 2: Sélection de Territoire

**Objectif**: Vérifier la gestion du territoire utilisateur

**Étapes**:
1. Ouvrir le popup de l'extension
2. Changer le territoire (ex: Guadeloupe)
3. Fermer et rouvrir le popup
4. Vérifier la persistence

**Résultat attendu**:
- ✅ Le territoire sélectionné est sauvegardé
- ✅ Le territoire est affiché correctement au rechargement
- ✅ Notification "Territoire mis à jour" apparaît

### Test 3: Demande de Consentement

**Objectif**: Vérifier le workflow de consentement utilisateur

**Étapes**:
1. Vider le storage de l'extension (dev tools)
2. Visiter une page produit Carrefour
3. Observer l'affichage de la notification de consentement
4. Lire le texte de la notification
5. Cliquer sur "Activer l'assistant"

**Résultat attendu**:
- ✅ Notification de consentement s'affiche
- ✅ Texte clair sur la vie privée
- ✅ Liste des garanties visible
- ✅ Bouton "Activer" et "Non merci" présents
- ✅ Après activation, le bouton d'analyse apparaît

**Test négatif**:
- Cliquer sur "Non merci"
- ✅ La notification disparaît
- ✅ Pas de bouton d'analyse
- ✅ L'extension ne s'active pas

### Test 4: Détection de Page Produit

**Objectif**: Vérifier la détection automatique des pages produits

**Pages à tester**:
1. Page accueil Carrefour → ❌ Pas de bouton
2. Page catégorie Carrefour → ❌ Pas de bouton  
3. Page produit Carrefour (`/p/...`) → ✅ Bouton visible
4. Page produit E.Leclerc (`/p/...`) → ✅ Bouton visible
5. Page non-magasin (Google.com) → ❌ Pas de bouton

**Résultat attendu**:
- ✅ Bouton uniquement sur les pages produits
- ✅ Pas d'activation sur autres pages
- ✅ Pattern URL correctement vérifié

### Test 5: Analyse de Produit

**Objectif**: Vérifier l'extraction et l'affichage des informations produit

**Étapes**:
1. Aller sur une page produit (ex: Carrefour)
2. Cliquer sur "Analyser avec A KI PRI SA YÉ"
3. Attendre le chargement
4. Vérifier l'overlay

**Résultat attendu**:
- ✅ Overlay s'ouvre à droite
- ✅ Nom du produit extrait
- ✅ Prix affiché
- ✅ Marque affichée (si disponible)
- ✅ Boutons d'action visibles
- ✅ Bouton fermer fonctionne

**Test négatif**:
- Page produit sans données structurées
- ✅ Message d'erreur approprié
- ✅ Pas de crash de l'extension

### Test 6: Comparaison de Prix

**Objectif**: Vérifier l'affichage des comparaisons

**Étapes**:
1. Analyser un produit
2. Vérifier la section "Comparaison territoriale"
3. Observer les prix des autres magasins
4. Identifier le meilleur prix

**Résultat attendu**:
- ✅ Liste de magasins affichée
- ✅ Prix pour chaque magasin
- ✅ Badge "Meilleur prix" sur le moins cher
- ✅ Moyenne territoriale calculée
- ✅ Source et date affichées

**Si pas de données**:
- ✅ Message "Aucune donnée de comparaison disponible"
- ✅ Note sur données officielles uniquement
- ✅ Pas de prix simulés

### Test 7: Ajout à la Liste de Courses

**Objectif**: Vérifier l'ajout de produits à la liste

**Étapes**:
1. Analyser un produit
2. Cliquer sur "Ajouter à ma liste"
3. Observer la notification
4. Ouvrir le popup de l'extension
5. Vérifier le compteur "produits en liste"

**Résultat attendu**:
- ✅ Notification "Produit ajouté" apparaît
- ✅ Compteur dans popup incrémenté
- ✅ Produit stocké dans Chrome Storage

**Vérification storage**:
```javascript
chrome.storage.local.get(['shopping_list'], (result) => {
  console.log(result.shopping_list);
  // Doit contenir le produit ajouté
});
```

### Test 8: Suivi de Prix

**Objectif**: Vérifier le suivi de prix et les alertes

**Étapes**:
1. Analyser un produit
2. Cliquer sur "Suivre le prix"
3. Observer la notification
4. Ouvrir le popup
5. Vérifier le compteur "prix suivis"
6. Activer les alertes dans le popup

**Résultat attendu**:
- ✅ Notification "Suivi activé"
- ✅ Compteur "prix suivis" incrémenté
- ✅ Produit dans followed_products
- ✅ Checkbox alertes activable

### Test 9: Alertes de Variation de Prix

**Objectif**: Vérifier le système d'alertes (nécessite simulation)

**Étapes** (en mode dev):
1. Ajouter un produit suivi manuellement dans le storage
2. Simuler une variation de prix (>5%)
3. Déclencher manuellement checkFollowedPrices()
4. Observer la notification

**Résultat attendu**:
- ✅ Notification système affichée
- ✅ Message clair sur la variation
- ✅ Pourcentage de variation correct
- ✅ Lien vers le produit

### Test 10: Synchronisation PWA

**Objectif**: Vérifier la synchronisation avec l'app PWA

**Étapes**:
1. Ajouter un produit à la liste dans l'extension
2. Ouvrir l'application PWA
3. Vérifier la présence du produit
4. Ajouter un produit dans la PWA
5. Rafraîchir les données dans l'extension

**Résultat attendu**:
- ✅ Produits synchronisés extension → PWA
- ✅ Produits synchronisés PWA → extension
- ✅ Pas de doublons
- ✅ Fusion correcte en cas de conflit

## 🎨 Tests UI/UX

### Test 11: Design Liquid Glass

**Objectif**: Vérifier l'effet liquid glass

**Vérifications**:
- ✅ backdrop-filter: blur() appliqué
- ✅ Transparence rgba()
- ✅ Bordures subtiles
- ✅ Ombres portées
- ✅ Effet de profondeur

### Test 12: Thème Dark/Neutral

**Objectif**: Vérifier la cohérence du thème

**Couleurs à vérifier**:
- ✅ Background: #0f172a (slate-900)
- ✅ Text: #f1f5f9 (slate-100)
- ✅ Secondary: #94a3b8 (slate-400)
- ✅ Accent: #3b82f6 (blue-500)
- ✅ Success: #10b981 (green-500)

### Test 13: Responsive Design

**Objectif**: Vérifier l'adaptation mobile

**Étapes**:
1. Réduire la largeur de la fenêtre (<768px)
2. Observer l'overlay
3. Vérifier le popup

**Résultat attendu**:
- ✅ Overlay pleine largeur sur mobile
- ✅ Textes lisibles
- ✅ Boutons accessibles
- ✅ Pas de dépassement horizontal

### Test 14: Animations

**Objectif**: Vérifier les animations minimales

**Animations à tester**:
- ✅ Slide-in du consent (300ms)
- ✅ Fade-in des notifications
- ✅ Ouverture overlay (300ms cubic-bezier)
- ✅ Hover des boutons (200ms)

**Principe**: Animations fluides mais discrètes

## 🔒 Tests de Sécurité

### Test 15: Permissions

**Objectif**: Vérifier les permissions minimales

**Vérifications**:
1. Inspecter manifest.json
2. Lister les permissions

**Permissions autorisées**:
- ✅ storage
- ✅ activeTab
- ✅ alarms
- ✅ notifications

**Permissions interdites**:
- ❌ tabs
- ❌ history
- ❌ cookies
- ❌ webRequest
- ❌ <all_urls>

### Test 16: Pas de Tracking

**Objectif**: Vérifier l'absence de tracking

**Étapes**:
1. Ouvrir Network tab des DevTools
2. Utiliser l'extension normalement
3. Analyser les requêtes

**Résultat attendu**:
- ✅ Uniquement requêtes vers API officielle
- ✅ Pas de Google Analytics
- ✅ Pas de trackers tiers
- ✅ Pas de fingerprinting

### Test 17: Stockage Local Uniquement

**Objectif**: Vérifier que les données restent locales

**Étapes**:
1. Ajouter des produits à la liste
2. Suivre des prix
3. Inspecter Chrome Storage
4. Bloquer internet
5. Vérifier que les données sont accessibles

**Résultat attendu**:
- ✅ Toutes les données dans Chrome Storage
- ✅ Accessible hors ligne
- ✅ Pas de transmission automatique
- ✅ Synchronisation uniquement si opt-in

## ⚡ Tests de Performance

### Test 18: Temps de Chargement

**Objectif**: Vérifier la performance de l'extension

**Métriques**:
- Service worker init: < 100ms
- Content script injection: < 50ms
- Overlay affichage: < 200ms
- API call: < 2s (avec timeout 10s)

### Test 19: Consommation Mémoire

**Objectif**: Vérifier l'empreinte mémoire

**Étapes**:
1. Ouvrir Chrome Task Manager
2. Identifier l'extension
3. Mesurer la mémoire

**Résultat attendu**:
- ✅ < 50MB au repos
- ✅ < 100MB en utilisation active
- ✅ Pas de fuite mémoire

### Test 20: Impact sur Navigation

**Objectif**: Vérifier que l'extension n'impacte pas la navigation

**Étapes**:
1. Désactiver l'extension
2. Naviguer sur 10 sites
3. Noter la fluidité
4. Activer l'extension
5. Naviguer sur les mêmes sites

**Résultat attendu**:
- ✅ Aucune différence perceptible
- ✅ Pas de ralentissement
- ✅ Pas de freeze

## 🌐 Tests de Compatibilité

### Test 21: Chrome

**Versions à tester**:
- Chrome 88+ (Manifest V3 minimum)
- Chrome Canary (dernière version)

**Résultat**: ✅ Fonctionne correctement

### Test 22: Edge

**Versions à tester**:
- Edge 88+ (basé sur Chromium)

**Résultat**: ✅ Fonctionne correctement

### Test 23: Firefox

**Notes**: Manifest V3 support en cours sur Firefox

**À adapter**:
- browser.* APIs au lieu de chrome.*
- Manifest V2 pour compatibilité actuelle

**Résultat**: ⏳ À tester après adaptation

## 📋 Checklist Complète

Avant de publier:

### Fonctionnel
- [ ] Tous les tests 1-10 passent
- [ ] Pas d'erreur console
- [ ] Pas de crash

### UI/UX
- [ ] Tous les tests 11-14 passent
- [ ] Design cohérent
- [ ] Accessible (WCAG AA)

### Sécurité
- [ ] Tous les tests 15-17 passent
- [ ] Permissions minimales
- [ ] Pas de tracking
- [ ] Code source auditablePerformance
- [ ] Tous les tests 18-20 passent
- [ ] Temps de réponse < 2s
- [ ] Mémoire < 100MB

### Compatibilité
- [ ] Tests 21-23 passent
- [ ] Chrome: ✅
- [ ] Edge: ✅
- [ ] Firefox: ⏳

## 🐛 Rapport de Bug

Template pour signaler un bug:

```markdown
**Description**
[Description claire du bug]

**Étapes de Reproduction**
1. Aller sur...
2. Cliquer sur...
3. Observer...

**Résultat Attendu**
[Ce qui devrait se passer]

**Résultat Actuel**
[Ce qui se passe réellement]

**Environnement**
- Navigateur: Chrome 120
- OS: Windows 11
- Extension version: 1.0.0

**Screenshots**
[Joindre si possible]

**Console Logs**
```
[Coller les logs]
```
```

---

**Dernière mise à jour**: Décembre 2025  
**Version du guide**: 1.0.0
