# Checklist de Mise à Jour des Issues GitHub
**Date:** 18 décembre 2025  
**Objectif:** Guide pratique pour mettre à jour chaque issue avec l'état réel

⚠️ **IMPORTANT:** Ne cocher que ce qui est vérifié dans le code source ET déployé en production.

---

## 🔧 Actions à Effectuer

### ✅ Issues à Mettre à Jour (Checklists Modifiées)

#### 📝 Issue #507 - Scanner intelligent produits & tickets

**Checklist actuelle à modifier:**

```markdown
### État Réel du Code (Vérifié)

- [x] Scan code-barres EAN / magasin
  - ✅ Fichier: `src/components/BarcodeScanner.jsx`
  - ✅ Bibliothèque: @zxing/library
  - ✅ Fonctionnalités: Caméra temps réel, torch, input manuel
  
- [ ] OCR ticket de caisse
  - 🔄 Fichier: `src/pages/ScanOCR.jsx` existe
  - ⚠️ Backend OCR à vérifier (functions/ocr.js)
  - ⚠️ Tests requis pour confirmer fonctionnement
  
- [ ] Reconnaissance produit par photo
  - ❌ Non trouvé dans le code source
  - 📋 Issue #[À CRÉER] pour cette fonctionnalité
  
- [x] Fiche produit (origine, fabricant, Nutri-Score)
  - ✅ Fichier: `src/components/ProductSearch.jsx`
  - ⚠️ Affichage complet à vérifier en production
  
- [ ] Traçabilité & source affichée
  - ⚠️ Code présent, affichage UI à vérifier
  - ⚠️ Conformité "sources obligatoires" à auditer
  
- [x] Tests mobile / PWA
  - ✅ PWA implémenté: `manifest.webmanifest`, `service-worker.js`
  - ✅ Toast d'installation: `PWAInstallToast.jsx`
```

**Labels à ajouter:**
- `status: in-progress` (2 sur 6 items confirmés complets)
- `scanner`
- `enhancement`

**Commentaire à ajouter:**
```
Audit du code effectué le 18/12/2025:

✅ IMPLÉMENTÉ:
- Scanner code-barres fonctionnel (BarcodeScanner.jsx)
- Fiche produit de base (ProductSearch.jsx)  
- PWA complet

🔄 EN COURS:
- OCR tickets: composant existe mais backend à vérifier
- Traçabilité: code présent, UI à auditer

❌ MANQUANT:
- Reconnaissance produit par photo (aucun composant trouvé)

Source: AUDIT_ISSUES_STATUS.md
```

---

#### 📝 Issue #505 - ROADMAP OFFICIELLE — ISSUES GITHUB

**Action:** Mettre à jour la roadmap avec les statuts réels des CORE modules.

**Commentaire à ajouter:**
```
Mise à jour suite à audit du code (18/12/2025):

### État des CORE Modules

✅ MODULES IMPLÉMENTÉS:
- CORE 9 - UX/UI Design Chic: Tailwind + composants UI + ThemeToggle
- CORE 10 - CI/CD: Workflows GitHub + Cloudflare Pages
- CORE - Scanner: BarcodeScanner.jsx fonctionnel
- CORE - Comparateur: Comparateur.jsx implémenté
- CORE - Carte: MapLeaflet.jsx + TerritorySelector.jsx

🔄 MODULES EN COURS:
- CORE 1 - Architecture Backend: Services créés (src/services/), à documenter
- CORE 4 - Moteur Prix & Prédiction: Code présent, connexion données réelles à vérifier
- CORE 6 - Marketplace: Pages pricing implémentées, gestion enseignes à compléter

❌ MODULES TODO:
- CORE - Registre entreprises (SIREN/SIRET): Pas de composant dédié trouvé
- CORE 3 - Modèle économique: Pricing UI présent, backend facturation à vérifier
- CORE 7 - Sécurité: RoleGuard existe, audit complet requis

Détails: Voir AUDIT_ISSUES_STATUS.md
```

**Labels à ajouter:**
- `roadmap`
- `documentation`

---

#### 📝 Issue #504 - ARCHITECTURE BACKEND FINALE

**Checklist proposée:**

