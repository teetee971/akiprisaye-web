# Audit Complet des Routes et Navigation - Janvier 2026

## 📊 Résumé Exécutif

**Date:** 14 janvier 2026  
**Type:** Audit chirurgical post-fusion  
**Scope:** Routes React Router, fichiers HTML legacy, navigation

### Statistiques Globales
- **Total routes actives:** 97 routes React Router
- **Routes feature-flagged:** 13 routes conditionnelles
- **Fichiers HTML legacy:** 47+ fichiers
- **Routes orphelines identifiées:** 14 routes sans lien de navigation
- **Duplications intentionnelles:** 8 groupes d'alias (acceptable)

---

## ✅ Routes Fonctionnelles et Bien Intégrées

### Hub Principal (7 routes)
- ✅ `/` - Page d'accueil
- ✅ `/comparateurs` - Hub comparateurs
- ✅ `/scanner` - Hub scanner
- ✅ `/carte` - Carte interactive
- ✅ `/assistant-ia` - Hub assistant IA
- ✅ `/observatoire` - Observatoire
- ✅ `/solidarite` - Hub solidarité

### Routes Scan & OCR (6 routes)
- ✅ `/ocr` - Hub OCR (import direct, pas de lazy loading)
- ✅ `/ocr/history` - Historique OCR
- ✅ `/scan` - Scan OCR
- ✅ `/scan-ean` - Scan EAN
- ✅ `/scanner-produit` - Flux scan unifié
- ✅ `/analyse-photo-produit` - Analyse photo produit

---

## ⚠️ Routes Orphelines (Nécessitent Action)

### Catégorie 1: Routes existantes mais non liées

1. **`/mon-espace`** - Alternative à /mon-compte
   - **Status:** Page existe (MonEspace.tsx)
   - **Problème:** Aucun lien de navigation
   - **Recommandation:** ❌ SUPPRIMER - redondant avec /mon-compte

2. **`/comparateur-citoyen`** - Comparateur basé sur observatoire
   - **Status:** Page existe (ComparateurCitoyen.tsx)
   - **Problème:** Pas dans le hub comparateurs
   - **Recommandation:** ✅ INTÉGRER au hub comparateurs

3. **`/comparateur-territoires`** - Comparaison entre territoires
   - **Status:** Page existe (ComparateurTerritoires.tsx)
   - **Problème:** Pas dans le hub comparateurs
   - **Recommandation:** ✅ INTÉGRER au hub comparateurs

4. **`/evaluation-cosmetique`** - Module évaluation cosmétiques
   - **Status:** Page existe (EvaluationCosmetique.jsx)
   - **Problème:** Pas dans navigation principale
   - **Recommandation:** ✅ INTÉGRER au hub civic-modules

5. **`/signaler-abus`** - Signalement abus
   - **Status:** Page existe (SignalerAbus.tsx)
   - **Problème:** Référencé dans CivicModules mais pas directement accessible
   - **Recommandation:** ✅ GARDER - accessible via CivicModules

### Catégorie 2: Routes déjà liées dans les hubs

6. **`/chat`** - Chat IA Local
   - **Status:** ✅ DÉJÀ INTÉGRÉ dans AssistantIAHub (ligne 41)
   - **Action:** Aucune

7. **`/ia-conseiller`** - Conseiller IA
   - **Status:** ✅ DÉJÀ INTÉGRÉ dans AssistantIAHub (ligne 32)
   - **Action:** Aucune

8. **`/ievr`** - Indice Écart Vie Réelle
   - **Status:** ✅ DÉJÀ INTÉGRÉ dans ComparateursHub (ligne 73)
   - **Action:** Aucune

### Catégorie 3: Routes institutionnelles accessibles indirectement

9. **`/contact-collectivites`** - Contact pour collectivités
   - **Status:** Référencé via page /presse
   - **Recommandation:** ✅ GARDER - accès contextuel approprié

10. **`/licence-institution`** - Licence institutionnelle
    - **Status:** Accessible via /contact-collectivites
    - **Recommandation:** ✅ GARDER - accès contextuel approprié

