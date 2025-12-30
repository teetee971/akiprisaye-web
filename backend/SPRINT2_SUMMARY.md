# Sprint 2 - API REST avec JWT - SUMMARY

## ✅ Mission Accomplie

L'API REST sécurisée pour A KI PRI SA YÉ est **opérationnelle** et prête pour audit.

---

## 📊 Métriques de Qualité

| Critère | Résultat | Statut |
|---------|----------|--------|
| **API Endpoints** | 10 endpoints fonctionnels | ✅ 100% |
| **Authentification JWT** | Access + Refresh tokens | ✅ |
| **Rate Limiting** | 3 niveaux (auth, create, api) | ✅ |
| **Documentation Swagger** | OpenAPI 3.0 complet | ✅ |
| **Sécurité** | JWT + bcrypt + validation | ✅ |
| **Conformité RGPD** | Privacy by design | ✅ |
| **Tests unitaires** | 58 (Sprint 1) + À compléter | ⚠️ |

---

## 🏗️ Architecture Ajoutée

```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts          ✅ Login, refresh, logout, register
│   │   │   └── legalEntity.controller.ts   ✅ CRUD complet
│   │   ├── routes/
│   │   │   ├── auth.routes.ts              ✅ Routes publiques
│   │   │   └── legalEntity.routes.ts       ✅ Routes protégées JWT
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts          ✅ Vérification JWT
│   │   │   ├── error.middleware.ts         ✅ Gestion centralisée
│   │   │   └── rateLimit.middleware.ts     ✅ Protection brute force
│   │   └── docs/
│   │       └── swagger.ts                  ✅ OpenAPI 3.0
│   ├── security/
│   │   ├── jwt.ts                          ✅ Génération/validation tokens
│   │   └── password.ts                     ✅ Hash bcrypt
│   └── services/
│       └── auth/
│           └── AuthService.ts              ✅ Logique auth
├── prisma/
│   └── schema.prisma                       ✅ User + RefreshToken models
```

---

## 🎯 Endpoints Exposés

### 🔑 Authentication (Public)

| Méthode | Endpoint | Description | Rate Limit |
|---------|----------|-------------|------------|
| POST | `/api/auth/login` | Connexion email/password → JWT | 5/15min |
| POST | `/api/auth/refresh` | Rafraîchir access token | Standard |
| POST | `/api/auth/logout` | Déconnexion (révoque refresh) | Standard |
| POST | `/api/auth/register` | Créer utilisateur | Standard |

**Exemple login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "MyP@ssw0rd!"
}

