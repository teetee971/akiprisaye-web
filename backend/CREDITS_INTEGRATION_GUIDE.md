# Guide d'Intégration - Système de Crédits

## 🎯 Objectif

Ce guide explique comment intégrer le système de crédits avec les systèmes existants d'A KI PRI SA YÉ.

---

## 📦 1. Intégration avec les Contributions

### Signalement Eau

Après qu'un utilisateur soumet un signalement eau:

```typescript
// Dans waterReportController.ts ou service équivalent

import { CreditsService } from '../services/credits/CreditsService';
import { GamificationService } from '../services/credits/GamificationService';

// Après création du signalement
const report = await prisma.waterReport.create({
  data: { ... }
});

// Gagner crédits
const creditsService = new CreditsService(prisma);
await creditsService.earnCredits(
  userId,
  'water_leak_report',  // ou water_status_report, water_quality_report
  report.id,
  {
    hasPhoto: report.photoUrl !== null,
    isDetailed: report.description.length > 100,
    isUrgent: report.severity === 'HIGH'
  }
);

// Vérifier badges
const gamificationService = new GamificationService(prisma, creditsService);
const newBadges = await gamificationService.checkBadgeUnlock(userId);

// Notifier utilisateur
if (newBadges.length > 0) {
  // Envoyer notification badges débloqués
}
```

### Contribution Prix

```typescript
// Dans priceContributionController.ts

const contribution = await prisma.priceContribution.create({
  data: { ... }
});

await creditsService.earnCredits(
  userId,
  'price_contribution',
  contribution.id,
  {
    hasPhoto: contribution.photoUrl !== null,
    isDetailed: contribution.notes !== null
  }
);

await gamificationService.checkBadgeUnlock(userId);
```

---

## 🔔 2. Intégration Notifications

### Créer NotificationService

```typescript
// services/notifications/NotificationService.ts

export class NotificationService {
  async sendCreditsEarned(userId: string, credits: number, type: string) {
    // Email
    await this.sendEmail(userId, {
      subject: `+${credits} crédits gagnés ! 🎉`,
      body: `Merci pour votre contribution: ${type}`
    });
    
    // Push notification (si implémenté)
    await this.sendPush(userId, {
      title: `+${credits} crédits`,
      body: `Contribution: ${type}`,
      data: { type: 'credits_earned', credits }
    });
  }
  
  async sendBadgeUnlocked(userId: string, badge: Badge) {
    await this.sendEmail(userId, {
      subject: `🏆 Badge débloqué: ${badge.name}`,
      body: badge.description
    });
    
    await this.sendPush(userId, {
      title: `🏆 Nouveau badge !`,
      body: `${badge.name}: ${badge.description}`,
      data: { type: 'badge_unlocked', badge: badge.type }
    });
  }
}
```

### Hook dans CreditsService

```typescript
// Modifier CreditsService.earnCredits()

// Après création transaction
const transaction = await this.prisma.creditTransaction.create({ ... });

// Notifier
await this.notificationService.sendCreditsEarned(
  userId,
  amount,
  contributionType
);
```

---

## 💳 3. Intégration Abonnements

### Activer Premium avec Crédits

```typescript
// Dans MarketplaceService.fulfillPurchase()

case 'PREMIUM_SUBSCRIPTION':
  // Activer abonnement
  await subscriptionService.createSubscription(
    purchase.userId,
    'PREMIUM',
    {
      source: 'credits',
      duration: 30,  // jours
      purchaseId: purchase.id
    }
  );
  
  return {
    type: 'premium_subscription',
    message: 'Abonnement Premium activé pour 1 mois',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
```

---

## 📊 4. Dashboard Admin

### Stats Crédits

