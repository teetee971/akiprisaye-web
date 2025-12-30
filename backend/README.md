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