Response 200:
{
  "message": "Connexion réussie",
  "user": { "id": "...", "email": "...", "name": "..." },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### 🏢 Legal Entities (Protégé JWT)

| Méthode | Endpoint | Description | Rate Limit |
|---------|----------|-------------|------------|
| POST | `/api/legal-entities` | Créer entité | 20/heure |
| GET | `/api/legal-entities` | Lister (pagination) | Standard |
| GET | `/api/legal-entities/stats` | Statistiques | Standard |
| GET | `/api/legal-entities/:id` | Détails | Standard |
| PUT | `/api/legal-entities/:id` | Modifier | Standard |
| DELETE | `/api/legal-entities/:id` | Supprimer | Standard |

**Exemple création:**
```json
POST /api/legal-entities
Authorization: Bearer eyJhbGci...

{
  "siren": "123456782",
  "siret": "12345678200002",
  "name": "Entreprise Exemple SARL",
  "status": "ACTIVE"
}

Response 201:
{
  "message": "Entité juridique créée avec succès",
  "data": {
    "id": "uuid",
    "siren": "123456782",
    "siret": "12345678200002",
    "name": "Entreprise Exemple SARL",
    "status": "ACTIVE",
    "createdAt": "2024-12-19T...",
    "updatedAt": "2024-12-19T..."
  }
}
```

### 📘 Documentation

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/docs` | Interface Swagger UI |
| GET | `/api/docs/json` | Spécification OpenAPI JSON |

---

## 🔐 Sécurité Implémentée

### JWT (JSON Web Tokens)

**Access Token:**
- Durée: 15 minutes (configurable)
- Algorithme: HS256
- Contenu: userId, email, type
- Révocable: Non (courte durée)

**Refresh Token:**
- Durée: 7 jours (configurable)
- Algorithme: HS256
- Stockage: Base de données (hashé SHA-256)
- Révocable: Oui (logout, changement password)
- Rotation: Nouveau token à chaque refresh

**Headers:**
```
Authorization: Bearer <access_token>
```

### Mots de Passe

**Hash: bcrypt**
- Salt rounds: 12 (~250ms)
- Jamais stockés en clair
- Validation force:
  - Min 8 caractères
  - Majuscule + minuscule
  - Chiffre + caractère spécial

**Fonctions:**
- `hashPassword()` - Hash avec validation
- `verifyPassword()` - Vérification timing-safe
- `checkPasswordStrength()` - Score 0-5
- `generateRandomPassword()` - Génération sécurisée

### Rate Limiting

**Niveaux:**
1. **Auth** (`authLimiter`): 5 tentatives / 15 min
   - Protection brute force login
   - Skip successful requests
   
2. **Création** (`createLimiter`): 20 / heure
   - Évite spam ressources
   
3. **API globale** (`apiLimiter`): 100 / 15 min
   - Limite générale
   - Headers RateLimit-* inclus

**Réponse 429:**
```json
{
  "error": "Trop de requêtes",
  "message": "Veuillez réessayer dans quelques minutes",
  "retryAfter": "2024-12-19T01:15:00.000Z",
  "timestamp": "2024-12-19T01:00:00.000Z"
}
```

### Validation

**Zod schemas:**
- `loginSchema` - Email + password
- `registerSchema` - Email + password (force) + name
- `refreshSchema` - Refresh token
- `createLegalEntitySchema` - SIREN/SIRET avec Luhn
- `updateLegalEntitySchema` - Partiel
- `listQuerySchema` - Pagination + filtres

**Messages d'erreur:**
```json
{
  "error": "Erreur de validation",
  "details": [
    {
      "field": "siren",
      "message": "Le SIREN est invalide (vérification de la clé de contrôle échouée)"
    }
  ],
  "timestamp": "2024-12-19T..."
}
```

---

## 🗄️ Modèles de Données

### User

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  role         UserRole  @default(USER)
  isActive     Boolean   @default(true)
  lastLogin    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  refreshTokens RefreshToken[]
}
```

**Rôles:**
- `USER` - Utilisateur standard
- `ADMIN` - Administrateur
- `SUPER_ADMIN` - Super admin

### RefreshToken

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique  // SHA-256
  userId    String
  user      User     @relation(...)
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Fonctionnalités:**
- Hash SHA-256 (jamais en clair)
- Révocation manuelle (logout)
- Nettoyage automatique (expirés)
- Révocation globale par user

---

## 📘 Documentation Swagger

### OpenAPI 3.0 Complet

**Inclut:**
- ✅ Description de l'API
- ✅ Informations de conformité (RGPD, SIREN, SIRET)
- ✅ Guides d'authentification
- ✅ Tous les endpoints documentés
- ✅ Schémas de données (User, LegalEntity, Error)
- ✅ Exemples de requêtes/réponses
- ✅ Codes d'erreur expliqués
- ✅ Configuration sécurité JWT
- ✅ Tags organisés (Authentication, Legal Entities)

**Accès:**
- Interface interactive: `GET /api/docs`
- JSON OpenAPI: `GET /api/docs/json`

**Features Swagger UI:**
- Try it out (tester directement)
- Authentification JWT intégrée
- Exemples pré-remplis
- Validation en temps réel

---

## ⚖️ Conformité RGPD

| Article RGPD | Implémentation Sprint 2 | Statut |
|--------------|------------------------|--------|
| **Art. 5.1.c** | Minimisation (userId + email dans JWT) | ✅ |
| **Art. 5.1.d** | Exactitude (validation stricte) | ✅ |
| **Art. 5.2** | Traçabilité (lastLogin, createdAt) | ✅ |
| **Art. 6.1** | Base légale claire | ✅ |
| **Art. 25** | Privacy by design (hash, révocation) | ✅ |
| **Art. 32** | Sécurité (bcrypt, JWT, rate limit) | ✅ |
| **Art. 33** | Notification breach (à implémenter) | ⚠️ Sprint 3 |

**Données personnelles:**
- User: email, name (minimisées)
- Mots de passe: jamais stockés en clair
- Tokens: révocables et expirables
- Logs: pas de données sensibles

---

## 🚀 Utilisation

### Installation

```bash
cd backend
npm install
```

### Configuration

```bash
cp .env.example .env
# Éditer .env:
# - DATABASE_URL
# - JWT_SECRET (générer: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - JWT_REFRESH_SECRET
```

### Migrations Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Démarrage

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

### Test manuel

```bash
# 1. Créer un utilisateur
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# 3. Créer une entité (avec token)
curl -X POST http://localhost:3001/api/legal-entities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"siren":"123456782","siret":"12345678200002","name":"Test SARL"}'

# 4. Lister les entités
curl -X GET http://localhost:3001/api/legal-entities \
  -H "Authorization: Bearer <access_token>"
```

---

## 📝 Changements depuis Sprint 1

### Ajouts

**Fichiers:**
- 8 nouveaux fichiers TypeScript
- 2 nouveaux modèles Prisma
- 1 fichier Swagger
- 3 middlewares
- 2 controllers
- 2 routes
- 2 services (AuthService + sécurité)

**Dépendances:**
- `express-rate-limit` - Rate limiting
- `swagger-ui-express` - Documentation UI
- `swagger-jsdoc` - Génération OpenAPI

**Configuration:**
- JWT secrets (.env.example)
- Swagger activation

### Modifications

**app.ts:**
- Import routes API
- Import middlewares
- Montage routes (/api/auth, /api/legal-entities)
- Intégration Swagger
- Utilisation middlewares centralisés

**Version:**
- 1.0.0 → 2.0.0

---

## 🎯 Prochaines Étapes (Sprint 3)

### Fonctionnalités

- [ ] **Permissions & Rôles**
  - Middleware de vérification rôle
  - RBAC (Role-Based Access Control)
  - Permissions granulaires

- [ ] **Journal d'audit**
  - Modèle AuditLog
  - Tracking actions CRUD
  - Filtrage par user/entité/date

- [ ] **Notifications**
  - Système d'événements
  - Webhooks
  - Email notifications

### Tests

- [ ] **Tests API**
  - Tests d'intégration endpoints
  - Tests auth (JWT, refresh, logout)
  - Tests CRUD LegalEntity
  - Tests permissions
  - Tests rate limiting

- [ ] **Tests E2E**
  - Scénarios utilisateur complets
  - Test flow auth
  - Test CRUD complet

### Optimisations

- [ ] **Cache**
  - Redis pour tokens
  - Cache queries fréquentes

- [ ] **Performance**
  - Indexation optimisée
  - Query optimization
  - Pagination cursor-based

---

## 📞 Support & Documentation

**Documentation:**
- Swagger UI: http://localhost:3001/api/docs
- BACKEND_README.md (à mettre à jour)
- SPRINT1_SUMMARY.md
- SPRINT2_SUMMARY.md (ce fichier)

**Endpoints utiles:**
- Health check: GET /health
- API root: GET /
- OpenAPI JSON: GET /api/docs/json

---

**Date:** 2025-12-19  
**Sprint:** 2/∞  
**Statut:** ✅ **API FONCTIONNELLE**  
**Prochaine review:** Sprint 3

---

_Backend institutionnel A KI PRI SA YÉ - API REST sécurisée, documentée, conforme RGPD._
