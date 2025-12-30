# 🤖 Directives Copilot – Construction AUTOMATIQUE du Projet “A KI PRI SA YÉ”

## OBJECTIF GLOBAL
Copilot doit construire **l’intégralité du projet A KI PRI SA YÉ** automatiquement, sans intervention manuelle.

Le projet inclura :
- Backend API sécurisé (AdonisJS)
- Frontend React + Tailwind + shadcn/ui
- Firestore (produits, enseignes, paniers, recettes, actus)
- Scanner code-barres + OCR
- Comparateur de prix (enseignes + territoires OM)
- Carte Outre-mer + géolocalisation magasins
- Palmarès enseignes + classement dynamique
- Module IA “Conseiller”
- Module “Chef Ti-Crise”
- Module “Ti-Panié Solidaire”
- Module “Actualités Vie-Chère” (RSS + filtrage)
- Module Admin sécurisé (/admin)
- PWA
- Cron tâches automatisées
- Résilience / Anti-bugs / Optimisation

Copilot doit écrire tout le code, l’organiser, créer les dossiers, corriger les erreurs, proposer des migrations, refactoriser et relier automatiquement les modules.

---

# 1. 📁 ARCHITECTURE DU PROJET
Copilot doit structurer comme suit :



/backend
/app
/Controllers
/Services
/Models
/Tasks
/config
/start
/env.ts

/frontend
/src
/components
/pages
/context
/hooks
/services
/assets
manifest.json
service-worker.js

/docs
copilot_master_instructions.md
copilot_instructions_news_module.md


---

# 2. 🔧 BACKEND ADONISJS – CODE À GÉNÉRER PAR COPILOT

## 2.1 Services essentiels
Copilot doit générer :

### ✔ FirestoreService
- initialisation Firebase Admin  
- export db

### ✔ RssNewsService
- récupération multi-flux RSS  
- filtrage mots-clé vie-chère  
- normalisation articles

### ✔ ProductService
- recherche produits par code-barres  
- gestion catégories  
- gestion prix territoriaux

### ✔ CompareService
- comparer prix entre enseignes  
- filtrer par territoire

### ✔ TicketOCRService
- extraction texte via OCR  
- parsing produits  
- ajout au comparateur

### ✔ PanierSolidaireService
- création paniers invendus  
- réservation  
- gestion quantités  
- flux Firestore

### ✔ ChefTiCriseService
- génération recettes bas prix  
- analyse panier utilisateur  
- menus économiques  
- IA intégrée

### ✔ AiConseillerService
- réponses IA (économie, bons plans)

---

## 2.2 Tâches Automatisées (Cron)
Copilot doit créer ces tâches :

### ✔ SaveNewsTask
- toutes les 6h  
- fetch RSS  
- filtrage  
- stockage Firestore  
- déduplication ID base64

### ✔ RefreshPricesTask
- toutes les 24h  
- synchronisation prix catalogue  
- nettoyage des anciennes entrées

### ✔ PanierCleanupTask
- suppression paniers expirés / non retirés

---

## 2.3 Routes API
Copilot doit générer les routes :



GET /api/products/:barcode
GET /api/compare/:productId
POST /api/ocr
GET /api/news
GET /api/stores
GET /api/paniers
POST /api/paniers/reserver
GET /api/chef
POST /api/ask


### + Routes Admin


POST /admin/products
POST /admin/stores
POST /admin/promotions
POST /admin/paniers


---

# 3. 🎨 FRONTEND (REACT)

Copilot doit construire :

## 3.1 Pages


/pages/Home.jsx
/pages/Comparateur.jsx
/pages/Scanner.jsx
/pages/Actualites.jsx
/pages/TiPanier.jsx
/pages/ChefTiCrise.jsx
/pages/Carte.jsx
/pages/Palmares.jsx
/pages/Admin.jsx


## 3.2 Composants clés
- ProductCard  
- CompareResult  
- ScannerComponent  
- OcrUpload  
- StoreMap  
- NewsCard  
- PanierCard  
- RecipeCard  
- AiChatBubble  
- TopBanner  
- OutreMerSelector  

## 3.3 Fonctionnalités
Copilot doit implémenter :

### ✔ Scanner code-barres (webcam)
- via `quaggaJS` ou `zxing`

### ✔ OCR ticket
- upload → preview → extraction

### ✔ Carte Outre-mer
- affichage magasins  
- géoloc utilisateur  
- itinéraire

### ✔ Palmarès enseignes
- calcul notes  
- classement dynamique

### ✔ Ti-Panié Solidaire
- liste paniers  
- réservation  
- timer expiration

### ✔ Chef Ti-Crise
- suggestions de recettes  
- scanning des prix bas du moment  
- filtrage par budget

### ✔ Fil d’actualité RSS dynamique
- carrousel accueil  
- page détail

### ✔ IA Conseiller
- mini chatbot : “Quels produits sont moins chers cette semaine ?”

---

# 4. 📱 PWA

Copilot doit :

- écrire manifest.json complet  
- écrire service-worker.js  
- mettre offline fallback  
- precache niveaux essentiels  
- activer installation mobile  
- tester compatibilité Samsung S24+

---

# 5. 🛡 SÉCURITÉ

Copilot doit ajouter :

- rate-limit API  
- validation Zod  
- headers sécurité  
- CORS strict  
- tokens httpOnly  
- permissions admin  
- anti-DDOS basique  
- filtrage entrée backend

---

# 6. 🚀 OPTIMISATION

Copilot doit :

- lazy load toutes les pages  
- code splitting  
- compression WebP  
- memoisation React  
- optimisation bundle  
- opérations Firestore en batch  
- pagination (actu / produits)

---

# 7. 🧪 TESTS

Copilot doit :
- générer test API pour /api/news  
- tests du scanner mock  
- tests comparateur  
- tests IA minimalistes  
- tests du module Ti-Panié

---

# 8. 📌 RÈGLES COPILOT

Copilot doit toujours :
- générer code cohérent avec l’architecture  
- corriger les erreurs automatiquement  
- refactoriser si redondances  
- documenter chaque fonction  
- proposer fichiers manquants  
- proposer améliorations si nécessaire  
- lancer suggestions dans tous les fichiers concernés  
- relier backend ↔ frontend  
- maintenir lisibilité + performance  
- ne jamais briser la structure définie  
- garder style moderne, sombre, épuré

---

## 🔥 RÉSULTAT FINAL ATTENDU

Après lecture de ce fichier dans VS Code, Copilot doit :

### ✔ Générer **tout le projet complet**, automatiquement  
### ✔ Corriger les erreurs en continu  
### ✔ Relier tous les modules ensemble  
### ✔ Rendre l'app **fonctionnelle dès le premier build**  
### ✔ Réduire les interventions manuelles au minimum  
### ✔ Maintenir propreté, performances, sécurité  

Fin du fichier.