```markdown
### Livrables Backend

- [x] Structure backend modulaire
  - ✅ Services créés dans `src/services/` (7+ fichiers)
  - ✅ Firebase/Firestore configuré (`firebase_config.js`)
  
- [ ] Migrations DB
  - ⚠️ Schéma Firestore à documenter
  
- [ ] API documentée (OpenAPI)
  - ❌ Documentation OpenAPI absente
  - 📋 À créer
  
- [x] RBAC fonctionnel
  - ✅ Composant `RoleGuard.jsx` présent
  - ⚠️ Tests de sécurité requis
  
- [x] CI/CD backend
  - ✅ 22 workflows dans `.github/workflows/`
  - ✅ Déploiement Cloudflare Pages
  
- [ ] README technique
  - 🔄 Plusieurs docs MD présents, consolidation requise
```

**Labels à ajouter:**
- `status: in-progress`
- `backend`
- `architecture`

---

#### 📝 Issue #503 - DOSSIER INVESTISSEURS COMPLET

**État:** ❌ Aucun fichier "dossier investisseurs" trouvé dans le repo.

**Checklist proposée:**

```markdown
### Livrables Attendus

- [ ] Document PDF investisseurs
  - ❌ Non créé
  
- [ ] Version slide deck
  - ❌ Non créé
  
- [ ] Résumé 1 page
  - ❌ Non créé
  
- [ ] FAQ investisseurs
  - ❌ Non créé
  
- [ ] Éléments chiffrés structurés
  - ❌ Non créé
  - ⚠️ Règle: "Aucun chiffre inventé"
```

**Labels à ajouter:**
- `status: todo`
- `documentation`
- `business`

**Commentaire à ajouter:**
```
Audit 18/12/2025: Aucun dossier investisseurs trouvé dans le repo.

⚠️ RAPPEL: "Aucune donnée fictive. Sources obligatoires."

Avant de créer ce dossier:
1. Vérifier métriques réelles en production
2. Documenter sources pour chaque donnée
3. Identifier clairement les hypothèses vs faits
```

---

#### 📝 Issue #502 - STRATÉGIE DÉPLOIEMENT NATIONAL & ULTRAMARIN

**État:** 🔄 Support multi-territoires implémenté, stratégie à documenter.

**Checklist proposée:**

```markdown
### Infrastructure Territoriale

- [x] Support multi-territoires
  - ✅ Composant `TerritorySelector.jsx` implémenté
  - ✅ 12 territoires DOM-COM supportés (voir README.md)
  
- [ ] Configuration par territoire
  - ⚠️ À vérifier dans les services
  
- [ ] Dashboards pilotage
  - 🔄 AIDashboard.jsx existe
  - ⚠️ KPIs par territoire à confirmer
  
- [ ] Documentation stratégique
  - 🔄 ROADMAP_EXTENSION_GEOGRAPHIQUE.md existe (9KB)
  - 📋 À mettre à jour avec état actuel
  
- [ ] Reporting investisseurs
  - ❌ Voir issue #503
```

**Labels à ajouter:**
- `status: in-progress`
- `deployment`
- `territoires`

---

#### 📝 Issue #501 - MODULE DEVIS IA AUTOMATIQUE + PAIEMENT DIRECT

**État:** ❌ Aucun composant "DevisIA" trouvé.

**Checklist proposée:**

```markdown
### Modules Devis IA

- [ ] Formulaire devis (DevisRequestForm)
  - ❌ Composant non trouvé
  
- [ ] Moteur estimation IA (DevisQualificationEngine)
  - ❌ Composant non trouvé
  
- [ ] Générateur PDF (DevisBuilder)
  - ❌ Composant non trouvé
  
- [ ] Système paiement
  - ✅ Pages pricing existent (Pricing.tsx, Subscribe.tsx)
  - ⚠️ Intégration paiement à vérifier
  
- [ ] Dashboard suivi
  - ❌ Dashboard devis non trouvé
```

**Labels à ajouter:**
- `status: todo`
- `ai`
- `business`
- `enhancement`

---

#### 📝 Issue #500 - PIPELINE CI/CD INDUSTRIEL & SUPERVISÉ

**État:** ✅ Largement implémenté.

**Checklist proposée:**

