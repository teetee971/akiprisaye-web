# 🧱 PIPELINE GLOBAL — A KI PRI SA YÉ

## Architecture Globale — CI/CD — Sécurité — Scalabilité

---

## 🎯 OBJECTIFS DU PIPELINE

Le pipeline global de **A KI PRI SA YÉ** est conçu pour :

- ✅ Collecter des **observations de prix réelles** uniquement
- ✅ **Ne jamais inventer de données**
- ✅ Conserver un **historique immuable**
- ✅ Être **audit-able** à tout moment
- ✅ Supporter citoyens, associations et institutions
- ✅ Maintenir des **coûts maîtrisés**

---

## 1️⃣ COLLECTE DES DONNÉES (INPUT)

### 🔹 Sources Autorisées Uniquement

**TYPES DE SOURCES AUTORISÉS :**
- 📄 Sites officiels d'enseignes (catalogues publics)
- 🏛️ Données publiques (INSEE, observatoires locaux)
- 👥 Relevés terrain (citoyens / associations)
- 🔌 APIs ouvertes (quand disponibles)

**❌ INTERDIT :**
- Scraping agressif
- Données payantes non licenciées
- "Estimations" ou simulations

### 🔹 Pipeline de Collecte

```
[Source publique]
     ↓
[Collector Service]
     ↓
[Validation Engine]
     ↓
[Price Observation Store]
```

### 📊 Structure d'une Observation de Prix

Chaque observation **DOIT** contenir :

| Champ | Type | Description | Requis |
|-------|------|-------------|--------|
| `produit` | string | Nom/EAN du produit | ✅ |
| `prix` | decimal | Prix en euros | ✅ |
| `unité` | string | Unité de mesure (kg, L, unité) | ✅ |
| `quantité` | decimal | Quantité du produit | ✅ |
| `magasin` | string | Identifiant du magasin | ✅ |
| `territoire` | string | Code territoire (GP, MQ, RE, etc.) | ✅ |
| `date` | timestamp | Date de capture | ✅ |
| `source` | string | Type de source (partner, ocr, citizen) | ✅ |
| `niveau_confiance` | string | OK, Suspect, À confirmer | ✅ |

---

## 2️⃣ VALIDATION & QUALITÉ (CRITIQUE)

### 🔍 Validation Automatique

**Vérifications de format :**
- ✅ Format correct
- ✅ Prix cohérent (>0, <10000)
- ✅ Unité connue (kg, L, unité, g, ml)
- ✅ Date valide (pas dans le futur)
- ✅ Store existant dans base territoires
- ✅ Territoire valide (DOM/COM uniquement)

### 🧠 Validation Logique

**Détection d'anomalies (sans correction) :**
- 📊 Comparaison avec historique du produit
- 🚨 Détection de variations >50% par rapport à la médiane
- 🏷️ Marquage avec flags :
  - `OK` - Validation réussie
  - `Suspect` - Variation anormale détectée
  - `À confirmer` - Donnée incomplète ou inhabituelle

⚠️ **PRINCIPE FONDAMENTAL** : Aucune donnée n'est modifiée, seulement annotée.

### 📝 Règles de Validation

```typescript
interface ValidationRules {
  prix: {
    min: 0.01,
    max: 10000.00,
    precision: 2 // centimes
  },
  unité: {
    valeurs_autorisées: ['kg', 'L', 'unité', 'g', 'ml', 'cl']
  },
  territoire: {
    valeurs_autorisées: [
      'GP', // Guadeloupe
      'MQ', // Martinique
      'GF', // Guyane
      'RE', // La Réunion
      'YT', // Mayotte
      'PM', // Saint-Pierre-et-Miquelon
      'BL', // Saint-Barthélemy
      'MF', // Saint-Martin
      'WF', // Wallis-et-Futuna
      'PF', // Polynésie française
      'NC', // Nouvelle-Calédonie
      'TF'  // Terres australes et antarctiques françaises
    ]
  }
}
```

---

## 3️⃣ STOCKAGE DES DONNÉES (IMMUTABLE)

### 🗄️ Architecture Recommandée

**Stack de données :**
- PostgreSQL (principal) - Données structurées
- TimescaleDB (extension) - Historique optimisé des prix

### 📊 Tables Clés

#### `products`
Catalogue de produits référencés.

