# Système de Crédits, Analytics & Gamification

## 📋 Vue d'ensemble

Le système de crédits d'A KI PRI SA YÉ récompense les contributeurs pour leur engagement et redistribue équitablement 50% des revenus B2B. Il intègre:

- **Système de crédits**: Gain, dépense, échange
- **Marketplace**: Échange de crédits contre biens/services
- **Gamification**: Badges, leaderboards, progression
- **Analytics Pro**: Analyses avancées pour abonnés Pro/Institutionnel

---

## 💰 Philosophie

> "Les contributeurs créent la valeur → Ils doivent en bénéficier directement"

**Modèle économique**:
- Contributions → Gagner des crédits
- Crédits → Échangeables contre €, abonnements, dons
- 50% revenus B2B → Redistribués aux contributeurs
- Gamification → Engagement communautaire

**Conversion**: 1 crédit = 0.10€

---

## 🎯 Fonctionnalités

### 1. Système de Crédits

#### Gagner des crédits

```typescript
// Montants de base (voir config/creditRules.ts)
price_contribution: 5 crédits
water_leak_report: 10 crédits
verified_contribution: 25 crédits (bonus admin)
referral_signup: 100 crédits
```

#### Multiplicateurs

```typescript
first_contribution_day: 1.5x  // Première contrib du jour
verified_by_admin: 2.0x        // Vérifiée par admin
urgency: 1.5x                  // Contrib pendant crise
quality: 1.3x                  // Contrib détaillée + photo
```

#### API Endpoints

```bash
# Obtenir balance
GET /api/credits/balance

# Gagner des crédits (interne)
POST /api/credits/earn
{
  "contributionType": "price_contribution",
  "contributionId": "contrib-123",
  "metadata": {
    "verified": true,
    "hasPhoto": true
  }
}

# Demander retrait
POST /api/credits/redeem
{
  "amount": 100,
  "method": "bank_transfer",
  "details": {
    "iban": "FR76...",
    "bic": "BNPAFRPP"
  }
}

# Historique
GET /api/credits/transactions?limit=50

# Statistiques
GET /api/credits/stats
```

---

### 2. Marketplace

#### Offres disponibles

- **Premium**: 1 mois gratuit (100 crédits)
- **Donations**: Dons ONG (100 crédits = 10€)
- **Produits partenaires**: Bons d'achat Carrefour, Leclerc (décote 10%)
- **Cash**: Retrait argent (100 crédits = 10€)

#### API Endpoints

```bash
# Lister offres
GET /api/marketplace/offers

# Acheter offre
POST /api/marketplace/purchase
{
  "offerId": "offer-uuid"
}

# Historique achats
GET /api/marketplace/purchases
```

---

### 3. Gamification

#### Badges disponibles

| Badge | Requis | Récompense |
|-------|--------|------------|
| 💧 Gardien de l'Eau | 50 signalements eau | 100 crédits |
| 🎯 Chasseur de Prix | 100 contributions prix | 150 crédits |
| 🌪️ Héros Cyclonique | Checklist + 5 signalements | 250 crédits |
| 💰 Millionnaire Crédits | 1000 crédits gagnés | 200 crédits |
| ❤️ Donateur Généreux | 500 crédits donnés | 300 crédits |
| 👑 Leader Communautaire | 500 contributions | 500 crédits |
| 🌟 Early Adopter | Top 1000 users | 1000 crédits |

#### Niveaux

Formule: `niveau = floor(sqrt(lifetimeCredits / 10)) + 1`

- Niveau 1: 10 crédits
- Niveau 2: 40 crédits
- Niveau 3: 90 crédits
- Niveau 10: 1000 crédits

#### API Endpoints

```bash
# Tous les badges
GET /api/gamification/badges

# Leaderboard
GET /api/gamification/leaderboard?period=MONTH&territory=MARTINIQUE

# Progression utilisateur
GET /api/gamification/progress

# Vérifier nouveaux badges
POST /api/gamification/check-badges

# Mes badges
GET /api/gamification/my-badges
```

---

### 4. Analytics Pro/Institutionnel

**Réservé aux abonnés Pro et Institutionnel**

#### Fonctionnalités

- Vue marché globale par territoire/secteur
- Parts de marché estimées (basé sur mentions)
- Évolution prix temporelle (séries hebdomadaires)
- Sentiment consommateur
- Rapports personnalisés PDF

#### API Endpoints

```bash
# Vue marché
GET /api/analytics/market-overview
{
  "territory": "MARTINIQUE",
  "sector": "alimentation",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31"
}

# Parts de marché
GET /api/analytics/market-share?sector=alimentation&territory=MARTINIQUE

# Évolution prix
GET /api/analytics/price-evolution?category=fruits&territory=MARTINIQUE&period=6

# Rapport personnalisé
POST /api/analytics/custom-report
{
  "title": "Analyse Q1 2026",
  "sections": [
    {
      "type": "market_overview",
      "params": ["MARTINIQUE", "alimentation", {...}]
    }
  ]
}
```