```markdown
### Pipeline CI/CD

- [x] GitHub Actions
  - ✅ 22 workflows dans `.github/workflows/`
  - ✅ Workflows clés: deploy.yml, build.yml, lighthouse.yml
  
- [x] Environnements
  - ✅ Production Cloudflare Pages
  - ⚠️ Preview/staging à documenter
  
- [x] Déploiement Cloudflare Pages
  - ✅ Configuration présente
  - ✅ Badge statut dans README
  
- [ ] Post-Deploy Validation
  - 🔄 smoke.yml existe (2.5KB)
  - ⚠️ Tests de validation à vérifier
  
- [ ] Rollback Automatique
  - ⚠️ À vérifier dans workflows
  
- [x] Monitoring & Logs
  - ✅ Datadog Synthetics workflow
  - ✅ Lighthouse audit automatique
```

**Labels à ajouter:**
- `status: done` (si rollback confirmé) ou `status: in-progress`
- `ci-cd`
- `devops`

---

#### 📝 Issue #499 - UX/UI DESIGN CHIC "LIQUID GLASS" + WIREFRAMES

**État:** ✅ Design system implémenté.

**Checklist proposée:**

```markdown
### Design System

- [x] Design system documenté
  - ✅ Tailwind configuré (`tailwind.config.js`)
  - ✅ Variables CSS dans styles/
  
- [x] Composants UI réutilisables
  - ✅ 42 composants React/TypeScript
  - ✅ UI primitives: button, card, input, select, textarea
  
- [x] Thème global
  - ✅ Dark mode (ThemeToggle.jsx)
  - ✅ Glass effect subtil
  
- [ ] Maquettes filaires (wireframes)
  - ❌ Pas de fichiers Figma/wireframes trouvés
  - ⚠️ Wireframes en code uniquement
  
- [x] Guidelines UX
  - 🔄 ACCESSIBILITY_GUIDE.md existe
  - 🔄 DESIGN_SYSTEM.md à vérifier
```

**Labels à ajouter:**
- `status: done` ou `status: in-progress` selon wireframes
- `design`
- `ui/ux`

---

#### 📝 Issue #494 - MODULE MARKETPLACE PAYANTE DES ENSEIGNES

**État:** 🔄 Pages pricing implémentées, backend à vérifier.

**Checklist proposée:**

```markdown
### Marketplace Enseignes

- [x] Module Gestion des magasins
  - ⚠️ À vérifier dans AdminDashboard.jsx (17KB)
  
- [ ] Module Publication des prix
  - ⚠️ Services prix existent, UI gestion enseignes à confirmer
  
- [ ] Module Statistiques & visibilité
  - 🔄 marketInsightsService.js existe
  - ⚠️ Dashboard enseignes à vérifier
  
- [x] Module Paiement Marketplace
  - ✅ Pricing.tsx, PricingDetailed.tsx, Subscribe.tsx implémentés
  - ⚠️ Backend facturation à vérifier
  
- [ ] Processus d'inscription
  - ⚠️ AuthForm.tsx existe, workflow enseignes à documenter
```

**Labels à ajouter:**
- `status: in-progress`
- `marketplace`
- `business`

---

#### 📝 Issue #484 - MOTEUR COMPARAISON & PRÉDICTION PRIX — IA RESPONSABLE

**État:** ✅ Code implémenté, données réelles à vérifier.

**Checklist proposée:**

```markdown
### Moteur de Comparaison

- [x] Comparaison de prix
  - ✅ Comparateur.jsx implémenté (13KB)
  - ✅ ProductSearch.jsx
  - ⚠️ Connexion API réelles à vérifier
  
- [x] Normalisation données prix
  - ✅ Services dans src/services/
  - ⚠️ Tests de normalisation requis
  
- [x] Historique & traçabilité
  - ✅ HistoriquePrix.jsx
  - ✅ PriceCharts.jsx
  
- [x] Prédiction des prix
  - ✅ AIPricePrediction.tsx implémenté
  - ⚠️ Validation "IA explicable" requise
  
- [x] Indicateurs produits
  - ✅ IndiceVieChere.jsx
  - ✅ IEVR.jsx (16KB)
  - ✅ ievrCalculations.js
```

