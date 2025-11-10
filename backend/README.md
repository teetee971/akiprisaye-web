# Backend API - A KI PRI SA YÉ

## Structure AdonisJS-style

Ce dossier contient la structure backend de l'application, organisée selon les conventions AdonisJS.

```
backend/
├── app/
│   ├── Controllers/        # Contrôleurs API
│   │   ├── PricesController.ts
│   │   ├── NewsController.ts
│   │   └── ContactController.ts
│   └── Jobs/              # Tâches CRON
│       └── price-refresh.ts
├── routes/                # Définition des routes
│   └── api.ts
└── config/                # Configuration (à venir)
```

## Endpoints API

### 📦 Products API

#### GET /api/products/search
Search products by name or keyword using Open Food Facts API.

**Query Parameters:**
- `q` (required): Search query (minimum 3 characters)
- `territory` (optional): Territory code (default: 'Guadeloupe')

**Response:**
```json
[
  {
    "name": "Nutella",
    "brand": "Ferrero",
    "ean": "3017620422003",
    "image": "https://images.openfoodfacts.org/..."
  }
]
```

#### POST /api/products/select
Track a product selection for trending analytics. Uses Redis sorted sets to maintain real-time trending data.

**Body:**
```json
{
  "ean": "3017620422003",
  "territory": "Guadeloupe",
  "name": "Nutella",
  "brand": "Ferrero",
  "image": "https://images.openfoodfacts.org/..."
}
```

**Response:**
```json
{
  "success": true,
  "ean": "3017620422003",
  "territory": "Guadeloupe",
  "score": 42,
  "tracked": true,
  "message": "Product selection tracked successfully"
}
```

**Notes:**
- `ean` is required and must be 8-14 digits
- `territory` defaults to 'Guadeloupe' if not provided
- `name`, `brand`, and `image` are optional metadata
- Uses `ZINCRBY trendingZ:{territory}` to increment product score
- Stores metadata in `product:{ean}` hash

#### GET /api/products/trending
Get top trending products by territory based on user selections.

**Query Parameters:**
- `territory` (optional): Territory code (default: 'Guadeloupe')
- `limit` (optional): Number of products to return (default: 10, max: 100)

**Response:**
```json
{
  "territory": "Guadeloupe",
  "limit": 10,
  "count": 5,
  "products": [
    {
      "ean": "3017620422003",
      "score": 42,
      "name": "Nutella",
      "brand": "Ferrero",
      "image": "https://images.openfoodfacts.org/..."
    }
  ]
}
```

### 🔍 Prices API

#### GET /api/prices
Récupère les prix par code EAN et territoire.

**Query Parameters:**
- `ean` (required): Code EAN du produit (8-13 chiffres)
- `territory` (optional): Code territoire (GP, MQ, RE, etc.)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "ean": "3017620422003",
      "store": "Carrefour Market",
      "price": 3.45,
      "unit": "€",
      "location": "GP",
      "lastUpdate": "2025-11-08T10:00:00Z",
      "promotion": false
    }
  ],
  "meta": {
    "total": 3,
    "ean": "3017620422003",
    "territory": "GP"
  }
}
```

#### POST /api/prices
Ajoute un nouveau prix (contribution utilisateur ou scraper).

**Body:**
```json
{
  "ean": "3017620422003",
  "store": "Carrefour Market",
  "price": 3.45,
  "location": "GP",
  "promotion": false
}
```

#### GET /api/prices/compare
Compare les prix de plusieurs produits.

**Query Parameters:**
- `eans`: Liste de codes EAN séparés par des virgules
- `territory`: Code territoire

### 📰 News API

#### GET /api/news
Récupère les actualités.

**Query Parameters:**
- `territory` (optional): Filtrer par territoire
- `category` (optional): Filtrer par catégorie (Prix, Innovation, Politique, Alerte)
- `limit` (optional): Nombre d'articles (défaut: 10)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Nouvelle baisse des prix",
      "summary": "Plusieurs enseignes annoncent...",
      "date": "2025-11-08T10:00:00Z",
      "category": "Prix",
      "territory": "Guadeloupe"
    }
  ],
  "meta": {
    "total": 6,
    "territory": "all",
    "category": "all"
  }
}
```

#### GET /api/news/:id
Récupère un article spécifique.

#### POST /api/news
Crée un nouvel article (admin uniquement).

### 📧 Contact API

#### POST /api/contact
Envoie un message via le formulaire de contact.

**Body:**
```json
{
  "name": "Marie Dupont",
  "email": "marie@example.com",
  "subject": "Question",
  "message": "Bonjour...",
  "territory": "GP"
}
```

**Response:**
```json
{
  "data": {
    "id": 123456,
    "status": "received"
  },
  "message": "Votre message a été envoyé avec succès."
}
```

## CRON Jobs

### price-refresh.ts
Job quotidien de mise à jour des prix.

**Schedule:** Tous les jours à 2h00 du matin
**Pattern:** `0 2 * * *`

**Actions:**
1. Récupère les prix depuis les APIs partenaires
2. Met à jour la base de données
3. Nettoie les données de plus de 30 jours
4. Génère les statistiques quotidiennes

## Déploiement

### Option 1: Firebase Functions
```bash
# Dans le dossier functions/
npm install
npm run deploy
```

### Option 2: Serveur Node.js classique
```bash
cd backend
npm install
npm start
```

### Option 3: AdonisJS (production)
```bash
cd backend
npm install
node ace serve --watch
```

## Configuration

### Variables d'environnement requises

```env
# Database
DATABASE_URL=postgresql://...

# Redis (for trending analytics)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# External APIs
CARREFOUR_API_KEY=xxx
SUPERU_API_KEY=xxx
LEADERPRICE_API_KEY=xxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx

# Admin
ADMIN_EMAIL=admin@akiprisaye.app
```

## Sécurité

### En production, ajouter:
- ✅ Authentification JWT pour routes admin
- ✅ Rate limiting (express-rate-limit)
- ✅ CORS configuré strictement
- ✅ Validation des données (Joi ou Vine)
- ✅ Logs d'audit
- ✅ Monitoring (Sentry)

## Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

## Maintenance

### Logs
Les logs sont stockés dans:
- `storage/logs/` (local)
- CloudWatch (AWS)
- Cloud Logging (GCP)

### Monitoring
- Uptime: https://status.akiprisaye.app
- Metrics: Dashboard Grafana
- Alerts: Email + Slack

## Support

Pour toute question sur le backend:
- Documentation: https://docs.akiprisaye.app
- Issues: https://github.com/teetee971/akiprisaye-web/issues
- Email: dev@akiprisaye.app
