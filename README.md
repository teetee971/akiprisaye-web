# 🧾 A KI PRI SA YÉ

[![Version](https://img.shields.io/badge/version-3.1.6-blue)](#-état-du-projet)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-deployed-success?logo=cloudflare&logoColor=white)](https://akiprisaye-web.pages.dev)
[![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/teetee971/akiprisaye-web/ci-cd-industrial.yml?branch=main&label=CI%2FCD&logo=github-actions)](https://github.com/teetee971/akiprisaye-web/actions/workflows/ci-cd-industrial.yml)
[![CI Schema Validation](https://img.shields.io/badge/CI-JSON%20Schema%20Validation-blue)](#)
[![Browser Only](https://img.shields.io/badge/Runtime-Browser--Only-important)](#)
[![OCR Local](https://img.shields.io/badge/OCR-100%25%20Local-green)](#)
[![PageSpeed Desktop](https://img.shields.io/badge/PageSpeed%20Desktop-99%2F100-success?logo=lighthouse)](https://pagespeed.web.dev/analysis/https-akiprisaye-web-vercel-app/1bs32pqrrx?form_factor=desktop)
[![PageSpeed Mobile](https://img.shields.io/badge/PageSpeed%20Mobile-74%2F100-yellow?logo=lighthouse)](https://pagespeed.web.dev/analysis/https-akiprisaye-web-vercel-app/1bs32pqrrx?form_factor=mobile)
[![Performance](https://img.shields.io/badge/Performance-Top%201%25-brightgreen)](#-performance--web-vitals)

**Application citoyenne de transparence des prix et des coûts réels dans les territoires ultramarins**

## 🌍 Présentation

**A KI PRI SA YÉ** est une application d'information citoyenne dédiée à la compréhension des prix dans les territoires ultramarins.

Elle permet d'analyser les écarts de prix entre les territoires, de comprendre le rôle du transport, de la logistique, des taxes et des intermédiaires.

L'application ne vend aucun produit et ne réalise aucune transaction commerciale. Elle a pour objectif de rendre les mécanismes de formation des prix plus lisibles pour tous.

**Territoires couverts :**

**DROM (Départements et Régions d'Outre-Mer) :**
- 🇬🇵 Guadeloupe (971) · 🇲🇶 Martinique (972) · 🇬🇫 Guyane (973) · 🇷🇪 La Réunion (974) · 🇾🇹 Mayotte (976)

**COM (Collectivités d'Outre-Mer) :**
- 🇵🇫 Polynésie française · 🇳🇨 Nouvelle-Calédonie · 🇼🇫 Wallis-et-Futuna
- 🇲🇫 Saint-Martin · 🇧🇱 Saint-Barthélemy · 🇵🇲 Saint-Pierre-et-Miquelon

**Référence :**
- 🇫🇷 France métropolitaine (base de comparaison)

**🎯 Phrase d'accroche : Comprendre pourquoi tout coûte plus cher.**

---

## ⚡ Performance & Web Vitals

**World-class performance optimization** - **Top 1%** of websites globally! 🏆

### 📊 PageSpeed Insights Scores

| Platform | Performance | Accessibility | Best Practices | SEO | Link |
|----------|-------------|---------------|----------------|-----|------|
| 🖥️ **Desktop** | **99/100** ⭐⭐⭐ | 94/100 | 96/100 | 100/100 | [View Report](https://pagespeed.web.dev/analysis/https-akiprisaye-web-vercel-app/1bs32pqrrx?form_factor=desktop) |
| 📱 **Mobile** | 74/100 | 98/100 | 96/100 | 100/100 | [View Report](https://pagespeed.web.dev/analysis/https-akiprisaye-web-vercel-app/1bs32pqrrx?form_factor=mobile) |

### 🎯 Core Web Vitals (Desktop)

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| **FCP** (First Contentful Paint) | 0.7s | < 1.8s | ✅ **3x better** |
| **LCP** (Largest Contentful Paint) | 0.8s | < 2.5s | ✅ **3x better** |
| **TBT** (Total Blocking Time) | 0ms | < 300ms | ✅ **Perfect** |
| **CLS** (Cumulative Layout Shift) | 0 | < 0.1 | ✅ **Perfect** |
| **Speed Index** | 1.0s | < 4.0s | ✅ **Excellent** |

### 🚀 Performance Optimizations

- ⚡ **Preload hints** for critical resources (modulepreload, preconnect, dns-prefetch)
- 🎯 **Code splitting** by route for faster initial load
- 🖼️ **Optimized images** (WebP/AVIF with fallbacks)
- 📦 **Lazy loading** for non-critical components
- 🔄 **Service Worker** with smart caching strategies
- 🌐 **CDN delivery** via Cloudflare Pages

### 📖 Documentation

- 📘 **[Mission H: Preload Hints Implementation](docs/performance/MISSION_H_PRELOAD_HINTS.md)** - Detailed performance optimization documentation
- 🧪 **[How to Test Performance](docs/performance/MISSION_H_PRELOAD_HINTS.md#-testing--validation)** - Local testing with Lighthouse & PageSpeed Insights

**Last Performance Audit:** March 7, 2026

---

## 🧭 Navigation Optimisée - 7 Hubs Principaux

**Nouvelle architecture !** La navigation a été simplifiée et organisée en 7 hubs principaux pour une expérience utilisateur fluide et intuitive.

### 🏠 Accueil
Point d'entrée principal avec vue d'ensemble et accès rapide à toutes les fonctionnalités.

### 📊 Comparateurs
Hub unifié regroupant tous les outils de comparaison :

**Comparateurs généraux :**
- Comparateur prix classique
- Comparateur citoyen (données participatives)
- Comparaison enseignes
- Comparaison panier
- Comparateur territoires DOM–COM
- Bilan des territoires (vue d'ensemble écarts DOM vs Hexagone)
- Inflation par catégorie
- Tableau de bord inflation multi-territoires
- Couverture des données par territoire
- Alertes prix
- Historique des prix

**Comparateurs spécialisés :**
- Vols DOM–Métropole et inter-îles
- Bateaux / Ferries inter-îles Antilles
- Fret / Colis (Colissimo, DHL, GLS, UPS vers les DOM)
- Carburants (SP95, Diesel, GPL par territoire)
- Assurances (auto, habitation, santé en DOM)
- Formations professionnelles
- Location voiture
- Matériaux BTP (ciment, acier, bois, tôles…)
- Télécoms / Services (internet, mobile, eau, électricité)
- Évaluation cosmétiques DOM

**Recherche prix :**
- Tarifs avions, bateaux, fret maritime et aérien
- Tarifs électricité, eau, abonnements internet et mobile
- Délais logistiques et tensions d'approvisionnement DOM
- Indice synthétique du coût logistique par territoire
- Comprendre les causes des délais produits

**Ressources & Documentation :**
- Comprendre la formation des prix en DOM–COM
- Questions fréquentes sur la logistique outre-mer
- Glossaire logistique (fret, octroi de mer, COTRAM…)
- Décoder les promotions et prix barrés
- Pourquoi les prix varient sans évolution du produit

**Route:** `/comparateurs`

### 🗺️ Carte & Itinéraires
Fonctionnalités cartographiques et optimisation de trajets :
- Carte interactive des magasins
- Optimiseur d'itinéraire multi-destinations
- Planification liste de courses intelligente
- Recherche magasins à proximité

**Route:** `/carte`

### 📷 Scanner
Hub unifié pour tous les modes de scan :
- Scanner code-barres (EAN-13, EAN-8, UPC)
- Scanner texte & tickets (OCR local)
- Scanner produit complet
- Analyse photo produit

**Route:** `/scanner`

### 🤖 Assistant IA
Intelligence artificielle locale et respectueuse de la vie privée :
- Conseiller budget IA
- Chat IA local (100% privé)
- Analyses de marché
- Assistant courses intelligent

**Route:** `/assistant-ia`

### 📈 Observatoire
Données agrégées et analyses de marché issues de **32 snapshots mensuels réels** (nov. 2025 → mars 2026, 11 territoires actifs) :
- Dashboard prix en temps réel
- Observatoire vivant (séries temporelles par produit et territoire)
- **Indice Panier Vital** : minutes de SMIC net pour acheter 6 produits essentiels par territoire
- Prédictions de prix basées sur l'historique réel (`observatoirePriceSeries`)
- **Comparaison internationale** : indices Eurostat 2024 / OECD PPP 2024 / INSEE DOM 2023
- Méthodologie publique
- Données ouvertes (CSV / JSON avec signature SHA-256)

**Route:** `/observatoire`

### 🤝 Solidarité
Actions solidaires et anti-gaspillage :
- Ti-Panié Solidaire (paniers anti-gaspi)
- Modules citoyens
- Contribution aux prix
- Initiatives locales

**Route:** `/solidarite`

### 🏆 Gamification
Engagement et fidélisation des contributeurs :
- Système de points pour chaque contribution de prix
- Badges débloquables (contributeur, expert, ambassadeur)
- Classement des contributeurs par territoire
- Historique des actions et récompenses

**Route:** `/gamification`

### 💡 Bénéfices de la Nouvelle Navigation
- **-70% d'entrées menu** : Passage de 15+ à 7 entrées principales
- **3x plus rapide** : Moins de clics pour atteindre la fonctionnalité souhaitée
- **Mobile-first** : Optimisé pour la navigation tactile
- **Backward compatible** : Les anciennes routes restent accessibles

---

## 🔎 OCR & Scan - Hub Unifié

**Nouveau !** Module OCR centralisé et institutionnel pour l'extraction locale de texte depuis images.

### Fonctionnalités OCR

#### 📸 Scan Unifié
- **Scanner texte & tickets** - Extraction de texte brut depuis images, documents
- **Scanner code-barres** - Lecture EAN-13, EAN-8, UPC pour identification produits
- **Scanner produit complet** - Analyse complète (code-barres, ingrédients, prix)
- **Analyse photo produit** - Identification produit par photo avec extraction d'informations

#### 🎯 Principes OCR Non Négociables
- ✅ **100% Local** - Traitement WASM (Tesseract.js) dans le navigateur
- ✅ **Lazy Loading** - Module OCR (~17 MB) chargé uniquement à la première utilisation
- ✅ **Aucune interprétation** - Extraction brute uniquement, zéro analyse santé
- ✅ **Aucune recommandation** - Pas de notation produit, pas de conseil
- ✅ **Validation utilisateur** - Toute détection nécessite confirmation humaine
- ✅ **RGPD Compliant** - Aucune biométrie, aucune transmission serveur
- ✅ **Transparent** - Méthodologie publique et auditable

#### ⚡ Optimisation Performance
- **Bundle initial réduit** : Les fichiers OCR (17 MB) ne sont plus dans le bundle principal
- **Chargement à la demande** : Téléchargement automatique lors de la première utilisation du scanner
- **Mise en cache** : Une fois chargé, le module OCR reste disponible pour les utilisations suivantes
- **Pas d'impact** : Les utilisateurs qui n'utilisent pas le scanner ne téléchargent jamais les fichiers OCR

#### 📊 Qualité OCR (Informatif)
- Score de lisibilité technique (0-100)
- Badges neutres : ✅ Lisible | ⚠️ Partiel | ❌ Insuffisant
- Facteurs : Netteté image, Contraste, Cohérence linguistique
- **Legal disclaimer** : "Ce score indique uniquement la lisibilité technique de l'image"

#### 📜 Historique OCR (Opt-in)
- Stockage local uniquement (localStorage)
- Consentement explicite requis
- Suppression totale à tout moment
- Export JSON pour portabilité
- Statistiques agrégées (total scans, confiance moyenne)
- **Max 50 entrées** pour éviter saturation localStorage

#### 🔐 Intégrité Cryptographique
- Hash SHA-256 du texte extrait
- Timestamp et métadonnées
- Vérification publique possible
- Auditabilité institutionnelle

#### 🔬 Mode Analyse Avancée (Futur)
- Désactivé par défaut
- Pour journalistes, chercheurs, agents publics
- Métriques techniques : confiance par bloc, langue détectée, caractères ambigus
- Aucun impact fonctionnel

### Accès OCR Hub
👉 **[/ocr](/ocr)** - Point d'entrée unique pour toutes les fonctionnalités OCR

---

## 🎯 Objectifs principaux

1. **Expliquer les écarts de prix** entre les territoires ultramarins et la métropole
2. **Rendre visible le rôle** du transport, de la logistique, des taxes et des intermédiaires
3. **Donner aux citoyens** un outil d'information pour comprendre les prix
4. **Créer une référence** sur la transparence des prix dans les DOM

---

## 🧠 Fonctionnalités clés (actuelles & prévues)

### 🧾 Produits & Prix

- Comparateur de prix multi-enseignes
- Historique des prix par produit et par territoire
- Sources visibles (enseignes, dates, zones)
- Prédiction des prix explicable (basée sur données historiques réelles)
- **🛒 Panier Anti-Crise** — Identification des produits structurellement les moins chers sur la durée
  - Analyse de stabilité des prix (exclusion des promotions ponctuelles)
  - Calculs transparents et auditables
  - Analyse indépendante par territoire (971, 972, 973, 974)
  - [Méthodologie complète](backend/docs/ANTICRISIS_METHODOLOGY.md)

### 📷 Scanner intelligent

- **Scan code-barres** (EAN-8, EAN-13, UPC)
  - Scanner caméra en temps réel
  - **Import image avec OCR fallback** (Tesseract.js)
  - Détection automatique native (BarcodeDetector API) + fallback OCR
  - Saisie manuelle avec validation checksum
- **OCR tickets de caisse**
- **Reconnaissance produit par photo**
- **Informations produit** :
  - Fabricant
  - Origine
  - Composition
  - Nutri-Score
  - Traçabilité complète

#### 🔍 Reconnaissance produit sans EAN (PR D)

Fonctionnalité expérimentale, 100 % navigateur, avec validation utilisateur obligatoire.

**Architecture :**

```
Image / Upload
   ↓
OCR (Tesseract.js – offline)
   ↓
Normalisation texte
   ↓
Extraction heuristique (nom, marque, volume)
   ↓
Recherche floue locale (Fuse.js)
   ↓
🛑 Validation utilisateur obligatoire
   ↓
Comparateur de prix existant
```

**Principes :**
- ❌ Aucune comparaison automatique
- ❌ Aucune décision machine
- ✅ Validation humaine obligatoire
- ✅ Messages clairs : Suggestion, jamais Détection confirmée

### 🗺️ Carte interactive

- Carte France + DOM / ROM / COM complète
- Géolocalisation utilisateur
- Affichage des magasins par zone
- Calcul distance / prix / meilleur choix

### 🚨 Alertes consommateurs

- Alertes officielles (DGCCRF, RappelConso)
- Fiches détaillées par produit
- Historique des alertes
- Rapports citoyens

### 💬 Communication

- **Messagerie interne sécurisée** (Firebase Firestore, synchronisation en temps réel)
  - Messages entre citoyens, enseignes et institutions
  - Notifications de nouveaux messages (badge non-lus)
  - Accessible depuis Mon Compte et le Footer
  - **Route :** `/messagerie`
- Citoyens ↔ Enseignes ↔ Institutions

---

## 🏪 Modules professionnels (payants – sans freemium)

### 🏬 Enseignes & investisseurs

- Inscription payante des enseignes
- Gestion des magasins et prix en temps réel
- Marketplace professionnelle
- Visibilité territoriale ciblée
- Analytics & reporting

### 🏛️ Institutions & collectivités

- Tableaux de bord économiques
- Exports de données
- Rapports territoriaux
- Accès API contrôlé

### 🤖 Devis IA

- Génération de devis automatisés selon besoins
- Paiement direct intégré
- Offres personnalisées B2B / B2G

---

## 🧱 Architecture technique

### Frontend

- **React + Vite** - Framework moderne et performant
- **Tailwind CSS** - Design system professionnel
- **Design chic "Liquid Glass"** - Interface utilisateur premium
- **PWA** - Offline, mobile-first

### Backend (prévu / en cours)

- API modulaire sécurisée
- Gestion données produits, prix, alertes, entreprises
- Prédiction IA explicable

### Données entreprises

**Accès par :**
- SIRET
- SIREN
- TVA
- ID interne

**Informations disponibles :**
- Statut d'activité (ACTIVE / CEASED)
- Adresse complète
- Coordonnées GPS
- Date de création

---

## ✨ Qualité & Transparence

### Politique Qualité Non Négociable

Ce projet applique **une gouvernance qualité stricte et vérifiable** pour garantir une expérience utilisateur de qualité, même sur réseaux dégradés (DOM/ROM/COM).

#### 🔒 CI Strict — Zéro Warning, Zéro Compromis

Toute Pull Request provoquant :
- ❌ Une régression Lighthouse (performance, accessibilité, SEO)
- ❌ Un warning TypeScript
- ❌ Un warning ESLint
- ❌ Une violation WCAG 2.1 AA
- ❌ Un dépassement de budget performance
- ❌ Une vulnérabilité npm ≥ moderate

**est automatiquement rejetée.**

#### 📊 Lighthouse CI — Seuils Stricts

- **Performance ≥ 85** — Navigation fluide même en 3G/4G instable
- **Accessibilité ≥ 95** — Application utilisable par tous
- **Bonnes pratiques ≥ 95** — Sécurité et compatibilité garanties
- **SEO ≥ 90** — Visibilité et partage optimaux

**Métriques Core Web Vitals (bloquantes) :**
- LCP (Largest Contentful Paint) < 3.5s
- CLS (Cumulative Layout Shift) < 0.1
- FCP (First Contentful Paint) < 2.5s
- TBT (Total Blocking Time) < 300ms
- Speed Index < 4.0s

#### 🎯 Budgets Performance par Module

| Type de ressource | Budget max |
|-------------------|-----------|
| Scripts (JS) | 350 KB |
| Images | 500 KB |
| Stylesheets (CSS) | 50 KB |
| **Total page** | **1.2 MB** |

**Modules concernés :**
- Page d'accueil
- Module Anti-Crise
- Comparateurs (prix, enseignes, territoires)
- Observatoire temps réel
- Carte interactive

⛔ **Tout dépassement = CI FAIL**

#### ♿ Accessibilité WCAG 2.1 AA Automatisée

Tests automatiques via **axe-core** (référence industrie) :
- ✅ Contrastes de couleurs
- ✅ Navigation clavier complète
- ✅ aria-labels et rôles ARIA
- ✅ Ordre des titres (h1, h2, h3...)
- ✅ Labels de formulaires
- ✅ Focus visible
- ✅ Alt text pour images

**Pages testées :**
- Accueil
- Anti-Crise
- Comparateur
- Observatoire

#### 📈 Transparence des Rapports

- 🔗 **Rapports Lighthouse publics** : URL générée à chaque build et postée en commentaire de PR
- 📊 **Métriques suivies** : Core Web Vitals, budgets, accessibilité, SEO
- 🗂️ **Historique conservé** : 30 jours dans GitHub Actions artifacts

**Prochaine étape :** Page publique `/transparence/qualite-technique` avec historique complet.

### Bonnes Pratiques Appliquées

✅ **Performance**
- Lazy-load des cartes (Leaflet)
- Code splitting par route
- Images optimisées WebP/AVIF
- Compression Gzip/Brotli
- Fonts locales uniquement

✅ **Accessibilité**
- Navigation clavier complète
- Contrastes WCAG AA
- ARIA labels cohérents
- Responsive mobile-first

✅ **Sécurité**
- Aucun tracker tiers bloquant
- CSP (Content Security Policy)
- Audit npm automatique
- Dépendances à jour

✅ **Respect utilisateurs**
- Pas de dark patterns
- Données réelles uniquement
- Transparent sur les sources
- Respect RGPD

### Pipeline CI/CD Complet

```
1. Lint strict (ESLint --max-warnings=0)
2. TypeScript strict (--noEmit)
3. Tests fonctionnels (Vitest)
4. Build sans warnings (Vite)
5. Audit sécurité (npm audit)
6. Tests accessibilité (axe-core WCAG)
7. Lighthouse CI (performance + budgets)
8. Déploiement Cloudflare Pages
```

👉 **Aucun bypass possible. Qualité mesurable et auditable.**

### Positionnement Stratégique

❌ **Ce que nous ne sommes PAS :**
- Une app "bons plans" avec prix simulés
- Un site avec dark patterns ou FOMO artificiel
- Une plateforme d'affiliation déguisée

✅ **Ce que nous SOMMES :**
- Données réelles et vérifiables
- Qualité mesurée objectivement
- Respect des utilisateurs DOM/ROM/COM
- Transparence totale (code, méthodes, sources)

**Résultat :** Crédibilité institutionnelle (collectivités, associations, médias, chercheurs).

---

## 🚀 Déploiement & CI/CD

**Hébergement :** Cloudflare Pages  
**CI/CD :** GitHub Actions  

### Build automatique

```bash
npm ci
npm run build
# Déploiement dist/
```

**Node.js 20 LTS**  
Zéro 404, assets cohérents (`/assets`)  
Rollback possible

**URL officielle :**  
👉 [https://akiprisaye-web.pages.dev](https://akiprisaye-web.pages.dev)

### Routing SPA (Cloudflare Pages)

- Cloudflare Pages applique son fallback SPA natif **uniquement s'il n'existe pas de `404.html` top-level** dans le répertoire publié (`frontend/dist`).
- Le build frontend ne doit donc pas générer `dist/404.html` (ne pas copier `index.html` vers `404.html`).
- Le fallback explicite est défini via `frontend/public/_redirects` :

```txt
# SPA fallback
/* /index.html 200
```

Validation rapide en production (ne pas tester `/_redirects`, ce fichier est parsé par Pages et non servi tel quel) :

```bash
bash scripts/validate-deployment.sh
curl -I https://akiprisaye-web.pages.dev/
curl -I https://akiprisaye-web.pages.dev/login
curl -I https://akiprisaye-web.pages.dev/mon-compte
curl -I https://akiprisaye-web.pages.dev/reset-password
curl -I https://akiprisaye-web.pages.dev/inscription
```

Le script `scripts/validate-deployment.sh` vérifie aussi que les assets réellement référencés par le HTML public existent bien sur le site déployé.
Toutes ces routes doivent répondre `HTTP 200` et charger l'application SPA.

---

## 🚀 Démarrage Rapide

### Développement

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur.

### Production

```bash
npm run build
npm run preview
```

### Scripts Disponibles

- `npm run dev` - Serveur de développement Vite
- `npm run build` - Build de production
- `npm run preview` - Aperçu du build
- `npm run check-assets` - Vérification d'intégrité des assets
- `npm run lint` - Linter ESLint
- `npm run format` - Formatter avec Prettier
- `npm run dev` (dans `frontend/`) - Serveur de développement Vite
- `npm run typecheck` - Vérification TypeScript sans compilation
- `npm test` - Tests automatisés

### 🧪 Debug API product-image (développement)

L'endpoint `/api/product-image` supporte deux modes :

- **Mode image (par défaut)** : redirection `302` vers une image OFF, ou vers le placeholder.
- **Mode JSON diagnostic** : activer avec `?format=json` ou `Accept: application/json`.

Exemples :

```bash
GET /api/product-image?barcode=3017620422003
GET /api/product-image?barcode=3017620422003&format=json
```

Headers de diagnostic renvoyés (y compris sur `302`) :

| Header | Valeurs possibles |
|--------|------------------|
| `x-akps-source` | `openfoodfacts` \| `placeholder` |
| `x-akps-reason` | `ok` \| `forbidden` \| `rate_limited` \| `no_image` \| `timeout` \| `bad_response` \| `network_error` \| `unknown` |
| `x-akps-off-status` | code HTTP OFF ou `n/a` |
| `x-akps-selected` | `front` \| `small` \| `thumb` \| `none` |

---

## 🔐 Sécurité & conformité

### Signature Cryptographique des Données

**A KI PRI SA YÉ** applique un système de **signature cryptographique** pour garantir l'intégrité des données publiques :

#### 🎯 Garanties

- ✅ **Intégrité** — Toute modification des données est détectable
- ✅ **Traçabilité** — Horodatage précis de chaque dataset
- ✅ **Auditabilité** — Vérification possible par n'importe qui (journalistes, chercheurs, institutions)
- ✅ **Transparence** — Méthode publique et documentée

#### 📦 Données Signées

Tous les datasets critiques sont signés avec SHA-256 :
- Prix par territoire
- Panier Anti-Crise
- Classements (enseignes, territoires)
- Indices (IEVR, pression prix)

#### 🔍 Vérification Publique

Chaque dataset est accompagné d'un fichier `.proof.json` contenant :
- Hash SHA-256 des données
- Timestamp de création
- Métadonnées (territoire, période, version)

**Vérification en ligne :** `/transparence/verifier-integrite` (à venir)

**Vérification technique :**
```bash
npm run data:verify data/prix-gp.json data/prix-gp.proof.json
```

**Documentation complète :** [DATA_SIGNING.md](docs/DATA_SIGNING.md)

### Autres Mesures de Sécurité

- **CSP maîtrisée** (scripts, workers, blob autorisés si nécessaires)
- **Données sourcées et traçables**
- **Pas de données fictives**
- **Transparence utilisateur**
- **Tests de sécurité automatisés**
- **npm audit en CI** (vulnérabilités ≥ moderate bloquent le déploiement)

---

## 🛡️ CI Camera-safe (Important)

Ce projet est une application **frontend browser-only**.

Certaines fonctionnalités (caméra, upload d'images, BarcodeDetector, OCR via Tesseract)
reposent sur des **API Web natives** (`window`, `navigator.mediaDevices`, `Image`, `Canvas`)
**non disponibles en environnement Node.js**.

### Conséquence en CI
- Les tests frontend sont **désactivés volontairement** en CI Node.
- **Cloudflare Pages** est la **source de vérité** pour le build et la validation runtime.
- Aucun code produit n'est exécuté côté serveur Node.

### Ce qui est validé en production
- Pipeline image séparé (caméra / upload / OCR fallback)
- Détection EAN (BarcodeDetector → ZXing → OCR)
- Déclenchement du comparateur via `handleEAN`
- UX mobile et desktop

ℹ️ Ce choix est **intentionnel**, documenté et conforme aux bonnes pratiques
pour les applications web exploitant des API navigateur.

---

## 💰 Modèle économique (sans freemium)

- Abonnements professionnels
- Paiement à l'usage (API, rapports, prédictions)
- Marketplace enseignes
- Devis IA payants
- Licences collectivités / groupes

---

## 📌 État du projet

| Élément | Statut |
|---------|--------|
| Version | **3.1.1** |
| CI/CD | ✅ Opérationnel |
| Architecture | ✅ Validée |
| Déploiement | ✅ Cloudflare Pages |
| Snapshots Observatoire | ✅ 32 fichiers (nov. 2025 – mars 2026) |
| Messagerie | ✅ Opérationnelle |
| Gamification | ✅ Opérationnelle |
| Modules en cours | 🔄 Issues GitHub actives |
| Développement | 🤖 Piloté par prompts Copilot |

---

## 🛠️ Contribution & développement

Développement guidé par :

- Issues structurées
- Prompts Copilot détaillés
- Pipeline automatisé

👉 Voir les [Issues](https://github.com/teetee971/akiprisaye-web/issues) pour la roadmap complète.

---

## 📄 Licence

**Projet propriétaire – tous droits réservés.**  
Utilisation, reproduction ou exploitation commerciale interdites sans autorisation.

---

## 📣 Contact & vision

**A KI PRI SA YÉ** n'est pas un simple comparateur :  
c'est un **outil citoyen, économique et stratégique**, pensé pour **durer et avoir un impact réel**.

---

## ✨ Fonctionnalités Principales

### 🧴 Module d'Évaluation Cosmétique

**Nouveau!** Analyse transparente des produits cosmétiques basée uniquement sur des sources officielles :

- **Sources officielles uniquement** : CosIng (EU), ANSES, ECHA, Règlement CE 1223/2009
- **Analyse INCI** : Identification automatique des ingrédients
- **Score transparent** : Méthodologie de calcul documentée et objective
- **Niveaux de risque documentés** : Basés sur les réglementations européennes
- **Références officielles** : Liens directs vers les sources pour chaque ingrédient
- **Aucune affirmation médicale** : Respect strict des réglementations
- **Aucune donnée fictive** : 100% de données publiques vérifiables

📘 Voir [COSMETIQUE_EVALUATION_MODULE.md](./COSMETIQUE_EVALUATION_MODULE.md) pour la documentation complète.

**Accès** : `/evaluation-cosmetique`

**Tests** : 35 tests unitaires ✅

### 🏢 Registre des Entreprises (Company Registry)

Module centralisé de gestion des données d'entreprises avec qualité institutionnelle :

- **Identification multi-critères** : Recherche par SIRET, SIREN, TVA ou ID interne
- **Données officielles** : Nom légal, statut d'activité, siège social, géolocalisation
- **Validation robuste** : Vérification des codes SIRET/SIREN/TVA français
- **Intégration magasins** : Liaison automatique magasins ↔ entreprises mères
- **Système d'alerte** : Détection des entreprises au statut "CESSÉ" pour protection des consommateurs
- **API complète** : 92 tests automatisés ✅

### 🌍 Sélecteur de Territoires DROM-COM

Nouveau composant `TerritorySelector` avec support complet des 13 territoires :

- 🇬🇵 Guadeloupe
- 🇲🇶 Martinique
- 🇬🇫 Guyane
- 🇷🇪 La Réunion
- 🇾🇹 Mayotte
- 🇵🇲 Saint-Pierre-et-Miquelon
- 🇧🇱 Saint-Barthélemy
- 🇲🇫 Saint-Martin
- 🇼🇫 Wallis-et-Futuna
- 🇵🇫 Polynésie française
- 🇳🇨 Nouvelle-Calédonie
- 🇹🇫 Terres australes et antarctiques françaises (TAAF)
- 🇫🇷 France métropolitaine (référence de comparaison)

### 📱 PWA Améliorée

**Manifest PWA enrichi avec :**
- ✅ Shortcuts pour accès rapide (Comparateur, Scanner, Actualités, Carte)
- ✅ Share Target API
- ✅ Catégories et screenshots
- ✅ Icons 192px et 512px optimisés
- ✅ Mode offline complet

**Service Worker avec :**
- ✅ Cache stratégique (Cache First pour statique, Network First pour API)
- ✅ Synchronisation en arrière-plan
- ✅ Support offline pour pages principales
- ✅ Gestion dynamique du cache

### 🔧 Backend API

Structure backend disponible dans `/backend` :

**Routes API :**

**Prices API**
- `GET /api/prices` - Récupérer les prix par EAN et territoire
- `POST /api/prices` - Ajouter un nouveau prix
- `GET /api/prices/compare` - Comparer plusieurs produits

**News API**
- `GET /api/news` - Récupérer les actualités
- `GET /api/news/:id` - Récupérer une actualité spécifique
- `POST /api/news` - Créer une nouvelle actualité (admin)

**Contact API**
- `POST /api/contact` - Envoyer un message de contact
- `GET /api/contact` - Lister les messages (admin)
- `PATCH /api/contact/:id` - Mettre à jour le statut (admin)

---

## 📸 Pipeline Image avec OCR Fallback

### Architecture

Le scanner intelligent utilise une **architecture en couches** pour maximiser les chances de détection :

1. **Détection Native BarcodeDetector** (si disponible dans le navigateur)
   - API native du navigateur pour détecter les codes-barres
   - Formats supportés : EAN-13, EAN-8, UPC-A, UPC-E
   - Très rapide et précis

2. **Détection ZXing** (fallback si BarcodeDetector indisponible)
   - Bibliothèque JavaScript open-source
   - Même gamme de formats supportés
   - Compatible avec tous les navigateurs

3. **OCR avec Tesseract.js** (fallback final)
   - Reconnaissance optique de caractères
   - Extrait les chiffres de l'image avec whitelist `0123456789`
   - Regex pour identifier les codes EAN : `/\b\d{13}\b|\b\d{8}\b/`
   - **Indispensable** pour les images où le code-barres n'est pas détectable

### Flux de Traitement

```
Image Upload
    ↓
Chargement Image (new Image() + decode())
    ↓
Tentative BarcodeDetector ━━━━━✓━━━→ Code détecté → handleEAN()
    ↓ (échec)
Tentative ZXing ━━━━━━━━━━━━━━✓━━━→ Code détecté → handleEAN()
    ↓ (échec)
OCR Tesseract.js ━━━━━━━━━━━━✓━━━→ Code détecté → handleEAN()
    ↓ (échec)
Message: "❌ Aucun code détecté, saisie manuelle possible"
```

### Messages UX

- ✅ **Succès** : "✅ Code détecté automatiquement à partir de l'image: [EAN]"
- ❌ **Échec** : "❌ Aucun code détecté automatiquement. 👉 Vous pouvez saisir le code manuellement."
- 🔍 **En cours** : "🔍 Analyse de l'image en cours..." → "📝 Détection OCR en cours..."

### Fonction Unifiée `handleEAN()`

Tous les flux (caméra, image, saisie manuelle) convergent vers une **fonction unique** :

```typescript
const handleEAN = async (ean: string) => {
  // 1. Validation EAN (checksum)
  if (!validateEAN(ean)) return
  
  // 2. Résolution produit
  await resolver.resolveEAN(ean)
  
  // 3. Fetch prix (comparateur)
  // 4. Ajout historique
}
```

### Configuration Tesseract.js

```typescript
await Tesseract.recognize(img, 'eng', {
  tessedit_char_whitelist: '0123456789'  // Uniquement les chiffres
})
```

---

## 🎨 Design & UX

### Responsive Design

- ✅ Safe areas pour Samsung S24+, iPhone notch
- ✅ Touch targets minimum 44px (WCAG 2.1 AA)
- ✅ Grilles responsives mobile-first
- ✅ Typographie fluide (clamp)
- ✅ Support prefers-reduced-motion
- ✅ Mode sombre/clair automatique

---

## 🚀 CI/CD Pipeline Industriel

**Pipeline complet avec validation automatique et rollback**

### Architecture du Pipeline

Le pipeline CI/CD garantit des déploiements robustes et sans régression:

1. **1️⃣ Preflight Check** - Vérifications bloquantes (Node.js, secrets, structure)
2. **2️⃣ Install & Build** - Build Vite avec génération de version
3. **3️⃣ Static Integrity Check** - Validation critique des assets
4. **4️⃣ SPA Routing Guard** - Vérification routing React Router
5. **5️⃣ Lighthouse CI** - Tests qualité (performance, accessibilité, SEO)
6. **6️⃣ Cloudflare Deployment** - Déploiement conditionnel (preview/production)
7. **7️⃣ Post-Deploy Validation** - Validation obligatoire du site live
8. **8️⃣ Automatic Rollback** - Restauration automatique si échec
9. **9️⃣ Monitoring & Logs** - Traçabilité complète

### Garanties du Pipeline

- ✅ **Zéro déploiement partiel** - Tout ou rien
- ✅ **Zéro écran blanc** - Validation post-déploiement obligatoire
- ✅ **Zéro régression silencieuse** - Tests automatiques
- ✅ **Zéro erreur 404** - Vérification du routing SPA
- ✅ **Rollback automatique** - Restauration en cas d'échec
- ✅ **Traçabilité complète** - Version visible en footer

### Scripts de Validation

| Script | Objectif | Bloquant |
|--------|----------|----------|
| `preflight-check.sh` | Pré-requis avant build | ✅ Oui |
| `verify-build.sh` | Validation sortie build | ✅ Oui |
| `check-asset-integrity.sh` | Intégrité des assets | ✅ Oui |
| `post-deploy-validation.sh` | Site live fonctionnel | ✅ Oui |
| `rollback-deployment.sh` | Restauration automatique | N/A |

### Documentation

- 📖 [CI/CD Documentation Complète](./CI_CD_DOCUMENTATION.md)
- 🔄 [Procédures de Rollback](./ROLLBACK_PROCEDURES.md)
- 🆘 [Guide de Dépannage](./CI_CD_TROUBLESHOOTING.md)

### Monitoring

- Badge status: [![CI/CD](https://img.shields.io/github/actions/workflow/status/teetee971/akiprisaye-web/ci-cd-industrial.yml?branch=main)](https://github.com/teetee971/akiprisaye-web/actions/workflows/ci-cd-industrial.yml)
- Version live: Visible en footer de l'application
- Logs: [GitHub Actions](https://github.com/teetee971/akiprisaye-web/actions)

---

## 🔒 Règles de Sécurité Firestore

Pour sécuriser votre base de données Firestore, appliquez les règles suivantes via la Console Firebase :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: lecture seule pour tous
    match /products/{ean} {
      allow read: if true;
      allow write: if false; // Seulement via admin/cloud functions
    }
    
    // Stores: lecture seule pour tous
    match /stores/{storeId} {
      allow read: if true;
      allow write: if false; // Seulement via admin/cloud functions
    }
    
    // Prices: lecture seule pour tous
    match /prices/{docId} {
      allow read: if true;
      allow write: if false; // Seulement via cloud functions
    }
    
    // Receipts: utilisateurs authentifiés peuvent créer
    match /receipts/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // Seulement via admin/cloud functions
    }
  }
}
```

**Note importante :** Les règles ci-dessus protègent l'écriture directe dans Firestore. En production, utilisez Firebase Cloud Functions ou Admin SDK pour gérer les écritures de prix et la modération des tickets.

---

## 📚 Documentation Complémentaire

Pour en savoir plus sur l'architecture et les fonctionnalités :

### 🧭 Navigation
- **[NAVIGATION_GUIDE.md](NAVIGATION_GUIDE.md)** - Guide complet de navigation de l'application
  - Architecture des 7 hubs
  - Routes Ti-Panier détaillées
  - Résolution des problèmes de navigation
  - Routes expérimentales (feature flags)

### 🔍 Audits & Rapports
- **[AUDIT_NAVIGATION_RAPPORT.md](AUDIT_NAVIGATION_RAPPORT.md)** - Rapport d'audit de navigation (Janvier 2026)
  - Problèmes identifiés et corrigés
  - Métriques de performance
  - Solutions implémentées
  - Recommandations futures

### 🏗️ Architecture
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture technique de l'application
- **[METHODOLOGIE_OFFICIELLE_v2.0.md](METHODOLOGIE_OFFICIELLE_v2.0.md)** - Méthodologie de collecte de données

### ⚡ Performance
- **[MISSION_H_PRELOAD_HINTS.md](docs/performance/MISSION_H_PRELOAD_HINTS.md)** - Documentation complète sur l'optimisation des preload hints
  - Résultats PageSpeed Insights (Desktop: 99/100)
  - Impact mesuré sur les Core Web Vitals
  - Guide de test performance local
  - Comparaison avant/après optimisation

### 📦 Déploiement
- **[CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)** - Guide de déploiement Cloudflare Pages
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Checklist de déploiement

Pour toute question ou problème, consultez d'abord le [NAVIGATION_GUIDE.md](NAVIGATION_GUIDE.md) ou ouvrez une issue GitHub.


---

## 🆓 Freemium Comparateur (MVP)

### Règles verrouillées
- Territoire par défaut : `fr`
- Guest (non connecté) : `5 recherches / jour` (stockage local)
- Free (connecté) : `20 recherches / jour`
- Pro : quota très élevé + fonctions avancées (export, alertes, insights complets)

### Parcours principal
- `/` → CTA vers `/comparateur`
- `/comparateur` → recherche + résultats + tri + teaser Pro
- `/p/:id` → détail produit (min/médiane/max, source, fiabilité, teaser insights)
- `/historique` → historique des recherches (guest local / user cloud)
- `/auth` → accès login/register/reset
- `/pricing` → upsell Pro

### Checklist manuelle de test
1. **Guest quota** : faire 5 recherches sur `/comparateur`, vérifier la modal paywall sur la 6e.
2. **Historique guest** : ouvrir `/historique`, vérifier que les recherches apparaissent.
3. **Détail produit** : depuis un résultat, ouvrir `/p/:id` et vérifier les cartes min/médiane/max.
4. **Free quota connecté** : se connecter puis effectuer 20 recherches, vérifier blocage à la 21e.
5. **Feature Pro** : cliquer Export / Alertes / Insights complets, vérifier modal “Fonction Pro”.

## Configuration Auth (Firebase + Cloudflare Pages)

### 1) Variables d'environnement (local + Cloudflare Pages)

Créer un fichier `frontend/.env` (ou `.env.local`) en partant de `frontend/.env.example` :

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_ADMIN_EMAILS=
```

Sur Cloudflare Pages, définir les mêmes variables dans **Settings > Environment variables** pour les environnements **Production** et **Preview**.

### 1 bis) Cloudflare Browser Rendering (crawl beta)

Pour activer le proxy `POST/GET /api/browser-rendering/crawl`, créer un **Custom API Token** Cloudflare avec la permission exacte :

- **Compte → Browser Rendering → Modifier / Edit**

Restreindre ensuite le token au **compte Cloudflare** utilisé par le projet. Aucune permission **Zone**, **DNS**, **Workers** ou **Pages** n'est nécessaire pour cet endpoint.

Configurer ensuite ces variables côté Cloudflare Pages :

```bash
CLOUDFLARE_BROWSER_RENDERING_API_TOKEN=<token Cloudflare>
CLOUDFLARE_ACCOUNT_ID=<account id>
BROWSER_RENDERING_SHARED_SECRET=<secret applicatif défini manuellement>
```

> `CLOUDFLARE_BROWSER_RENDERING_API_TOKEN` = jeton API Cloudflare  
> `BROWSER_RENDERING_SHARED_SECRET` = secret interne de l'application, à inventer vous-même (ce n'est pas une permission Cloudflare)

### 2) Firebase Console (Authentication)

Dans Firebase Console > Authentication > Sign-in method :
- Activer **Email/Password**
- Activer **Google**

Dans Firebase Console > Authentication > Settings > Authorized domains :
- Ajouter `localhost` (dev)
- Ajouter votre domaine Pages `*.pages.dev` (ou le domaine exact du projet)
- Ajouter le domaine custom si applicable

### 3) Vérification CSP

Si vous utilisez une CSP stricte, autoriser les endpoints Firebase Auth dans `connect-src` :
- `https://identitytoolkit.googleapis.com`
- `https://securetoken.googleapis.com`
- `https://www.googleapis.com`

Et, si `signInWithPopup` est bloqué selon votre politique, autoriser les domaines Google/Firebase nécessaires pour la popup.

### 4) Routage SPA Cloudflare Pages (important)

Pour éviter les `404` sur les routes React (`/login`, `/mon-compte`, etc.), conserver le fallback SPA dans `frontend/public/_redirects` :

```
/* /index.html 200
```

Et **ne pas** générer un `404.html` top-level dans `frontend/dist/` (pas de copie `index.html -> 404.html` dans le script de build), sinon les deep-links peuvent répondre en HTTP 404.

### 5) Checklist de test manuel Auth

- [ ] Création de compte Email/Mot de passe OK
- [ ] Connexion Email/Mot de passe OK
- [ ] Connexion Google popup OK
- [ ] Déconnexion OK
- [ ] Refresh page conserve la session utilisateur
- [ ] Route protégée (`/mon-compte`) redirige vers `/login` si non connecté
- [ ] En cas d'erreur `auth/unauthorized-domain`, ajouter le domaine courant dans Firebase > Authorized domains