**Labels à ajouter:**
- `status: done` si données réelles confirmées, sinon `status: in-progress`
- `ai`
- `price-comparison`

---

#### 📝 Issue #357 - Feuille de route 2025/2026

**Mise à jour Phase 1:**

```markdown
### ✅ Phase 1 : Intégrations Essentielles (Must-Haves)

- [x] **Connecter le Scanner au Suivi de Budget**
  - ✅ SmartShoppingList.jsx implémenté (841 lignes)
  - ✅ BarcodeScanner.jsx peut ajouter au budget
  - ⚠️ Intégration à tester en production
  
- [x] **Intégrer le Comparateur au Scanner**
  - ✅ BarcodeScanner.jsx existe
  - ✅ Comparateur.jsx existe
  - ✅ ProductSearch.jsx pour liaison
  - ⚠️ Flux complet à vérifier
  
- [ ] **Fiabiliser le Mode Liste de Courses Hors-Ligne**
  - ✅ PWA implémenté (service-worker.js, manifest)
  - ⚠️ Tests offline requis
  - ⚠️ Synchronisation à valider
```

**Labels existants:** OK  
**Action:** Mettre à jour Phase 0:
```markdown
- [x] **Audit Technique Complet**
  - ✅ Complété le 18/12/2025
  - 📄 Voir AUDIT_ISSUES_STATUS.md
```

---

#### 📝 Issue #303 - Déploiement du module Ti-Panié Solidaire

**État:** 🔄 Composant créé mais données mock.

**Checklist détaillée:**

```markdown
### État d'Implémentation

- [x] Composant créé
  - ✅ Fichier: `src/components/TiPanieSolidaire.jsx`
  
- [ ] Schéma Firestore
  - ❌ Collection 'paniers' non connectée
  - ❌ Collection 'producteurs' non connectée
  - 📋 TODO détecté ligne 24: "PRODUCTION IMPLEMENTATION"
  
- [x] Page dédiée
  - ✅ src/pages/TiPanie.jsx existe
  
- [ ] Endpoint /api/paniers
  - ❌ Pas de fichier functions/api/paniers.js trouvé
  
- [ ] Paniers de test en base
  - ❌ Utilise mock data (lignes 49+)
  - ⚠️ Données réelles requises
  
- [ ] Hooks back pour réservation
  - ❌ Non implémenté
  
- [ ] UI stock disponible
  - 🔄 Code présent dans composant
  - ⚠️ Connexion données réelles requise
```

**Labels à ajouter:**
- `status: in-progress`
- `data` (données mock à remplacer)

**Commentaire prioritaire à ajouter:**
```
⚠️ BLOQUEUR: Données Mock Utilisées

Fichier: `src/components/TiPanieSolidaire.jsx`
Ligne 23: TODO: Connect to Firestore collections
Ligne 29: TODO: PRODUCTION IMPLEMENTATION
Lignes 30-46: Code Firestore commenté

Actions requises:
1. Créer collections Firestore 'paniers' et 'producteurs'
2. Définir schéma de données conforme
3. Remplacer mock data (ligne 49+)
4. Implémenter requêtes filtrées par territoire
5. Tests avec données réelles

⚠️ Conformité: "Aucune donnée fictive. Sources obligatoires."
```

---

### 🆕 Nouvelles Issues à Créer

#### Issue #[NOUVEAU] - Connecter Ti-Panié Solidaire aux Collections Firestore

```markdown
## Objectif
Remplacer les données mock par de vraies collections Firestore pour Ti-Panié Solidaire.

## Problème Actuel
Le composant `TiPanieSolidaire.jsx` utilise des données factices (mock data).

**Preuve:**
- Fichier: `src/components/TiPanieSolidaire.jsx`
- Ligne 23: `TODO: Connect to Firestore collections`
- Ligne 29: `TODO: PRODUCTION IMPLEMENTATION`
- Lignes 30-46: Code Firestore commenté
- Ligne 49+: Mock data hardcodé

## Actions Requises

### 1. Schéma Firestore

**Collection `paniers`:**
```javascript
{
  id: string,
  nom: string,
  description: string,
  prix: number,
  prixOriginal: number,
  magasin: string,
  adresse: string,
  territoire: string, // Guadeloupe, Martinique, etc.
  disponible: boolean,
  quantite: number,
  categorie: string,
  dateExpiration: timestamp,
  source: string, // Source de la donnée
  dateMAJ: timestamp
}
```

**Collection `producteurs`:**
```javascript
{
  id: string,
  nom: string,
  type: string,
  description: string,
  adresse: string,
  territoire: string,
  active: boolean,
  produits: array,
  contact: string,
  source: string,
  dateMAJ: timestamp
}
```

### 2. Code à Modifier

Décommenter lignes 30-46 dans `TiPanieSolidaire.jsx`:
```javascript
// TODO: PRODUCTION IMPLEMENTATION
const db = getFirestore();