```sql
CREATE TABLE products (
  ean VARCHAR(14) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  unit VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
```

#### `stores`
Magasins et points de vente.

```sql
CREATE TABLE stores (
  store_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  territory VARCHAR(2) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  postal_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stores_territory ON stores(territory);
CREATE INDEX idx_stores_location ON stores USING GIST(ll_to_earth(latitude, longitude));
```

#### `territories`
Référentiel des territoires d'Outre-mer.

```sql
CREATE TABLE territories (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country_code VARCHAR(2) DEFAULT 'FR',
  timezone VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données de référence
INSERT INTO territories (code, name, region, timezone) VALUES
  ('GP', 'Guadeloupe', 'Antilles', 'America/Guadeloupe'),
  ('MQ', 'Martinique', 'Antilles', 'America/Martinique'),
  ('GF', 'Guyane', 'Amérique du Sud', 'America/Cayenne'),
  ('RE', 'La Réunion', 'Océan Indien', 'Indian/Reunion'),
  ('YT', 'Mayotte', 'Océan Indien', 'Indian/Mayotte'),
  ('PM', 'Saint-Pierre-et-Miquelon', 'Amérique du Nord', 'America/Miquelon'),
  ('BL', 'Saint-Barthélemy', 'Antilles', 'America/St_Barthelemy'),
  ('MF', 'Saint-Martin', 'Antilles', 'America/Marigot'),
  ('WF', 'Wallis-et-Futuna', 'Pacifique', 'Pacific/Wallis'),
  ('PF', 'Polynésie française', 'Pacifique', 'Pacific/Tahiti'),
  ('NC', 'Nouvelle-Calédonie', 'Pacifique', 'Pacific/Noumea'),
  ('TF', 'Terres australes et antarctiques françaises', 'Antarctique', 'Indian/Kerguelen');
```

#### `price_observations` (APPEND-ONLY avec TimescaleDB)
Historique immuable des prix observés.

```sql
-- Table principale avec hypertable TimescaleDB
CREATE TABLE price_observations (
  id BIGSERIAL,
  ean VARCHAR(14) NOT NULL,
  store_id VARCHAR(50) NOT NULL,
  territory VARCHAR(2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  unit VARCHAR(10),
  quantity DECIMAL(10, 3),
  source VARCHAR(20) NOT NULL, -- 'partner', 'ocr', 'citizen'
  confidence_level VARCHAR(20) NOT NULL, -- 'OK', 'Suspect', 'À confirmer'
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées source
  source_id VARCHAR(100),
  source_url TEXT,
  receipt_id VARCHAR(50),
  
  -- Constraints
  CONSTRAINT chk_price_positive CHECK (price > 0),
  CONSTRAINT chk_unit_valid CHECK (unit IN ('kg', 'L', 'unité', 'g', 'ml', 'cl')),
  CONSTRAINT chk_source_valid CHECK (source IN ('partner', 'ocr', 'citizen')),
  CONSTRAINT chk_confidence_valid CHECK (confidence_level IN ('OK', 'Suspect', 'À confirmer')),
  
  -- Foreign Keys
  FOREIGN KEY (ean) REFERENCES products(ean),
  FOREIGN KEY (store_id) REFERENCES stores(store_id),
  FOREIGN KEY (territory) REFERENCES territories(code)
);

-- Convertir en hypertable TimescaleDB (optimisé pour séries temporelles)
SELECT create_hypertable('price_observations', 'captured_at');

-- Index pour requêtes fréquentes
CREATE INDEX idx_price_obs_ean ON price_observations(ean, captured_at DESC);
CREATE INDEX idx_price_obs_store ON price_observations(store_id, captured_at DESC);
CREATE INDEX idx_price_obs_territory ON price_observations(territory, captured_at DESC);
CREATE INDEX idx_price_obs_source ON price_observations(source);
CREATE INDEX idx_price_obs_confidence ON price_observations(confidence_level);
```

#### `price_flags`
Annotations et signalements sur les observations de prix.

