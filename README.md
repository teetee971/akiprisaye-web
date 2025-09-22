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

Le projet dispose d'un système de check-list de déploiement interactive via les issues GitHub :

- 🎯 **Template d'issue** : Créez facilement une check-list via l'interface GitHub
- 🤖 **Workflow automatisé** : Générez des issues de déploiement via GitHub Actions
- 🛠 **Script local** : Créez des check-lists depuis votre terminal

### Utilisation rapide

```bash
# Via script local (nécessite GitHub CLI)
./scripts/create-deployment-checklist.sh -v v1.0.0 -e production

# Via GitHub Actions (interface web)
# Actions → "Créer une check-list de déploiement" → Run workflow
```

📖 **[Documentation complète](./docs/deployment-checklist.md)**

---

## 🛠️ Installation et développement

```bash
npm install
npm run dev
``` 