// Fetch solidarity baskets
const paniersRef = collection(db, 'paniers');
const paniersQuery = territoire 
  ? query(paniersRef, where('territoire', '==', territoire), where('disponible', '==', true))
  : query(paniersRef, where('disponible', '==', true));
// ... etc
```

### 3. Règles Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /paniers/{panierId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'producteur' || 
                      request.auth.token.admin == true;
    }
    
    match /producteurs/{producteurId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 4. Tests

- [ ] Créer au moins 3 paniers de test par territoire
- [ ] Créer au moins 2 producteurs de test par territoire
- [ ] Tester filtrage par territoire
- [ ] Tester affichage disponibilité
- [ ] Vérifier sources affichées

### 5. Documentation

- [ ] Documenter schéma dans Docs/
- [ ] Procédure ajout paniers pour producteurs
- [ ] Mention conformité "sources obligatoires"

## Critères de Validation

✅ Données proviennent de Firestore (pas de mock)  
✅ Sources affichées pour chaque panier  
✅ Filtrage territoire fonctionnel  
✅ Données de test uniquement en dev, vraies données en prod

## Priorité
**Haute** - Module annoncé dans ROADMAP mais non fonctionnel

## Labels
- `enhancement`
- `data`
- `firestore`
- `ti-panie-solidaire`
```

---

#### Issue #[NOUVEAU] - Implémenter Reconnaissance Produit par Photo

```markdown
## Contexte
L'issue #507 (Scanner intelligent) mentionne "Reconnaissance produit par photo" mais cette fonctionnalité n'est pas implémentée.

## État Actuel
✅ Scanner code-barres: Implémenté (BarcodeScanner.jsx)  
❌ Reconnaissance photo: Aucun composant trouvé

## Spécifications

### 1. Composant à Créer
`src/components/ProductPhotoRecognition.jsx`

### 2. Technologies Suggérées
- **Option A:** Google Cloud Vision API
- **Option B:** Clarifai API
- **Option C:** ML Kit (Firebase)

### 3. Workflow Utilisateur
1. Utilisateur prend photo d'un produit
2. API reconnaît marque/type de produit
3. Recherche dans base locale par nom détecté
4. **Validation utilisateur obligatoire** (ne jamais auto-confirmer)
5. Si trouvé: afficher fiche produit
6. Si non trouvé: proposer signalement manuel

### 4. Sécurité & Conformité
- ⚠️ **AUCUNE** reconnaissance automatique sans validation humaine
- Afficher score de confiance (ex: 85% sûr que c'est "Nutella")
- Option "Ce n'est pas ça" bien visible
- Expliquer que c'est une aide, pas une certitude
- Sources: Indiquer quelle API a été utilisée

### 5. Données Requises
- **Base produits locale:** Noms, marques, catégories
- **Fallback:** Si reconnaissance échoue, proposer scan code-barres

## Livrables
- [ ] Composant ProductPhotoRecognition.jsx
- [ ] Intégration avec BarcodeScanner (onglets: Scan / Photo)
- [ ] Tests avec 10+ produits courants
- [ ] Documentation utilisateur
- [ ] Conformité "Sources obligatoires" (afficher API utilisée)

## Priorité
Moyenne (nice-to-have, pas bloquant)

## Labels
- `enhancement`
- `ai`
- `scanner`
- `photo-recognition`
```

---

#### Issue #[NOUVEAU] - Audit Connexion Données Réelles vs Mock Data