```sql
CREATE TABLE price_flags (
  flag_id BIGSERIAL PRIMARY KEY,
  observation_id BIGINT NOT NULL,
  flag_type VARCHAR(50) NOT NULL, -- 'anomaly_high', 'anomaly_low', 'duplicate', 'outdated'
  flag_reason TEXT,
  severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  flagged_by VARCHAR(100), -- 'system' ou user_id
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  
  FOREIGN KEY (observation_id) REFERENCES price_observations(id),
  CONSTRAINT chk_severity_valid CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_flags_observation ON price_flags(observation_id);
CREATE INDEX idx_flags_unresolved ON price_flags(resolved, flagged_at DESC) WHERE NOT resolved;
```

#### `sources`
Référentiel des sources de données.

```sql
CREATE TABLE sources (
  source_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'partner', 'api', 'citizen', 'ocr'
  description TEXT,
  url TEXT,
  reliability_score DECIMAL(3, 2) DEFAULT 1.00, -- 0.00 à 1.00
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_reliability CHECK (reliability_score BETWEEN 0 AND 1),
  CONSTRAINT chk_type_valid CHECK (type IN ('partner', 'api', 'citizen', 'ocr'))
);
```

#### `confidence_levels`
Définition des niveaux de confiance.

```sql
CREATE TABLE confidence_levels (
  level VARCHAR(20) PRIMARY KEY,
  description TEXT NOT NULL,
  score DECIMAL(3, 2) NOT NULL, -- 0.00 à 1.00
  color_code VARCHAR(7), -- Code couleur hex pour UI
  
  CONSTRAINT chk_score CHECK (score BETWEEN 0 AND 1)
);

-- Données de référence
INSERT INTO confidence_levels (level, description, score, color_code) VALUES
  ('OK', 'Donnée validée et conforme', 1.00, '#10B981'),
  ('Suspect', 'Donnée avec anomalie détectée', 0.50, '#F59E0B'),
  ('À confirmer', 'Donnée incomplète ou inhabituelle', 0.30, '#EF4444');
```

### ❗ Principes d'Immutabilité

**RÈGLES STRICTES :**
- ✅ Historique = **APPEND ONLY**
- ❌ Pas de `DELETE` sur `price_observations`
- ❌ Pas d'`UPDATE` sur les prix
- ✅ Seules les annotations (`price_flags`) peuvent être ajoutées

**Gestion des corrections :**
Si une observation est erronée, on **N'EFFACE PAS**, on :
1. Ajoute un flag `flag_type='invalid'` dans `price_flags`
2. Marque `resolved=false` pour exclusion des calculs
3. Ajoute une nouvelle observation correcte si nécessaire

---

## 4️⃣ MOTEURS MÉTIERS (MODULES 1 → 5)

Chaque module est **indépendant** et opère en **lecture seule** sur les données.

```
[Price DB]
   ↓
[Comparison Engine]      (Module 1)
[Alert Engine]           (Module 2)
[History Engine]         (Module 3)
[Optimization Engine]    (Module 4)
[Trend Engine]           (Module 5)
```

### Avantages de cette Architecture

- ✅ **Debug facile** - Modules isolés
- ✅ **Audit possible** - Lecture seule = traçabilité
- ✅ **Évolution sans casse** - Nouveaux modules sans impact

### Module 1 : Comparison Engine

**Fonction :** Comparer les prix d'un même produit entre magasins.

**Endpoints :**
- `GET /api/comparison?ean=XXX&territory=GP`
- `GET /api/comparison/multi?eans=XXX,YYY&territory=GP`

**Données retournées :**
- Prix minimum, maximum, médian
- Écart par rapport au meilleur prix
- Liste des magasins classés par prix

### Module 2 : Alert Engine

**Fonction :** Détecter et signaler les anomalies de prix.

**Endpoints :**
- `GET /api/alerts?territory=GP&severity=critical`
- `GET /api/alerts/product/:ean`

**Types d'alertes :**
- Prix anormalement élevé (>50% médiane)
- Prix anormalement bas (<50% médiane)
- Variation brutale (>30% en 24h)
- Pénurie (aucun prix depuis 7 jours)

### Module 3 : History Engine

**Fonction :** Historique des prix sur période donnée.

**Endpoints :**
- `GET /api/history/:ean?from=2025-01-01&to=2025-12-31`
- `GET /api/history/territory/:territory?period=30d`

**Données retournées :**
- Évolution des prix (min, max, moyenne)
- Graphiques temporels
- Tendances (hausse, baisse, stable)

### Module 4 : Optimization Engine

**Fonction :** Optimiser le panier d'achat par magasin.

