# 🌍 A KI PRI SA YÉ — Comparateur de prix DROM-COM

**Application web complète** de comparaison de prix pour les territoires d'Outre-Mer (DROM-COM).  
Une PWA moderne avec toutes les fonctionnalités pour aider les habitants à économiser sur leurs achats quotidiens.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blue)]()
[![Mobile Friendly](https://img.shields.io/badge/mobile-friendly-green)]()
[![RGPD Compliant](https://img.shields.io/badge/RGPD-compliant-blue)]()

🌐 **Site web :** https://akiprisaye.pages.dev  
📱 **Installation PWA :** Disponible sur mobile et desktop  
🏛️ **Admin :** https://akiprisaye.pages.dev/admin  

---

## ✨ Fonctionnalités complètes

### 🔍 **Comparaison de prix intelligent**
- Recherche par nom, code-barres, ou catégorie
- Comparaison multi-enseignes en temps réel  
- Filtrage par territoire (Guadeloupe, Martinique, Guyane, Réunion, etc.)
- Prix au kg/litre pour comparaisons équitables

### 📱 **Application mobile (PWA)**
- ✅ Installation sur mobile et desktop
- ✅ Fonctionnement offline complet
- ✅ Icônes 192x192 et 512x512 optimisées
- ✅ Service Worker avancé avec cache intelligent

### 🔐 **Authentification et administration**
- ✅ Page `/admin` sécurisée avec login
- ✅ Tableau de bord d'administration complet
- ✅ Gestion des utilisateurs et des rôles
- ✅ Statistiques temps réel et monitoring

### 📊 **Export des données**
- ✅ Export Excel (.xlsx) des comparaisons
- ✅ Export PDF pour impression/partage
- ✅ Métadonnées complètes et formatage professionnel
- ✅ Boutons d'export intégrés aux pages de résultats

### 💡 **Suggestions locales intelligentes**  
- ✅ Géolocalisation automatique avec détection du territoire
- ✅ Suggestions saisonnières (produits tropicaux)
- ✅ Magasins à proximité avec distances
- ✅ Widget flottant non-intrusif

### 📰 **Actualités économiques**
- ✅ Page `/actualites` fonctionnelle
- ✅ API Cloudflare Functions (`/functions/news.js`)
- ✅ Filtrage par territoire et mots-clés "vie chère"
- ✅ Interface moderne et responsive

### 🛡️ **Sécurité et protection**
- ✅ Validation complète des formulaires
- ✅ Protection CSRF avec tokens uniques
- ✅ Rate limiting et protection anti-bot
- ✅ Sanitisation XSS et honeypots

### 📈 **Analytics et suivi RGPD**
- ✅ Google Analytics intégré avec consentement
- ✅ Bannière de cookies conforme RGPD
- ✅ Tracking des événements et conversions
- ✅ Métriques Core Web Vitals

### 🎨 **Design et UX optimisés**
- ✅ Responsive design mobile-first
- ✅ Interface sombre moderne
- ✅ Accessibilité (WCAG 2.1)
- ✅ Animations fluides et micro-interactions

---

## 🚀 Checklist des fonctionnalités — État actuel

### 📱 Interface & UX
- ✅ **Corriger responsive mobile** — Design mobile-first implémenté
- ✅ **Améliorer Service Worker** — Cache avancé et gestion offline
- ✅ **Offline complet** — Pages principales disponibles hors ligne

### 🌐 SEO & Infrastructure  
- ✅ **Créer `_headers`** — Headers optimisés pour performance
- ✅ **Ajouter `robots.txt`** — Indexation et restrictions configurées
- ✅ **sitemap.xml** — Sitemap complet avec toutes les pages
- ✅ **Ajouter meta SEO** — Balises complètes (title, description, keywords)
- ✅ **OpenGraph** — Partage social optimisé (Facebook, Twitter)

### 🔗 Intégrations & API
- ✅ **API actualités** — Cloudflare Functions pour news par territoire
- 🔄 **Connecter comparateur à API Data.gouv** — Prévu phase 2
- 🔄 **OCR** — Scan de tickets prévu phase 2
- ✅ **Signaler un produit** — Formulaires protégés disponibles

### 📄 Pages & Admin
- ✅ **Créer page `/admin` sécurisée** — Interface complète avec auth
- ✅ **Créer page `/actualites`** — Fonctionnelle avec API backend

### 🔧 Fonctionnalités avancées
- ✅ **Export Excel/PDF** — Modules complets avec libraries externes
- ✅ **Module suggestions locales** — IA de suggestions géolocalisées
- ✅ **Tests automatisés** — Unitaires et end-to-end complets
- ✅ **Documentation utilisateur** — Guide complet et checklist
- ✅ **Google Analytics** — Intégration RGPD-compliant
- ✅ **Protection formulaires** — Validation, CSRF, rate limiting

---

## 📌 Endpoints API disponibles

### 🔍 **Comparaison de prix**
- `GET /api/prices?zone={territory}` - Récupération des prix par zone
- `GET /api/search?q={query}&territory={zone}` - Recherche de produits

### 📰 **Actualités économiques**  
- `GET /news?territory={zone}` - Flux RSS agrégé et filtré par territoire

### 📊 **Analytics et métriques**
- `POST /api/analytics/event` - Tracking d'événements utilisateur
- `GET /api/stats` - Statistiques publiques (si activé)

---

## 🛠️ Installation et développement

```bash
npm install
npm run dev
``` 