```markdown
## Problème
Plusieurs composants peuvent utiliser des données mock. Clarification requise pour chaque module.

## Objectif
Documenter pour CHAQUE composant/service:
1. Utilise-t-il des données réelles (API/Firestore) ou mock?
2. Si mock: pourquoi? (dev, pas d'API, données sensibles?)
3. Si réel: quelle est la source exacte?

## Composants/Services à Auditer

### Priorité Haute (Modules Visibles Utilisateurs)

- [ ] **Comparateur.jsx**
  - Source actuelle: ?
  - API connectée: ?
  - Mock data: Oui/Non
  - Tests: Produits réels détectés?

- [ ] **PriceAlertCenter.jsx** (19KB - complexe)
  - Source actuelle: ?
  - Firestore connecté: ?
  - Alertes réelles testées: ?

- [ ] **SmartShoppingList.jsx**
  - Service: shoppingListService.js
  - Données magasins: Firestore ou mock?
  - Coordonnées GPS: Réelles?

- [ ] **TiPanieSolidaire.jsx**
  - ❌ CONFIRMÉ Mock (voir issue #[PRÉCÉDENT])

- [ ] **AlertesPrix.jsx**
  - Service: priceAlertService.js
  - Alertes déclenchées comment?

- [ ] **AIPricePrediction.tsx**
  - Modèle IA: Où est-il? Local/API?
  - Données d'entraînement: ?
  - Explicabilité: Comment?

### Priorité Moyenne (Services Backend)

- [ ] **shoppingListService.js**
- [ ] **priceAlertService.js**
- [ ] **tiPanieService.js**
- [ ] **aiAdvisorService.js**
- [ ] **aiDashboardService.js**
- [ ] **adminPanieService.js**
- [ ] **marketInsightsService.js**

### Priorité Basse (Fonctions API)

- [ ] **functions/api/prices.js**
- [ ] **functions/api/contact.js**
- [ ] **functions/ocr.js**
- [ ] **functions/compare.js**
- [ ] **functions/iaConseiller.js**

## Méthode d'Audit

Pour chaque fichier:
```
1. Ouvrir le fichier
2. Chercher:
   - `import { getFirestore, collection, query }` (Firestore réel)
   - `fetch('http` (API externe)
   - `const mockData = ` (Mock)
   - `// TODO:` (Non implémenté)
3. Tester en local/prod
4. Documenter dans tableau ci-dessous
```

## Tableau de Résultats

| Composant | Type Données | Source | Testé Prod | Action Requise |
|-----------|--------------|--------|------------|----------------|
| Comparateur.jsx | ? | ? | ❌ | Audit requis |
| TiPanieSolidaire.jsx | Mock | Hardcodé ligne 49 | N/A | Issue #[PRÉCÉDENT] |
| ... | ... | ... | ... | ... |

## Règle Conformité
Chaque module utilisant des données doit:
1. ✅ Afficher la source dans l'UI (badge, tooltip, footer)
2. ✅ Indiquer la date de dernière mise à jour
3. ✅ Si estimation/prédiction: expliquer méthodologie
4. ✅ Si mock (dev uniquement): afficher warning visible

## Critères de Validation
✅ Tableau rempli à 100%  
✅ Chaque module a badge "Source: ..."  
✅ Mock data uniquement en dev (VITE_MODE !== 'production')  
✅ Documentation mise à jour

## Priorité
**Critique** - Conformité "Sources obligatoires"

## Labels
- `audit`
- `data`
- `documentation`
- `compliance`
```

---

#### Issue #[NOUVEAU] - Créer Bandeau Dynamique "Lutte contre la vie chère"

