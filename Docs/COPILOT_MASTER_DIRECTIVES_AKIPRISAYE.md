# 🤖 Directives Copilot — Master File du projet A KI PRI SA YÉ

## 🎯 Objectif absolu
Copilot doit générer, optimiser et maintenir **automatiquement** TOUT le projet A KI PRI SA YÉ.

Le projet doit inclure :
- Comparateur de prix Outre-mer
- Scanner code-barres / photo + OCR ticket
- Fil d’actualité Vie-Chère (module RSS+IA)
- Module Ti-Panié Solidaire (anti-gaspillage)
- Module Chef Ti-Crise (recettes économiques IA)
- Carte magasins Outre-mer
- Palmarès des enseignes
- Interface Admin complète
- PWA premium (offline + install)
- Sécurité complète backend / frontend
- Firestore + AdonisJS
- Routes API cohérentes
- Cron automatique (RSS, promotions, paniers…)
- UI immersive React + Tailwind + shadcn/ui

Copilot doit produire du **code finalisé, propre, testé, structuré et maintenable**.

---

# 1. 📁 Structure exigée

Copilot DOIT garantir cette structure :



/frontend
/src
/pages
/components
/hooks
/context
/services
/utils
/assets
index.html
manifest.json
sw.js (service worker)

/backend
/app
/Controllers
/Services
/Models
/Tasks
/Middleware
/start
kernel.ts
routes.ts
.env.example
server.ts

/docs
COPILOT_MASTER_DIRECTIVES_AKIPRISAYE.md
audit.md
bug_tracker.md


---

# 2. 🔧 Backend AdonisJS — Directives automatiques

Copilot doit créer les modules backend suivants :

## 2.1 Authentification + Admin
- Auth JWT + Cookies httpOnly
- Rôle “admin” + Rôle “utilisateur”
- Middleware “isAdmin”
- Routes :
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/me`
  - `/api/auth/logout`

## 2.2 Module Produits & Prix
- `/api/produits/search?q=`
- `/api/produits/codebarres/:ean`
- `/api/prix/:produitId/:territoire`
- Normalisation des fiches produits
- Stockage Firestore : `/produits`, `/prix`

## 2.3 Module Promotions
- `/api/promotions`
- Un cron qui récupère les promotions des enseignes (si API disponible ou fichiers)
- Stockage Firestore : `/promotions`

## 2.4 Module Fil d’Actualité Vie-Chère (RSS)
- Service : `RssNewsService.ts`
- Task Cron : `SaveNewsTask.ts` (toutes les 6h)
- Route : `/api/news`

## 2.5 Module Ti-Panié Solidaire
- Collections : `/paniers`, `/reservations`
- Routes :
  - `POST /api/panier/add`
  - `POST /api/panier/reserver/:id`
  - `GET /api/panier/list`
- Règles anti-doublon, stock, géolocalisation

## 2.6 Module Chef Ti-Crise
- Route : `/api/recettes/generer`
- Input :
  - liste des produits dispo
  - budget
  - nombre de personnes
- Output :
  - recette IA complète

## 2.7 Module Scanner Code-barres + OCR
- Endpoint `/api/scanner/codebarres`
- Endpoint `/api/scanner/ticket`

## 2.8 Module Carte Magasins
- Route `/api/enseignes`
- Liste des magasins + coordonnées GPS

## 2.9 Palmarès des Enseignes
- Route `/api/palmares`
- Classement automatique basé sur :
  - prix moyens
  - panier minimal
  - satisfaction utilisateurs

## 2.10 Sécurité obligatoire
- Helmet
- Rate limit
- Validation Zod de toutes les requêtes
- CORS strict
- Pas de clés sensibles exposées
- Logs centralisés

---

# 3. 🗄️ Firestore — Directives pour Copilot

Copilot doit créer les collections suivantes :



/produits
/prix
/promotions
/enseignes
/actus
/paniers
/reservations
/utilisateurs
/logs_admin


Copilot doit générer automatiquement :
- Index Firestore
- Règles de sécurité :
  - Lecture publique pour `/actus`, `/promotions`
  - Lecture protégée pour `/utilisateurs`
  - Écriture admin uniquement pour `/paniers`, `/enseignes`

---

# 4. 🎨 Frontend React — Directives pour Copilot

## 4.1 Pages obligatoires
Copilot doit générer les pages suivantes :

### Pages utilisateur
- `/` (Page d’accueil)
- `/comparateur`
- `/scanner`
- `/actualites`
- `/carte`
- `/paniers`
- `/recettes`
- `/profil`

### Pages Admin
- `/admin`
- `/admin/produits`
- `/admin/enseignes`
- `/admin/paniers`
- `/admin/actus`

## 4.2 Composants obligatoires
Copilot doit créer :

- Navbar responsive
- Footer moderne
- Hero section
- Sections :
  - Comparateur
  - Promotions
  - Cartes Outre-mer
  - Actus Vie-Chère
  - Paniers solidaires
  - Recettes IA

## 4.3 UI / UX
Copilot doit :
- Utiliser Tailwind + shadcn/ui
- Ajouter animations légères
- Lazy load pages lourdes
- Optimiser images en WebP
- Créer skeleton loaders

## 4.4 PWA
Copilot doit configurer :
- manifest.json complet
- service worker :
  - offline page
  - caching intelligent
- install prompt

---

# 5. 🔥 Cron & Automatisation

Copilot doit configurer les tâches :

| Tâche | Fréquence |
|------|-----------|
| Récupération actualités RSS | 6h |
| Récupération promotions | 12h |
| Nettoyage paniers expirés | 24h |
| Génération statistiques prix | 24h |

---

# 6. 🛡️ Sécurité & Performance

Copilot doit :
- Activer CSP
- Désactiver toutes les erreurs détaillées en prod
- Minifier JS/CSS
- Ajouter compression gzip
- Utiliser memo, useCallback, useMemo

---

# 7. 🧪 Tests

Copilot doit créer des tests pour :
- `/api/news`
- `/api/paniers`
- `/api/scanner`
- `/api/auth`

---

# 8. 🎯 Résultat final attendu

Copilot doit livrer un projet :
- 100 % fonctionnel
- 100 % complet
- 100 % cohérent
- Avec backend + frontend + PWA + IA + cron + Firestore + admin
- Prêt à déployer sur Cloudflare Pages + Railway/Firebase

Copilot doit exécuter et proposer automatiquement le code manquant si besoin.

FIN DU FICHIER.