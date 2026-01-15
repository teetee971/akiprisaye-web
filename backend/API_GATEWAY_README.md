# API Gateway & Système d'Authentification

## 📋 Vue d'ensemble

Système complet d'API Gateway avec authentification multi-niveaux, rate limiting dynamique et gestion des API Keys pour l'accès programmatique aux données de A KI PRI SA YÉ.

## 🔐 Authentification

### Méthodes supportées

#### 1. JWT Bearer Token (Utilisateurs Web)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Flux d'authentification:**
1. `POST /api/auth/login` - Connexion
2. `POST /api/auth/refresh` - Rafraîchir le token
3. `POST /api/auth/logout` - Déconnexion

#### 2. API Key (Applications Tierces)
```http
X-API-Key: akp_live_1234567890abcdef...
```

**Gestion des clés:**
- `GET /api/api-keys` - Liste des clés
- `POST /api/api-keys` - Créer une clé
- `DELETE /api/api-keys/:id` - Révoquer une clé
- `GET /api/api-keys/:id/usage` - Statistiques d'usage

## 📊 Niveaux d'abonnement

| Tier | Requêtes/jour | Clés API | Analytics | Export | Prix/mois |
|------|---------------|----------|-----------|--------|-----------|
| **FREE** | 100 | 1 | ❌ | ❌ | Gratuit |
| **CITIZEN_PREMIUM** | 1,000 | 3 | ❌ | ✅ | 9.90€ |
| **SME** | 5,000 | 5 | ✅ | ✅ | 49€ |
| **BUSINESS_PRO** | 50,000 | 10 | ✅ | ✅ | 199€ |
| **INSTITUTIONAL** | 500,000 | 50 | ✅ | ✅ | 999€ |

## 🛣️ Endpoints API v1

### Structure
```
/api/v1/
├── auth/                    # Authentification
├── comparators/:type/       # Données comparateurs
│   ├── data                 # Données brutes
│   ├── statistics           # Statistiques
│   └── trends               # Tendances (Pro+)
├── territories/:code/       # Informations territoires
│   └── overview             # Vue d'ensemble
├── prices/:category/        # Données de prix
│   ├── [get]                # Prix actuels
│   └── history              # Historique (Premium+)
├── analytics/               # Analytics (Pro+)
│   ├── market-share         # Parts de marché
│   ├── price-evolution      # Évolution des prix
│   └── custom-report        # Rapports personnalisés (Institutional)
├── contributions/           # Contributions
│   ├── [get] aggregate      # Données agrégées
│   └── [post]               # Créer contribution
└── exports/                 # Exports
    ├── csv                  # Export CSV
    └── excel                # Export Excel (Pro+)
```

### Permissions

| Permission | Description | Tier minimum |
|-----------|-------------|--------------|
| `READ_COMPARATORS` | Lecture comparateurs | FREE |
| `READ_PRICES` | Lecture prix | FREE |
| `READ_TERRITORIES` | Lecture territoires | FREE |
| `WRITE_CONTRIBUTIONS` | Écriture contributions | PREMIUM |
| `EXPORT_DATA` | Export de données | PREMIUM |
| `READ_ANALYTICS` | Analytics avancées | SME |
| `ADMIN` | Administration | INSTITUTIONAL |

## 🚦 Rate Limiting

### Limites par fenêtre
- **Minute**: RateLimitDay / 1440
- **Heure**: RateLimitDay / 24
- **Jour**: Selon abonnement

### Headers de réponse
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1642598400
X-Subscription-Tier: CITIZEN_PREMIUM
```

### Dépassement de limite
```json
{
  "error": "Limite de requêtes dépassée",
  "message": "Vous avez atteint la limite de 1000 requêtes par jour...",
  "retryAfter": "3600s",
  "currentTier": "CITIZEN_PREMIUM",
  "upgradeUrl": "/api/subscriptions/upgrade"
}
```

## 🔧 Utilisation

### Créer une API Key

```bash
curl -X POST https://api.akiprisaye.app/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API",
    "permissions": [
      "READ_COMPARATORS",
      "READ_PRICES",
      "EXPORT_DATA"
    ],
    "expiresIn": 365
  }'