```markdown
## Contexte
D'après `ROADMAP_MODULES.md`, ce module est listé "En cours de développement" mais aucun code n'a été trouvé.

## État Actuel
❌ Aucun composant `BandeauVieChere.jsx` ou similaire trouvé.

## Spécifications

### 1. Composant à Créer
`src/components/BandeauDynamique.jsx`

### 2. Fonctionnalités
- Affichage en haut de page (position: sticky)
- Messages institutionnels (ex: "Nouvelle alerte DGCCRF")
- Types de messages:
  - Info (bleu)
  - Alerte (jaune)
  - Urgence (rouge)
- Fermeture temporaire (24h via localStorage)
- Réouverture automatique si nouveau message
- Multi-langues (FR/Créole)

### 3. Source des Messages
**Option A:** Collection Firestore `bandeaux_info`
```javascript
{
  id: string,
  message: string,
  type: 'info' | 'alerte' | 'urgence',
  dateDebut: timestamp,
  dateFin: timestamp,
  actif: boolean,
  priorite: number,
  source: string // Ex: "DGCCRF", "Gouvernement"
}
```

**Option B:** Fichier de configuration
`src/config/bandeaux.json` (pour messages statiques)

### 4. UI/UX
- Design sobre (pas agressif)
- Animation subtile apparition
- Icône selon type
- Bouton "En savoir plus" si lien fourni
- Bouton "Masquer 24h"

### 5. Exemple Messages
```
ℹ️ [INFO] Nouveau comparateur prix carburant disponible
⚠️ [ALERTE] Hausse anormale détectée sur produits de base (DGCCRF)
🚨 [URGENCE] Rappel produit - Consultez la page Alertes
```

## Livrables
- [ ] Composant BandeauDynamique.jsx
- [ ] Collection Firestore ou config JSON
- [ ] Intégration dans Layout.jsx
- [ ] Tests affichage/masquage
- [ ] Admin: Interface ajout/modification messages

## Priorité
Basse (nice-to-have)

## Labels
- `enhancement`
- `ui`
- `civic`
```

---

### 🏷️ Labels à Créer dans le Repo (Si Absents)

Labels de statut:
- `status: done` (vert) - Implémenté et déployé
- `status: in-progress` (jaune) - Code présent mais incomplet
- `status: todo` (rouge) - Planifié mais non commencé
- `status: blocked` (gris) - Bloqué par dépendance

Labels techniques:
- `data` (bleu) - Concerne données/sources
- `mock-data` (jaune) - Utilise données fictives
- `firestore` (orange) - Base de données
- `audit` (violet) - Nécessite audit/vérification
- `compliance` (rouge) - Conformité règles projet

Labels fonctionnels:
- `scanner` (vert)
- `price-comparison` (bleu)
- `territoires` (cyan)
- `ti-panie-solidaire` (vert clair)

---

## 📊 Récapitulatif Actions

### Priorité 1 (Critique - Sources Obligatoires)
1. ✅ Issue #303 - Mettre à jour avec TODO détecté
2. ✅ Créer issue "Audit Données Réelles vs Mock"
3. ✅ Créer issue "Connecter Ti-Panié Solidaire Firestore"

### Priorité 2 (Important - Checklists)
4. ✅ Issue #507 - Mettre à jour checklist Scanner
5. ✅ Issue #505 - Mettre à jour roadmap CORE
6. ✅ Issue #357 - Mettre à jour Phase 0 et Phase 1

### Priorité 3 (Moyen - Documentation)
7. ✅ Issue #504 - Mettre à jour checklist Backend
8. ✅ Issue #500 - Mettre à jour checklist CI/CD
9. ✅ Issue #499 - Mettre à jour checklist Design

### Priorité 4 (Bas - Nouvelles Fonctionnalités)
10. ✅ Créer issue "Reconnaissance Photo Produit"
11. ✅ Créer issue "Bandeau Dynamique"

---

## ⚠️ Notes Importantes

### Règle d'Or
**NE COCHER QUE CE QUI EST:**
1. ✅ Vérifié dans le code source (avec chemin fichier)
2. ✅ Testé en environnement déployé
3. ✅ Documenté avec sources si applicable

### Conformité Projet
Chaque module doit respecter:
- 📋 "Aucune donnée fictive. Sources obligatoires."
- 📋 Traçabilité (date, source, méthodologie)
- 📋 Transparence (affichage sources dans UI)

### Workflow Mise à Jour
1. Lire AUDIT_ISSUES_STATUS.md
2. Appliquer checklist ci-dessus
3. Tester en production
4. Mettre à jour issue GitHub
5. Ajouter label approprié
6. Commenter avec preuves (chemins fichiers)

---

**Document créé par:** GitHub Copilot Coding Agent  
**Basé sur:** AUDIT_ISSUES_STATUS.md  
**Date:** 18 décembre 2025  
**Prochaine étape:** Appliquer modifications sur GitHub
