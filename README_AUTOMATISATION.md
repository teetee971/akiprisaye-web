# 🤖 SYSTÈME D'AUTOMATISATION - A KI PRI SA YÉ

> Documentation complète des systèmes de mise à jour automatique des données

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Actualités automatiques](#actualités-automatiques)
3. [Mises à jour prix](#mises-à-jour-prix)
4. [Fiches magasins](#fiches-magasins)
5. [Automatisation GitHub Actions](#automatisation-github-actions)
6. [Maintenance](#maintenance)

---

## 🎯 VUE D'ENSEMBLE

### Systèmes implémentés

| Système | Status | Automatisation | Fréquence |
|---------|--------|----------------|-----------|
| Actualités | ✅ Actif | Manuel/Auto | Quotidien |
| Prix produits | ✅ Données statiques | Manuel | Hebdomadaire |
| Fiches magasins | ✅ Base existante | Manuel | Mensuel |
| Prix services | ✅ Données statiques | Manuel | Hebdomadaire |
| Prix transports | ✅ Données statiques | Manuel | Hebdomadaire |

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Sources de données                             │
│  - INSEE                                        │
│  - DGCCRF                                       │
│  - Observatoires prix DOM                       │
│  - Contributions citoyennes                     │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Scripts d'import/MAJ                           │
│  - update-news.js                               │
│  - auto-import-stores.js                        │
│  - sync-france.mjs                              │
│  - comparateur-fetch.js                         │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Stockage                                       │
│  - public/data/*.json (fichiers statiques)     │
│  - Firebase Firestore (données temps réel)     │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Frontend (Affichage)                           │
│  - news-feed.js (actualités)                    │
│  - React components (prix, magasins)           │
└─────────────────────────────────────────────────┘
```

---

## 📰 ACTUALITÉS AUTOMATIQUES

### Fichier de données

**Emplacement:** `public/data/actualites.json`

**Structure:**
```json
{
  "articles": [
    {
      "id": "2026-01-12-unique-id",
      "title": "Titre de l'actualité",
      "icon": "📈",
      "date": "2026-01-12",
      "content": "Description complète...",
      "link": "https://source.com",
      "category": "économie",
      "territory": "all"
    }
  ],
  "lastUpdated": "2026-01-12T13:35:00Z",
  "version": "1.0",
  "sources": ["INSEE", "DGCCRF"]
}
```

### Script de mise à jour

**Fichier:** `scripts/update-news.js`

**Commandes disponibles:**

```bash
# Lister les actualités
node scripts/update-news.js list

# Nettoyer les articles de plus de 90 jours
node scripts/update-news.js clean 90

# Mettre à jour le timestamp
node scripts/update-news.js update-timestamp
```

### Processus manuel

1. **Collecter les sources:**
   - Site INSEE: https://www.insee.fr
   - DGCCRF: https://www.economie.gouv.fr/dgccrf
   - Observatoires des prix locaux
   - Presse locale DOM

2. **Créer une nouvelle actualité:**
   ```javascript
   const newArticle = {
     id: `2026-01-${date}-${slug}`,
     title: "Titre accrocheur",
     icon: "📈", // Emoji pertinent
     date: "2026-01-12",
     content: "Description 2-3 phrases max",
     link: "https://source.com", // ou ""
     category: "économie", // ou logistique, réglementation, etc.
     territory: "all" // ou guadeloupe, martinique, reunion
   };
   ```

3. **Ajouter au fichier:**
   - Ouvrir `public/data/actualites.json`
   - Ajouter l'article au début du tableau `articles`
   - Mettre à jour `lastUpdated`
   - Limiter à 20 articles max

4. **Tester:**
   ```bash
   # Vérifier le format JSON
   node scripts/update-news.js list
   
   # Tester l'affichage
   npm run dev
   # Naviguer vers /actualites
   ```

### Automatisation future

**Option 1: GitHub Actions (Recommandé)**

Créer `.github/workflows/update-news.yml`:

```yaml
name: Update News Feed

on:
  schedule:
    - cron: '0 9 * * *' # Tous les jours à 9h UTC
  workflow_dispatch: # Manuel

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node scripts/update-news.js clean 90
      - run: node scripts/update-news.js update-timestamp
      - name: Commit changes
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add public/data/actualites.json
          git commit -m "chore: update news feed [skip ci]" || true
          git push
```

**Option 2: Cloudflare Workers**

Pour des mises à jour temps réel via API externe.

**Option 3: Firebase Functions**

Pour des triggers automatiques et notifications.

---

## 💰 MISES À JOUR PRIX

### Données existantes

**Fichiers:**
- `public/data/expanded-prices.json` (2.3 MB) - Base complète
- `public/data/services-prices.json` (33 KB) - Services
- `public/data/prices-territories.json` (3.6 KB) - Par territoire

### Structure d'un produit

```json
{
  "ean": "3017620422003",
  "name": "Nutella 400g",
  "category": "Épicerie sucrée",
  "brand": "Ferrero",
  "prices": {
    "guadeloupe": {
      "carrefour": 4.95,
      "super_u": 4.89,
      "ecomax": 5.20
    },
    "metropole": {
      "average": 3.85
    }
  },
  "lastUpdated": "2026-01-12",
  "ecart": "+28.3%"
}
```

### Processus de mise à jour

**Manuel:**

1. Collecter les prix (terrain, relevés magasins)
2. Mettre à jour le fichier JSON
3. Recalculer les écarts métropole/DOM
4. Valider avec `scripts/validate-data.js`

**Scripts existants:**

```bash
# Valider la cohérence des données
node scripts/validate-data.js

# Exporter en Open Data
node scripts/exportOpenData.js
```

### Sources de données prix

- **Contributions citoyennes** (app mobile)
- **Partenariats enseignes** (APIs si disponibles)
- **Relevés terrain** (équipes locales)
- **Open Food Facts** (pour référentiel produits)

### Automatisation recommandée

1. **API des enseignes** (si accès accordé)
2. **Scraping éthique** (avec robots.txt respect)
3. **Crowdsourcing** (via app mobile)
4. **Partenariats institutionnels** (Obs. prix)

---

## 🏪 FICHES MAGASINS

### Base de données

**Fichier:** `public/data/stores-database.json` (19 KB)

**Structure:**

```json
{
  "stores": [
    {
      "id": "gpe-carrefour-destrellan",
      "name": "Carrefour Destrellan",
      "chain": "Carrefour",
      "address": "Centre Commercial Destrellan",
      "city": "Baie-Mahault",
      "territory": "guadeloupe",
      "coordinates": {
        "lat": 16.2667,
        "lng": -61.5833
      },
      "phone": "0590 26 92 92",
      "hours": {
        "monday": "08:00-20:00",
        "sunday": "08:00-13:00"
      },
      "services": ["drive", "livraison", "Click&Collect"],
      "lastUpdated": "2026-01-10"
    }
  ]
}
```

### Scripts de gestion

**Import automatique:**
```bash
# Import depuis liste (avec géocodage)
node scripts/auto-import-stores.js
```

**Correction automatique:**
```bash
# Corriger coordonnées, formats, doublons
node scripts/auto-fix-stores.mjs
```

**Synchronisation:**
```bash
# Sync avec données France
node scripts/sync-france.mjs
```

### Mise à jour

**Processus:**

1. **Nouveau magasin:**
   - Ajouter dans stores-database.json
   - Indiquer coordonnées GPS
   - Lister services disponibles

2. **Géocodage automatique:**
   - Si pas de coordonnées, script les génère
   - Utilise Nominatim (OpenStreetMap)

3. **Validation:**
   ```bash
   node scripts/verify-stores.mjs
   ```

### Sources

- **Annuaires officiels** (enseignes)
- **OpenStreetMap** (géolocalisation)
- **Contributions utilisateurs**
- **Partenariats enseignes**

---

## ⚙️ AUTOMATISATION GITHUB ACTIONS

### Workflows recommandés

#### 1. Mise à jour quotidienne (News)

**Fichier:** `.github/workflows/daily-update.yml`

```yaml
name: Daily Data Update

on:
  schedule:
    - cron: '0 6 * * *' # 6h UTC = 2h Guadeloupe
  workflow_dispatch:

jobs:
  update-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: node scripts/update-news.js clean 90
      - run: node scripts/update-news.js update-timestamp
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'chore: daily news update [skip ci]'
```

#### 2. Validation hebdomadaire (Données)

**Fichier:** `.github/workflows/weekly-validation.yml`

```yaml
name: Weekly Data Validation

on:
  schedule:
    - cron: '0 8 * * 1' # Lundi 8h UTC
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: node scripts/validate-data.js
      - run: node scripts/verify-stores.mjs
      - run: node scripts/validate-catalogue.mjs
```

#### 3. Export Open Data (Mensuel)

**Fichier:** `.github/workflows/monthly-export.yml`

```yaml
name: Monthly Open Data Export

on:
  schedule:
    - cron: '0 10 1 * *' # 1er du mois à 10h UTC
  workflow_dispatch:

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: node scripts/exportOpenData.js
      - run: node scripts/generate-sitemap.mjs
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'chore: monthly open data export'
```

---

## 🔧 MAINTENANCE

### Tâches régulières

**Quotidien:**
- ✅ Vérifier actualités (nouveau contenu)
- ✅ Surveiller erreurs build
- ✅ Répondre contributions citoyennes

**Hebdomadaire:**
- ✅ Mettre à jour prix produits prioritaires
- ✅ Valider cohérence données
- ✅ Nettoyer articles anciens (>90j)

**Mensuel:**
- ✅ Audit complet base magasins
- ✅ Export Open Data
- ✅ Mise à jour sitemap
- ✅ Vérifier liens externes

**Trimestriel:**
- ✅ Audit sécurité (npm audit)
- ✅ Mise à jour dépendances
- ✅ Revue méthodologie
- ✅ Rapports statistiques

### Monitoring

**Métriques à suivre:**
- Nombre d'actualités actives
- Date dernière MAJ données
- Taux de fraîcheur prix (<7j)
- Nombre magasins géolocalisés
- Erreurs 404 sur données

### Scripts utiles

```bash
# Vérifier état général
npm run check-all

# Nettoyer ancien contenu
node scripts/update-news.js clean 90

# Valider toutes les données
node scripts/validate-data.js

# Vérifier magasins
node scripts/verify-stores.mjs

# Export Open Data
node scripts/exportOpenData.js
```

---

## 📞 SUPPORT

Pour toute question sur l'automatisation:

1. Consulter cette documentation
2. Vérifier les scripts existants dans `scripts/`
3. Consulter les logs GitHub Actions
4. Ouvrir une issue sur GitHub

---

## 🚀 ROADMAP AUTOMATISATION

### Phase 1 (Actuel) ✅
- [x] Structure données actualités
- [x] Script mise à jour news
- [x] Documentation complète

### Phase 2 (Court terme)
- [ ] GitHub Actions workflows
- [ ] Monitoring automatique
- [ ] Alertes email/Slack

### Phase 3 (Moyen terme)
- [ ] API externe pour prix temps réel
- [ ] Cloudflare Workers edge functions
- [ ] Dashboard admin temps réel

### Phase 4 (Long terme)
- [ ] Machine Learning prédiction prix
- [ ] Automatisation complète relevés
- [ ] API publique temps réel

---

**Dernière mise à jour:** 2026-01-12  
**Version:** 1.0  
**Auteur:** A KI PRI SA YÉ Team