---

## 🗄️ Architecture Base de Données

### Tables principales

```prisma
model CreditTransaction {
  id          String
  userId      String
  type        CreditTransactionType  // EARN, SPEND, REDEEM, BONUS
  amount      Int                    // Positif ou négatif
  source      String                 // JSON
  description String
  balance     Int                    // Balance après transaction
  createdAt   DateTime
}

model CreditBalance {
  userId    String @unique
  total     Int    // Disponible
  pending   Int    // Non vérifié
  lifetime  Int    // Total gagné
  redeemed  Int    // Total retiré
}

model MarketplaceOffer {
  id             String
  type           MarketplaceOfferType
  name           String
  creditCost     Int
  monetaryValue  Int  // En centimes
  available      Boolean
  stock          Int?
}

model UserBadge {
  userId     String
  badgeType  String
  earnedAt   DateTime
}

model LeaderboardEntry {
  userId        String
  territory     Territory?
  period        String
  periodType    LeaderboardPeriod
  rank          Int
  credits       Int
  contributions Int
}
```

---

## 🔧 Utilisation

### Installation

```bash
# Installer dépendances
cd backend
npm install

# Générer client Prisma
npx prisma generate

# Créer migration
npx prisma migrate dev --name add_credits_system

# Seed données initiales
npm run db:seed
```

### Intégration

```typescript
import { PrismaClient } from '@prisma/client';
import { CreditsService } from './services/credits/CreditsService';
import { GamificationService } from './services/credits/GamificationService';

const prisma = new PrismaClient();
const creditsService = new CreditsService(prisma);
const gamificationService = new GamificationService(prisma, creditsService);

// Après une contribution
const transaction = await creditsService.earnCredits(
  userId,
  'price_contribution',
  contributionId,
  { hasPhoto: true, isDetailed: true }
);

// Vérifier badges
const newBadges = await gamificationService.checkBadgeUnlock(userId);

// Envoyer notification
if (newBadges.length > 0) {
  await notificationService.send(userId, {
    type: 'badge_unlocked',
    badges: newBadges
  });
}
```

---

## 🧪 Tests

```bash
# Lancer tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests spécifiques
npm test CreditsService
```

---

## 📊 Monitoring & Métriques

### Indicateurs clés

- **Taux de conversion**: Crédits gagnés → Crédits dépensés
- **Engagement**: Contributions/jour/utilisateur actif
- **Redistribution**: Montant total redistribué/mois
- **Badges**: Taux de déblocage par type
- **Marketplace**: Offres les plus populaires

### Tableaux de bord

```sql
-- Top contributeurs mois
SELECT userId, SUM(amount) as credits
FROM CreditTransaction
WHERE type = 'EARN' AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY userId
ORDER BY credits DESC
LIMIT 100;

-- Redistribution totale
SELECT SUM(monetaryValue) / 100 as total_eur
FROM Redemption
WHERE status = 'COMPLETED';

-- Badges déblocages/jour
SELECT DATE(earnedAt) as date, COUNT(*) as count
FROM UserBadge
GROUP BY DATE(earnedAt)
ORDER BY date DESC;
```

---

## 🔒 Sécurité

### Validations

- ✅ Balance vérifiée avant chaque dépense
- ✅ Transactions atomiques (DB transactions)
- ✅ Montants minimums pour redemption (100 crédits)
- ✅ Audit trail complet (immuable)
- ✅ Validation Zod sur tous les endpoints

### Anti-fraude

- Limite contributions/jour/utilisateur
- Vérification admin pour multiplicateur x2
- Cooldown entre redemptions
- Logs détaillés pour audit

---

## 📖 Documentation API

La documentation Swagger complète est disponible à:
```
http://localhost:3000/api-docs
```

---

## 🚀 Roadmap

### Phase 1 (Actuelle) ✅
- [x] Système crédits de base
- [x] Marketplace simple
- [x] Badges fondamentaux
- [x] Leaderboards

### Phase 2
- [ ] Notifications push
- [ ] Parrainages
- [ ] Streaks quotidiens
- [ ] Analytics temps réel

### Phase 3
- [ ] Produits partenaires réels
- [ ] Intégration Stripe pour redemptions
- [ ] IA sentiment analysis
- [ ] Dashboard admin avancé

---

## 📞 Support

Pour toute question sur le système de crédits:
- 📧 Email: support@akiprisaye.fr
- 📚 Docs: https://docs.akiprisaye.fr/credits
- 💬 Discord: https://discord.gg/akiprisaye

---

## 📜 Licence

Ce système est propriétaire et fait partie intégrante d'A KI PRI SA YÉ.
