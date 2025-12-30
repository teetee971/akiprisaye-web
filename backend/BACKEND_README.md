# Backend Institutionnel - A KI PRI SA YÉ

> Backend Node.js pour la gestion des entreprises et validation SIREN/SIRET  
> Sprint 1 - Issue #3

## 📋 Description

Backend institutionnel conforme aux normes françaises et européennes pour la gestion des entités légales (entreprises). Ce système valide rigoureusement les identifiants SIREN/SIRET selon la législation française et respecte le RGPD.

### Conformité légale

- **Décret n°82-130 du 9 février 1982** : Système SIREN
- **Article R123-220 du Code de commerce** : Système SIRET
- **Règlement (UE) 2016/679 (RGPD)** : Protection des données
- **ISO/IEC 7812-1** : Algorithme de Luhn

## 🚀 Stack Technique

- **Runtime** : Node.js 20+
- **Langage** : TypeScript
- **Framework** : Express
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **Validation** : Zod
- **Tests** : Jest
- **Linting** : ESLint
- **Formatage** : Prettier

## 📦 Installation

### Prérequis

- Node.js >= 20.19.0
- PostgreSQL >= 14
- npm ou yarn

### Installation des dépendances

```bash
cd backend
npm install
```

### Configuration de la base de données

1. Créer une base de données PostgreSQL :

```sql
CREATE DATABASE akiprisaye;
CREATE USER akiprisaye_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE akiprisaye TO akiprisaye_user;
```

2. Copier le fichier d'environnement :

```bash
cp .env.example .env
```

3. Éditer `.env` avec vos paramètres :

```env
DATABASE_URL="postgresql://akiprisaye_user:your_password@localhost:5432/akiprisaye?schema=public"
NODE_ENV="development"
PORT="3001"
```

4. Générer le client Prisma :

```bash
npm run prisma:generate
```

5. Exécuter les migrations :

```bash
npm run prisma:migrate
```

## 🎯 Utilisation

### Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Production

```bash
# Build
npm run build

# Démarrer
npm start
```

### Tests

```bash
# Tests unitaires
npm test

# Mode watch
npm run test:watch

# Couverture de code
npm run test:coverage
```

### Linting et formatage

```bash
# Linter
npm run lint
npm run lint:fix

# Formatage
npm run format
npm run format:check
```

## 📊 Modèle de données

### LegalEntity (Entité Légale)

| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| `id` | UUID | Identifiant unique interne | Primary Key |
| `siren` | String(9) | Numéro SIREN | Unique, Luhn valid |
| `siret` | String(14) | Numéro SIRET | Unique, Luhn valid |
| `name` | String(255) | Raison sociale | Required |
| `status` | Enum | Statut (ACTIVE/CEASED) | Default: ACTIVE |
| `createdAt` | DateTime | Date de création | Auto |
| `updatedAt` | DateTime | Date de mise à jour | Auto |

### Validation SIREN

Le SIREN est un identifiant à **9 chiffres** délivré par l'INSEE :

- ✅ Format : exactement 9 chiffres
- ✅ Validation : Algorithme de Luhn
- ✅ Unicité : Un SIREN par entreprise

**Exemples valides** :
- `732829320` (Facebook France)
- `542065479` (Google France)
- `443061841` (Apple France)

### Validation SIRET

Le SIRET est un identifiant à **14 chiffres** (SIREN + NIC) :

- ✅ Format : exactement 14 chiffres
- ✅ Validation : Algorithme de Luhn
- ✅ Cohérence : Les 9 premiers chiffres = SIREN
- ✅ Unicité : Un SIRET par établissement

**Exemples valides** :
- `73282932000074` (Facebook France - siège)
- `54206547900022` (Google France - siège)
- `44306184100047` (Apple France - siège)

## 🔒 Sécurité et RGPD

### Conformité RGPD

✅ **Article 5** : Principes de traitement
- Licéité, loyauté, transparence
- Limitation des finalités
- Minimisation des données
- Exactitude
- Limitation de la conservation

✅ **Article 25** : Protection des données dès la conception (Privacy by Design)

✅ **Article 32** : Sécurité du traitement

### Base légale