**Endpoints :**
- `POST /api/optimize/basket` (body: liste EANs)
- `GET /api/optimize/suggestions?eans=XXX,YYY&territory=GP`

**Données retournées :**
- Meilleur magasin global pour le panier
- Économies potentielles
- Répartition optimale multi-magasins

### Module 5 : Trend Engine

**Fonction :** Analyser les tendances de prix long terme.

**Endpoints :**
- `GET /api/trends/territory/:territory?period=12m`
- `GET /api/trends/category/:category?territory=GP`

**Données retournées :**
- Inflation par catégorie
- Produits en hausse/baisse
- Comparaison inter-territoires

---

## 5️⃣ API LECTURE SEULE (MONÉTISABLE)

### 🔐 API Gateway

**Authentification :**
- JWT pour utilisateurs authentifiés
- API Keys pour partenaires/institutions
- Rate limiting par tier :
  - Gratuit : 100 req/h
  - Standard : 1000 req/h
  - Premium : 10000 req/h

**Sécurité :**
- ✅ Lecture seule stricte
- ✅ Aucune modification via API
- ✅ CORS configuré
- ✅ HTTPS obligatoire

### 📍 Endpoints Principaux

#### `/api/prices`
Récupérer les prix actuels d'un produit.

**Query params :**
- `ean` (required)
- `territory` (optional)
- `store_id` (optional)

**Response :**
```json
{
  "ean": "3017620422003",
  "product": {
    "name": "Nutella 750g",
    "brand": "Ferrero",
    "category": "Pâte à tartiner"
  },
  "prices": [
    {
      "store_id": "carrefour_gp_001",
      "store_name": "Carrefour Market",
      "territory": "GP",
      "price": 4.99,
      "unit_price": 6.65,
      "unit": "kg",
      "source": "partner",
      "confidence_level": "OK",
      "captured_at": "2025-12-18T10:00:00Z",
      "age_hours": 2
    }
  ],
  "best": {
    "price": 4.49,
    "store_id": "leaderprice_gp_002"
  }
}
```

#### `/api/history`
Historique des prix.

#### `/api/territories`
Liste des territoires supportés.

#### `/api/indicators`
Indicateurs économiques (inflation, variation).

#### `/api/exports`
Export de données (CSV, JSON) pour analyse.

### 👥 Clients API

- 🌐 **App web** - Frontend React
- 🔌 **Extension navigateur** - Chrome/Firefox
- 🏛️ **Institutions** - INSEE, DGCCRF, collectivités
- 📰 **Médias** - Journaux, TV, radio

---

## 6️⃣ FRONTEND & UX

### Stack Validée

**Frontend :**
- ⚛️ React 18 + Vite 7
- 🎨 Tailwind CSS 4 (design system)
- 📱 PWA installable

**Backend :**
- 🚀 AdonisJS ou NestJS
- 🗄️ PostgreSQL + TimescaleDB
- ⚡ Redis (cache lecture)

### Cache Strategy

**Redis utilisé pour :**
- 📊 Lecture fréquente (prix actuels)
- 🔄 Invalidation automatique (TTL 1h)
- 🚀 Réduction charge DB

**Pattern de cache :**
```typescript
async function getPrices(ean: string, territory: string) {
  const cacheKey = `prices:${ean}:${territory}`;
  
  // Tenter le cache
  let prices = await redis.get(cacheKey);
  
  if (!prices) {
    // Cache miss - requête DB
    prices = await db.query(
      `SELECT * FROM price_observations 
       WHERE ean = $1 AND territory = $2 
       AND confidence_level = 'OK'
       ORDER BY captured_at DESC 
       LIMIT 10`,
      [ean, territory]
    );
    
    // Stocker en cache (1h)
    await redis.setex(cacheKey, 3600, JSON.stringify(prices));
  }
  
  return JSON.parse(prices);
}
```

---

## 7️⃣ CI/CD — DÉPLOIEMENT PROPRE

### GitHub Actions (Déjà en Place)

**Workflow actuel :** `.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy Frontend (Cloudflare Pages)
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: akiprisaye-web
          directory: dist
```

### Environnements

| Environnement | Branche | URL | Usage |
|---------------|---------|-----|-------|
| **Development** | `develop` | `dev.akiprisaye.web.app` | Développement actif |
| **Staging** | `staging` | `staging.akiprisaye.web.app` | Tests pré-production |
| **Production** | `main` | `akiprisaye.web.app` | Production publique |