11. **`/dossier-media`** - Dossier média
    - **Status:** Accessible via /presse
    - **Recommandation:** ✅ GARDER - accès contextuel approprié

### Catégorie 4: Routes de gouvernance (Footer)

12. **`/perimetre`** - Périmètre du projet
    - **Status:** Page existe (Perimetre.tsx)
    - **Problème:** Dans publicNavItems mais pas activement lié
    - **Recommandation:** ✅ VÉRIFIER - devrait être dans footer

13. **`/versions`** - Historique des versions
    - **Status:** Page existe (Versions.tsx)
    - **Problème:** Dans publicNavItems mais pas activement lié
    - **Recommandation:** ✅ VÉRIFIER - devrait être dans footer

---

## 🔄 Alias Routes (Duplications Intentionnelles)

Ces routes pointent vers le même composant - **STATUS: ✅ ACCEPTABLE**

### Groupe 1: Authentification
- `/login` → Login.tsx
- `/connexion` → Login.tsx

### Groupe 2: Services
- `/comparateur-services` → ServiceComparator.tsx
- `/services` → ServiceComparator.tsx

### Groupe 3: Vols
- `/comparateur-vols` → FlightComparator.tsx
- `/vols` → FlightComparator.tsx

### Groupe 4: Bateaux
- `/comparateur-bateaux` → BoatComparator.tsx
- `/bateaux` → BoatComparator.tsx
- `/ferries` → BoatComparator.tsx

### Groupe 5: Carburants
- `/comparateur-carburants` → FuelComparator.tsx
- `/carburants` → FuelComparator.tsx
- `/essence` → FuelComparator.tsx

### Groupe 6: Assurances
- `/comparateur-assurances` → InsuranceComparator.tsx
- `/assurances` → InsuranceComparator.tsx

### Groupe 7: Formations
- `/comparateur-formations` → TrainingComparator.tsx
- `/formations` → TrainingComparator.tsx

### Groupe 8: Tarifs
- `/pricing` → Pricing.tsx
- `/tarifs` → Pricing.tsx

---

## 🚩 Routes Feature-Flagged (13 routes)

Ces routes affichent "Module en préparation" si le flag n'est pas activé:

1. `/recherche-prix/avions` - Nécessite `VITE_FEATURE_FLIGHTS`
2. `/recherche-prix/bateaux` - Nécessite `VITE_FEATURE_BOATS`
3. `/recherche-prix/abonnements/mobile` - Nécessite `VITE_FEATURE_MOBILE_PLANS`
4. `/recherche-prix/abonnements/internet` - Nécessite `VITE_FEATURE_INTERNET_PLANS`
5. `/recherche-prix/energie/electricite` - Nécessite `VITE_FEATURE_ELECTRICITY`
6. `/recherche-prix/energie/eau` - Nécessite `VITE_FEATURE_WATER`
7. `/recherche-prix/fret` - Nécessite `VITE_FEATURE_FREIGHT`
8. `/recherche-prix/fret-aerien` - Nécessite `VITE_FEATURE_FRET_AERIEN`
9. `/recherche-prix/indice-logistique` - Nécessite `VITE_FEATURE_LOGISTICS_INDEX`
10. `/recherche-prix/delais-logistiques` - Nécessite `VITE_FEATURE_LOGISTICS_DELAYS`
11. `/recherche-prix/pourquoi-delais-produit` - Nécessite `VITE_FEATURE_LOGISTICS_EXPLANATION`
12. `/ressources/questions-logistique-dom` - Nécessite `VITE_FEATURE_LOGISTICS_FAQ`
13. `/ressources/pourquoi-prix-varie-sans-changement` - Nécessite `VITE_FEATURE_PRICE_VARIATION_EDU`
14. `/ressources/comprendre-promotions-prix-barres` - Nécessite `VITE_FEATURE_PROMOTIONS_EDU`

**Recommandation:** ✅ GARDER - système de feature flags bien conçu

---

## 📄 Fichiers HTML Legacy

### Fichiers à la racine (47+ fichiers)