Les numéros SIREN/SIRET sont des **données publiques** (Open Data INSEE) :
- Base légale : Article 6.1.e du RGPD (mission d'intérêt public)
- Source : Répertoire SIRENE (INSEE)

### Mesures de sécurité

- 🔐 Validation stricte des entrées (Zod)
- 🔐 Prepared statements (Prisma)
- 🔐 Headers de sécurité (XSS, CSP, etc.)
- 🔐 CORS configuré strictement
- 🔐 Rate limiting (à activer en production)
- 🔐 Logs d'audit

## 🧪 Tests

### Structure des tests

```
backend/src/
├── validators/
│   ├── __tests__/
│   │   ├── sirenSiretValidator.test.ts    # Tests validation SIREN/SIRET
│   │   └── legalEntitySchemas.test.ts     # Tests schémas Zod
│   ├── sirenSiretValidator.ts
│   └── legalEntitySchemas.ts
```

### Couverture de code

Objectif : **80%** de couverture minimum

```bash
npm run test:coverage
```

Les tests couvrent :
- ✅ Validation SIREN (algorithme de Luhn)
- ✅ Validation SIRET (algorithme de Luhn)
- ✅ Cohérence SIREN ↔ SIRET
- ✅ Schémas Zod (création, mise à jour, recherche)
- ✅ Messages d'erreur explicites
- ✅ Cas limites et sécurité

## 📁 Structure du projet

```
backend/
├── prisma/
│   ├── schema.prisma              # Schéma de base de données
│   └── migrations/                # Migrations SQL
├── src/
│   ├── app.ts                     # Application Express
│   ├── services/
│   │   └── company/
│   │       └── LegalEntityService.ts
│   └── validators/
│       ├── sirenSiretValidator.ts
│       ├── legalEntitySchemas.ts
│       └── __tests__/
├── .env.example                   # Exemple de configuration
├── .prettierrc.json               # Configuration Prettier
├── eslint.config.js               # Configuration ESLint
├── jest.config.js                 # Configuration Jest
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrage en mode développement (watch) |
| `npm run build` | Compilation TypeScript → JavaScript |
| `npm start` | Démarrage en production |
| `npm test` | Exécution des tests |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec couverture de code |
| `npm run lint` | Vérification ESLint |
| `npm run lint:fix` | Correction automatique ESLint |
| `npm run format` | Formatage avec Prettier |
| `npm run format:check` | Vérification du formatage |
| `npm run prisma:generate` | Génération du client Prisma |
| `npm run prisma:migrate` | Création/application des migrations |
| `npm run prisma:studio` | Interface graphique Prisma |

## 🌐 API (Future)

Le backend est **prêt pour l'intégration** mais n'expose **pas encore d'endpoints publics**.

### Endpoints prévus

- `POST /api/v1/companies` - Créer une entreprise
- `GET /api/v1/companies/:id` - Récupérer une entreprise
- `GET /api/v1/companies/siren/:siren` - Recherche par SIREN
- `GET /api/v1/companies/siret/:siret` - Recherche par SIRET
- `PUT /api/v1/companies/:id` - Mettre à jour une entreprise
- `DELETE /api/v1/companies/:id` - Supprimer une entreprise
- `GET /api/v1/companies/stats` - Statistiques

## 📈 Prochaines étapes

### Sprint 2 (à venir)

- [ ] Exposition des endpoints API REST
- [ ] Authentification JWT
- [ ] Rate limiting
- [ ] Documentation Swagger/OpenAPI
- [ ] Intégration API SIRENE (INSEE)
- [ ] Webhooks
- [ ] Monitoring (Prometheus/Grafana)

### Sprint 3 (à venir)

- [ ] Gestion des produits
- [ ] Gestion des prix
- [ ] Gestion des enseignes
- [ ] Relations entre entités

## 🐛 Débogage

### Base de données

```bash
# Accéder à Prisma Studio (interface graphique)
npm run prisma:studio

# Réinitialiser la base de données
npx prisma migrate reset

# Créer une nouvelle migration
npx prisma migrate dev --name ma_migration
```

### Logs

En développement, tous les logs sont activés :
- Requêtes HTTP
- Requêtes SQL (Prisma)
- Erreurs

### Problèmes courants

**Erreur de connexion à la base de données** :
- Vérifier que PostgreSQL est démarré
- Vérifier DATABASE_URL dans .env
- Vérifier les permissions de l'utilisateur

**Tests qui échouent** :
- Vérifier que les dépendances sont installées
- Exécuter `npm run prisma:generate`

## 📞 Support

- **Issues** : https://github.com/teetee971/akiprisaye-web/issues
- **Email DPO** : dpo@akiprisaye.app
- **Documentation** : Ce README

## 📄 Licence

Projet institutionnel A KI PRI SA YÉ

---

**✅ Prêt pour audit institutionnel**  
**✅ Conformité RGPD by design**  
**✅ Code testé et documenté**