```

**Réponse:**
```json
{
  "message": "Clé API créée avec succès",
  "data": {
    "id": "uuid-...",
    "name": "Production API",
    "prefix": "akp_live_",
    "secret": "akp_live_1234567890abcdef...",
    "permissions": ["READ_COMPARATORS", "READ_PRICES", "EXPORT_DATA"],
    "status": "ACTIVE",
    "expiresAt": "2027-01-14T10:00:00Z"
  },
  "warning": "Copiez cette clé maintenant, elle ne sera plus affichée"
}
```

### Utiliser une API Key

```bash
curl https://api.akiprisaye.app/api/v1/comparators/fuel/data \
  -H "X-API-Key: akp_live_1234567890abcdef..."
```

### Récupérer les statistiques d'usage

```bash
curl https://api.akiprisaye.app/api/api-keys/{key_id}/usage?period=week \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse:**
```json
{
  "message": "Statistiques d'usage",
  "data": {
    "totalRequests": 2547,
    "period": "week",
    "byEndpoint": [
      {
        "endpoint": "/api/v1/comparators/fuel/data",
        "_count": 1520,
        "_avg": { "responseTime": 45.2 }
      },
      {
        "endpoint": "/api/v1/prices/alimentation",
        "_count": 1027,
        "_avg": { "responseTime": 38.7 }
      }
    ]
  }
}
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais exposer les clés API**
   - Stockage sécurisé (variables d'environnement)
   - Rotation régulière des clés
   - Pas de commit dans Git

2. **Utiliser HTTPS**
   - Toujours en production
   - Évite l'interception des clés

3. **Permissions minimales**
   - Accorder uniquement les permissions nécessaires
   - Une clé par service/application

4. **Monitoring**
   - Surveiller l'usage anormal
   - Révoquer immédiatement si compromis

### Révocation d'une clé

```bash
curl -X DELETE https://api.akiprisaye.app/api/api-keys/{key_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📖 Documentation

- **Swagger UI**: https://api.akiprisaye.app/api/docs
- **OpenAPI Spec**: https://api.akiprisaye.app/api/docs/openapi.json
- **Guide d'intégration**: /docs/API_INTEGRATION_GUIDE.md

## 🐛 Dépannage

### Erreur 401 - Non autorisé
- Vérifier que la clé API est correcte
- Vérifier que la clé n'est pas expirée ou révoquée
- Vérifier le format: `X-API-Key: akp_live_...`

### Erreur 403 - Permission insuffisante
- Vérifier les permissions de la clé
- Mettre à niveau l'abonnement si nécessaire
- Créer une nouvelle clé avec les bonnes permissions

### Erreur 429 - Rate limit dépassé
- Attendre la période de reset
- Optimiser les appels API (cache, batch)
- Mettre à niveau l'abonnement

## 🏗️ Architecture Technique

### Modèles de données

```typescript
// User (étendu)
subscriptionTier: SubscriptionTier
apiKeys: ApiKey[]

// ApiKey
id: string
userId: string
name: string
keyHash: string  // Jamais stocké en clair
prefix: string   // "akp_live_"
permissions: ApiPermission[]
rateLimitDay: number
rateLimitHour: number
rateLimitMinute: number
status: ApiKeyStatus
expiresAt?: Date

// ApiUsage
apiKeyId: string
endpoint: string
method: string
statusCode: number
responseTime: number
timestamp: Date
```

### Services

- **ApiKeyService**: Gestion des clés API
- **AuthService**: Authentification JWT (existant)
- **Rate Limiting**: Dynamique selon abonnement

### Middleware

- **unifiedAuthMiddleware**: JWT ou API Key
- **requirePermission**: Vérification permissions
- **requireSubscriptionTier**: Vérification tier
- **createDynamicRateLimit**: Rate limiting dynamique
- **trackApiUsage**: Tracking usage

## 🚀 Roadmap

- [ ] Migration vers Redis pour rate limiting
- [ ] Webhooks pour notifications
- [ ] GraphQL API endpoint
- [ ] SDK clients (Python, Node.js, Go)
- [ ] API Analytics Dashboard
- [ ] Alertes usage et quotas

## 📞 Support

- Email: api@akiprisaye.fr
- Documentation: https://docs.akiprisaye.app
- Status: https://status.akiprisaye.app