#### ✅ Fichiers Nécessaires (GARDER)
1. `index.html` - Point d'entrée Vite (**ESSENTIEL**)
2. `404.html` - Page d'erreur racine
3. `offline.html` - Support PWA hors ligne
4. `manifest.webmanifest` - Manifest PWA

#### ❌ Fichiers Legacy à Supprimer (Redondants avec React)
Ces fichiers sont des anciennes pages HTML qui sont maintenant gérées par React Router:

1. `actualites.html` → Route React: `/actualites`
2. `alerte-cherté.html` → Route React: `/alertes`
3. `budget-planner.html` → Route React: `/budget-vital` ou `/budget-reel-mensuel`
4. `camembert.html` → Ancienne démo, non utilisée
5. `carte.html` → Route React: `/carte`
6. `comparateur.html` → Route React: `/comparateur`
7. `contact.html` → Route React: `/contact`
8. `dashboard.html` → Route React: `/admin/dashboard`
9. `diagnostic.html` → Ancienne page, non utilisée
10. `donnees-publiques.html` → Route React: `/donnees-publiques`
11. `economie-fantome.html` → Ancienne page, non utilisée
12. `equivalent-metropole.html` → Route React: `/ievr`
13. `faq.html` → Route React: `/faq`
14. `historique.html` → Route React: `/historique-prix`
15. `ia-conseiller.html` → Route React: `/ia-conseiller`
16. `ia-suivi.html` → Ancienne page, non utilisée
17. `icons-demo.html` → Démo de développement
18. `mentions.html` → Route React: `/mentions-legales`
19. `modules.html` → Route React: `/civic-modules`
20. `mon-compte.html` → Route React: `/mon-compte`
21. `pack-presse.html` → Route React: `/presse`
22. `palmares.html` → Ancienne page, non utilisée
23. `palmares-detailed.html` → Ancienne page, non utilisée
24. `partenaires.html` → Ancienne page, non utilisée
25. `partage-tiktok.html` → Ancienne page, non utilisée
26. `plan.html` → Ancienne page, non utilisée
27. `prix-kilo.html` → Route React: `/comparateur-formats`
28. `promo-non-appliquee.html` → Route React: `/faux-bons-plans`
29. `rayon-ia.html` → Ancienne page, non utilisée
30. `scan-ocr.html` → Route React: `/scan`
31. `scanner.html` → Route React: `/scanner`
32. `shrinkflation.html` → Route React: `/faux-bons-plans`
33. `test-mobile-ux.html` → Fichier de test, non utilisé en production
34. `upload-ticket.html` → Route React: `/ocr`
35. `variations-prix.html` → Route React: `/historique-prix`

### Fichiers dans /public/

#### ❌ Fichiers Dupliqués à Supprimer
1. `public/404.html` - Contenu minimal, redondant avec `/404.html`
2. `public/index.html` - Redondant avec `/index.html`
3. `public/offline.html` - Redondant avec `/offline.html`

#### ❓ Fichiers Potentiellement Utilisés (VÉRIFIER)
1. `public/anomalies-prix.html` - Peut être utilisé par des redirections
2. `public/comparaison-territoires.html` - Peut être utilisé par des redirections
3. `public/observatoire.html` - Peut être utilisé par des redirections
4. `public/test-observatoire.html` - Fichier de test

#### ❌ Fichiers Stub à Supprimer
Ces fichiers sont des stubs quasi-vides (< 200 bytes):
1. `public/compare.html` (102 bytes)
2. `public/dashboard-admin.html` (96 bytes)
3. `public/equivalence.html` (117 bytes)
4. `public/stats.html` (99 bytes)
5. `public/voix.html` (102 bytes)

### Fichiers dans /frontend/

#### ❌ Duplication Complète à Supprimer
Le répertoire `/frontend/` semble être une duplication:
- `frontend/index.html` - Redondant avec `/index.html`
- `frontend/src` - Lien symbolique vers `/src`
- `frontend/vite.config.ts` - Config alternative