### Backend Deployment

**Options recommandées :**
- 🚂 **Railway** - Simple, PostgreSQL inclus
- 🎨 **Render** - Gratuit tier disponible
- 🔷 **Heroku** - Mature, TimescaleDB add-on

**Configuration nécessaire :**
```bash
# Variables d'environnement
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=xxx
API_RATE_LIMIT=100
NODE_ENV=production
```

---

## 8️⃣ SÉCURITÉ & CONFIANCE

### 🔐 Sécurité Technique

- ✅ **HTTPS partout** - Cloudflare SSL
- ✅ **CSP stricte** - Content Security Policy
- ✅ **Aucun script tiers** non maîtrisé
- ✅ **Logs d'accès API** - Traçabilité complète
- ✅ **Rate limiting** - Protection DDoS
- ✅ **Input validation** - Injection SQL/XSS

### 📜 Traçabilité des Données

**Chaque donnée a :**
- ✅ Une **source** identifiée (`sources` table)
- ✅ Une **date de capture** précise
- ✅ Un **niveau de confiance** explicite
- ✅ Une **traçabilité** complète (jamais supprimée)

**Chaque calcul est :**
- ✅ **Explicable** - Algorithme public
- ✅ **Reproductible** - Données immutables
- ✅ **Auditable** - Logs conservés

**Chaque export est :**
- ✅ **Horodaté** - Timestamp ISO 8601
- ✅ **Signé** - Hash SHA-256
- ✅ **Versionné** - Version schema

---

## 9️⃣ COÛTS MAÎTRISÉS (ESTIMATION)

### Estimation Mensuelle

| Poste | Service | Coût Mensuel |
|-------|---------|--------------|
| **Frontend** | Cloudflare Pages | 0 – 20 € |
| **Backend** | Railway / Render | 20 – 100 € |
| **Base de données** | PostgreSQL + TimescaleDB | 20 – 80 € |
| **Cache** | Redis (Upstash) | 0 – 20 € |
| **Monitoring** | Sentry / Grafana Cloud | 0 – 30 € |
| **Total** | | **~50 – 200 €** |

### Rentabilité

**Seuil de rentabilité :**
- 📊 Modèle freemium : 500 utilisateurs gratuits
- 💳 Abonnement Premium : 4,99 €/mois
- 🏢 API Institutions : 99 €/mois
- 🎯 **Rentable dès 100-200 abonnés**

### Scaling

**Infrastructure scalable :**
- Cloudflare Pages : CDN global automatique
- Railway : Auto-scaling jusqu'à 8GB RAM
- TimescaleDB : Compression automatique (réduction 90%)
- Redis : Partitionnement si >10M observations

---

## 🔟 ÉVOLUTION LONG TERME (SAFE)

### Principes d'Évolution

- ✅ **Ajout territoires** - Sans refonte (table `territories`)
- ✅ **Ajout modules** - Sans dette technique (architecture modulaire)
- ✅ **Service public numérique** - Possible (données ouvertes)
- ✅ **Audit externe** - Possible à tout moment (immutabilité)

### Roadmap Long Terme

**2025 Q1-Q2 :**
- Mise en production du pipeline
- Modules 1-3 (Comparison, Alert, History)

**2025 Q3-Q4 :**
- Modules 4-5 (Optimization, Trend)
- API publique ouverte
- Partenariats institutionnels

**2026+ :**
- Expansion géographique (Métropole ?)
- Machine Learning (prédiction prix)
- Open Data officiel

---

## 🏁 CONCLUSION STRATÉGIQUE

Ce pipeline fait de **A KI PRI SA YÉ** :

- 🏆 Un **outil citoyen sérieux** - Pas de gadget
- 🗄️ Une **infrastructure de données** - Robuste et pérenne
- 🔬 Un **observatoire crédible** - Méthodologie transparente
- 💰 Un **produit monétisable** - Sans trahir sa mission

**Philosophie :**
> "Faire peu, mais faire VRAI. Les données réelles valent mieux que mille estimations."

---

**Dernière mise à jour :** Décembre 2025  
**Version :** 1.0.0  
**Auteur :** Équipe A KI PRI SA YÉ