```typescript
// adminController.ts

export async function getCreditStats(req: Request, res: Response) {
  // Total crédits distribués
  const totalDistributed = await prisma.creditTransaction.aggregate({
    where: { type: 'EARN' },
    _sum: { amount: true }
  });
  
  // Total redemptions
  const totalRedeemed = await prisma.redemption.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { monetaryValue: true }
  });
  
  // Top contributeurs
  const topContributors = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: { type: 'EARN' },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 10
  });
  
  return res.json({
    totalDistributed: totalDistributed._sum.amount || 0,
    totalRedeemed: (totalRedeemed._sum.monetaryValue || 0) / 100,
    topContributors
  });
}
```

### Vérification Manuelle

```typescript
export async function verifyContribution(req: Request, res: Response) {
  const { contributionId } = req.params;
  
  // Marquer contribution comme vérifiée
  const contribution = await prisma.contribution.update({
    where: { id: contributionId },
    data: { verified: true, verifiedBy: req.user.id }
  });
  
  // Bonus crédits pour vérification
  await creditsService.earnCredits(
    contribution.userId,
    'verified_contribution',
    contributionId,
    { verified: true }
  );
  
  return res.json({ success: true });
}
```

---

## 🔐 5. Middleware Authentication

```typescript
// middleware/auth.ts

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Appliquer sur routes credits
import creditsRoutes from './routes/credits';
app.use('/api', requireAuth, creditsRoutes);
```

---

## 📱 6. Frontend Integration

### Hook React pour Balance

```typescript
// hooks/useCredits.ts

import { useState, useEffect } from 'react';

export function useCredits() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchBalance() {
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await response.json();
      setBalance(data);
      setLoading(false);
    }
    
    fetchBalance();
  }, []);
  
  return { balance, loading };
}
```

### Component Badge Display

```tsx
// components/BadgeCard.tsx

export function BadgeCard({ badge }: { badge: UserBadge }) {
  return (
    <div className="badge-card">
      <span className="badge-icon">{badge.badge.icon}</span>
      <h3>{badge.badge.name}</h3>
      <p>{badge.badge.description}</p>
      <span className="badge-rarity">{badge.badge.rarity}</span>
      <time>{new Date(badge.earnedAt).toLocaleDateString()}</time>
    </div>
  );
}
```

---

## 🧪 7. Tests d'Intégration

```typescript
// __tests__/integration/credits.test.ts

describe('Credits Integration', () => {
  it('should earn credits on contribution', async () => {
    // Créer contribution
    const contribution = await createContribution(userId);
    
    // Vérifier crédits gagnés
    const balance = await creditsService.getBalance(userId);
    expect(balance.total).toBeGreaterThan(0);
    
    // Vérifier transaction créée
    const transactions = await creditsService.getTransactionHistory(userId);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe('earn');
  });
  
  it('should unlock badge after threshold', async () => {
    // Créer 50 contributions
    for (let i = 0; i < 50; i++) {
      await createContribution(userId);
    }
    
    // Vérifier badge débloqué
    const badges = await prisma.userBadge.findMany({
      where: { userId }
    });
    
    expect(badges.some(b => b.badgeType === 'WATER_GUARDIAN')).toBe(true);
  });
});
```

---

## 📋 Checklist Intégration

- [ ] Importer CreditsService et GamificationService dans contrôleurs contributions
- [ ] Appeler earnCredits après chaque contribution validée
- [ ] Appeler checkBadgeUnlock après gain de crédits
- [ ] Créer NotificationService et l'intégrer
- [ ] Ajouter middleware auth sur routes /api/credits
- [ ] Implémenter hooks React pour balance et badges
- [ ] Créer composants UI pour affichage crédits/badges
- [ ] Ajouter dashboard admin pour stats et vérifications
- [ ] Tester toutes les intégrations
- [ ] Déployer migration Prisma en production

---

## 🆘 Support

Questions? Consultez:
- [README principal](./CREDITS_SYSTEM_README.md)
- [Documentation API](http://localhost:3000/api-docs)
- [Tests d'exemple](./src/services/credits/__tests__)