**Recommandation:** ❌ SUPPRIMER tout le répertoire `/frontend/`

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Cleanup Routes Orphelines ⚡ PRIORITÉ HAUTE

1. ✅ **Supprimer route `/mon-espace`**
   - Supprimer la route de main.jsx
   - Supprimer le fichier src/pages/MonEspace.tsx
   - Redondant avec /mon-compte

2. ✅ **Intégrer `/comparateur-citoyen` au hub**
   - Ajouter une carte dans ComparateursHub.tsx

3. ✅ **Intégrer `/comparateur-territoires` au hub**
   - Ajouter une carte dans ComparateursHub.tsx

4. ✅ **Intégrer `/evaluation-cosmetique`**
   - Ajouter au CivicModules ou créer une section appropriée

### Phase 2: Cleanup Fichiers HTML Legacy ⚡ PRIORITÉ HAUTE

1. ✅ **Supprimer 35 fichiers HTML racine redondants**
   - Tous listés dans la section "Fichiers Legacy à Supprimer"

2. ✅ **Supprimer fichiers dupliqués dans /public/**
   - public/404.html
   - public/index.html
   - public/offline.html

3. ✅ **Supprimer fichiers stub dans /public/**
   - 5 fichiers quasi-vides listés ci-dessus

4. ✅ **Supprimer le répertoire /frontend/**
   - Duplication complète inutile

### Phase 3: Vérification Navigation 📊 PRIORITÉ MOYENNE

1. ✅ **Vérifier footer links**
   - Confirmer que /perimetre et /versions sont accessibles

2. ✅ **Tester tous les hubs**
   - Vérifier que toutes les cartes sont cliquables
   - Tester la navigation de bout en bout

3. ✅ **Documenter feature flags**
   - Créer un guide des feature flags disponibles

### Phase 4: Tests et Validation ✅ PRIORITÉ HAUTE

1. ✅ **Build test**
   - `npm run build` doit réussir

2. ✅ **Navigation test**
   - Vérifier tous les liens des hubs
   - Tester les routes alias

3. ✅ **404 handling**
   - Vérifier que les routes supprimées redirigent vers 404

4. ✅ **Mobile test**
   - Vérifier la navigation mobile

---

## 📈 Métriques de Succès

### Avant Audit
- ❌ 14 routes orphelines
- ❌ 47+ fichiers HTML legacy
- ❌ Structure navigation confuse
- ❌ Duplications non documentées

### Après Audit (Objectif)
- ✅ 0 routes orphelines (ou toutes justifiées)
- ✅ ~10 fichiers HTML maximum (essentiels uniquement)
- ✅ Navigation claire et documentée
- ✅ Tous les alias documentés

### KPI
- **Réduction fichiers:** -75% (de ~50 à ~12 fichiers HTML)
- **Routes orphelines:** -100% (de 14 à 0)
- **Navigation clicks:** Max 2-3 clicks pour toute fonctionnalité
- **Build size:** Réduction attendue de ~5-10%

---

## 🔒 Sécurité et Impact

### Risques Identifiés
- ⚠️ **Risque faible:** Suppression de fichiers HTML legacy pourrait casser des bookmarks externes
- ⚠️ **Risque faible:** Suppression de routes pourrait impacter utilisateurs ayant des liens directs
- ✅ **Mitigation:** Garder 404.html pour rediriger proprement

### Impact Utilisateur
- ✅ **Positif:** Navigation plus claire
- ✅ **Positif:** Temps de build réduit
- ✅ **Positif:** Meilleure maintenabilité
- ⚠️ **Neutre:** Bookmarks legacy cassés (acceptable pour évolution)

---

## 📝 Conclusion

Cet audit identifie clairement:
1. **3 routes à intégrer** aux hubs appropriés
2. **1 route à supprimer** (redondante)
3. **~40 fichiers HTML à supprimer** (legacy)
4. **Système d'alias bien conçu** à maintenir
5. **Feature flags bien implémentés** à documenter

**Status Global:** 🟡 Action requise mais architecture saine

**Prochaine étape:** Exécuter Phase 1 et 2 du plan d'action
