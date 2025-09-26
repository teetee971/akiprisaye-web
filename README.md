# 📱 A KI PRI SA YÉ

![Cloudflare Pages Deployment](https://github.com/teetee971/akiprisaye-web/actions/workflows/deploy.yml/badge.svg)

Comparateur de prix intelligent conçu pour les consommateurs des **DOM-TOM**, afin de lutter contre la vie chère.  
Notre mission : rendre les prix **lisibles, comparables et justes**, en tenant compte des réalités locales (octroi de mer, logistique, saisonnalité).

---

## 🚀 Fonctionnalités principales

- 🔍 **Comparateur de prix DOM ↔ Métropole** avec prise en compte des taxes locales.  
- 🛒 **Catalogues & bons plans** multi-enseignes (supermarchés, magasins discount, etc.).  
- 📊 **Fiches produits enrichies** : Nutri-Score, composition, origine, traçabilité, éco-scores.  
- 🧾 **Analyse automatique de tickets de caisse** (scan ticket CB ↔ ticket magasin).  
- 📲 **PWA installable** (site utilisable comme une application mobile).  
- 📰 **Fil d’actualité DOM-TOM** : consommation, prix, vie chère, initiatives locales.  
- 🎯 **Comparaisons à l’unité** : €/kg, €/L, €/m², €/m³.  
- 🌍 **Multilingue et multi-territoires** (drapeaux DOM intégrés).  

---

# 🌍 A KI PRI SA YÉ — API

API Cloudflare Pages Functions pour la comparaison de prix et la gestion des territoires DOM-TOM.

---

## 📌 Endpoints disponibles

### 1. API de comparaison de prix
- `/api/prices` - Récupération des prix par zone
- `/api/search` - Recherche de produits

---

## 🚀 Checklist des fonctionnalités

### 📱 Interface & UX
- [ ] Corriger responsive mobile
- [ ] Améliorer Service Worker
- [ ] offline complet

### 🌐 SEO & Infrastructure  
- [ ] Créer `_headers`
- [ ] Ajouter `robots.txt`
- [ ] sitemap.xml
- [ ] Ajouter meta SEO
- [ ] OpenGraph

### 🔗 Intégrations & API
- [ ] Connecter comparateur à API Data.gouv
- [ ] OCR
- [ ] Signaler un produit

### 📄 Pages & Admin
- [ ] Créer page `/admin` sécurisée
- [ ] Créer page `/actualites`

---

## 📋 Check-list de déploiement interactive

Une [check-list de déploiement interactive](docs/checklist-interactive.md) est disponible via les templates d'issues GitHub.

**Utilisation :**
1. [Créer une nouvelle issue](https://github.com/teetee971/akiprisaye-web/issues/new/choose)
2. Sélectionner "📋 Check-list de déploiement interactive"
3. Suivre l'avancement en cochant les tâches directement dans l'issue

Cette fonctionnalité permet un suivi collaboratif et traçable du processus de déploiement.

---

## 🛠️ Installation et développement

## ⚙️ Installation locale
1. **Cloner le dépôt**  
	```bash
	git clone https://github.com/teetee971/akiprisaye-web.git
	cd akiprisaye-web
	```

2. **Installer les dépendances**
	```bash
	npm install
	```

3. **Lancer le serveur de développement**
	```bash
	npm run dev
	```

4. **Accéder à l’application**
	Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

5. **Build pour la production**
	```bash
	npm run build
	```
``` 
