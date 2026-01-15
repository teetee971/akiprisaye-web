# Système d'Abonnements & Paiements - A KI PRI SA YÉ

## 📋 Vue d'ensemble

Infrastructure de monétisation éthique avec 6 tiers d'abonnement, intégration Stripe, et gestion automatique des paiements.

## 🎯 Principes Éthiques

✅ **Transparent** : Prix clairs, pas de frais cachés  
✅ **Équitable** : Ceux qui bénéficient économiquement paient  
✅ **Flexible** : Annulation facile, pas d'engagement  
✅ **Sécurisé** : Paiements Stripe PCI-DSS compliant  

## 💰 Plans Tarifaires

### 1. FREE (Gratuit)
- **Prix** : 0€
- **Public** : Citoyens ultramarins
- **Features** : Accès comparateurs, contributions, 3 alertes, 5 exports/mois

### 2. CITIZEN_PREMIUM (4.99€/mois)
- **Prix** : 4.99€/mois ou 49.90€/an (~4.16€/mois)
- **Trial** : 14 jours gratuits
- **Features** : 20 alertes, 50 exports/mois, analytics, alertes SMS, sans pub

### 3. SME_FREEMIUM (29€/mois)
- **Prix** : 29€/mois ou 290€/an (~24€/mois)
- **Public** : PME locales
- **Features** : 50 alertes, 200 exports/mois, profil entreprise, mise en avant, 3 utilisateurs

### 4. BUSINESS_PRO (299€/mois) - Recommandé
- **Prix** : 299€/mois ou 2990€/an (~249€/mois)
- **Public** : Grandes entreprises
- **Features** : Alertes & exports illimités, webhooks, analytics avancés, 10 utilisateurs

### 5. INSTITUTIONAL (1500€/mois)
- **Prix** : 1500€/mois ou 15000€/an (~1250€/mois)
- **Public** : Collectivités, organismes publics
- **Features** : Accès complet, support dédié, utilisateurs illimités, white-label

### 6. RESEARCH (Sur devis)
- **Prix** : Sur devis
- **Public** : Recherche académique
- **Features** : Accès données, exports illimités, historique complet

## 🔧 Configuration

### 1. Variables d'environnement

Créer un fichier `.env` basé sur `.env.example` :

```bash
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Products
STRIPE_PRODUCT_CITIZEN_PREMIUM="prod_..."
STRIPE_PRODUCT_SME="prod_..."
STRIPE_PRODUCT_BUSINESS="prod_..."
STRIPE_PRODUCT_INSTITUTIONAL="prod_..."

# Stripe Prices
STRIPE_PRICE_CITIZEN_PREMIUM="price_..."
STRIPE_PRICE_SME="price_..."
STRIPE_PRICE_BUSINESS="price_..."
STRIPE_PRICE_INSTITUTIONAL="price_..."
```

### 2. Créer les produits Stripe

1. Connectez-vous au [Stripe Dashboard](https://dashboard.stripe.com/)
2. Allez dans **Products** > **Add Product**
3. Créez les produits pour chaque tier (CITIZEN_PREMIUM, SME, BUSINESS, INSTITUTIONAL)
4. Créez les prix mensuels et annuels pour chaque produit
5. Copiez les IDs dans le fichier `.env`

### 3. Configurer les webhooks Stripe

1. Allez dans **Developers** > **Webhooks** > **Add endpoint**
2. URL du endpoint : `https://votre-domaine.com/api/subscriptions/webhook`
3. Events à écouter :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copiez le **Signing secret** dans `STRIPE_WEBHOOK_SECRET`

### 4. Migration de la base de données

```bash
cd backend
npx prisma migrate dev --name add-stripe-customer-id
npx prisma generate
```

## 📡 API Endpoints

### GET /api/subscriptions/plans
Récupérer tous les plans d'abonnement disponibles.

**Réponse** :
```json
{
  "success": true,
  "plans": [
    {
      "id": "free",
      "name": "Gratuit",
      "tagline": "Pour tous les citoyens ultramarins",
      "pricing": {
        "monthly": 0,
        "yearly": 0,
        "currency": "EUR"
      },
      "features": { ... }
    },
    ...
  ]
}
```

### POST /api/subscriptions
Créer un nouvel abonnement.

**Body** :
```json
{
  "userId": "uuid",
  "planId": "citizen_premium",
  "paymentMethodId": "pm_...",
  "interval": "month"
}
```

**Réponse** :
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "userId": "uuid",
    "planId": "citizen_premium",
    "status": "trialing",
    "currentPeriodStart": "2024-01-14T10:00:00Z",
    "currentPeriodEnd": "2024-02-14T10:00:00Z",
    "trialEnd": "2024-01-28T10:00:00Z"
  }
}
```

### GET /api/subscriptions/:userId
Récupérer l'abonnement actif d'un utilisateur.

**Réponse** :
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "planId": "citizen_premium",
    "status": "active",
    ...
  }
}
```

### POST /api/subscriptions/:userId/check-feature
Vérifier l'accès à une fonctionnalité.

**Body** :
```json
{
  "feature": "advancedAlerts"
}
```

**Réponse** :
```json
{
  "success": true,
  "hasAccess": true,
  "feature": "advancedAlerts"
}
```

### POST /api/subscriptions/webhook
Endpoint pour les webhooks Stripe (usage interne uniquement).

## 🧪 Tests

### Test avec Stripe Test Mode

Utiliser les cartes de test Stripe :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`

Date d'expiration : n'importe quelle date future  
CVC : n'importe quel code à 3 chiffres

### Tester les webhooks localement

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:3001/api/subscriptions/webhook

# Dans un autre terminal
stripe trigger customer.subscription.created
```

## 📊 Matrice des fonctionnalités

| Feature | FREE | CITIZEN+ | SME | BUSINESS | INSTITUTION | RESEARCH |
|---------|------|----------|-----|----------|-------------|----------|
| Comparateurs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| API Access | ❌ | ✅ (1K/j) | ✅ (5K/j) | ✅ (50K/j) | ✅ (500K/j) | ✅ (100K/j) |
| Alertes | 3 | 20 | 50 | ♾️ | ♾️ | 10 |
| Exports | 5 | 50 | 200 | ♾️ | ♾️ | ♾️ |
| Analytics | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Support | Community | Email 24h | Priority 4h | Priority 2h | Dedicated 1h | Email 24h |

## 🔐 Sécurité

- Tous les paiements sont traités par Stripe (PCI-DSS Level 1 compliant)
- Les webhooks sont vérifiés avec la signature Stripe
- Les mots de passe et tokens sont hashés avec bcrypt
- Les données utilisateur sont minimales (RGPD compliant)
- Aucune donnée de carte bancaire n'est stockée

## 📈 Revenus estimés (Année 1)

- 1000 utilisateurs CITIZEN_PREMIUM : 59K€/an
- 50 PME : 17K€/an
- 10 entreprises BUSINESS : 36K€/an
- 5 institutions : 90K€/an

**Total estimé** : 200-400K€

## 🚀 Déploiement

### Production Checklist

- [ ] Configurer les vrais produits Stripe (pas test mode)
- [ ] Mettre à jour les variables d'environnement avec les clés de production
- [ ] Configurer les webhooks pour l'URL de production
- [ ] Exécuter les migrations de base de données
- [ ] Tester les flux de paiement end-to-end
- [ ] Configurer la surveillance des erreurs (Sentry, etc.)
- [ ] Mettre en place les notifications par email
- [ ] Documenter le processus de support client

## 📞 Support

Pour toute question sur le système d'abonnement :
- Email : support@akiprisaye.app
- Documentation : https://docs.akiprisaye.app/subscriptions
- Issues GitHub : https://github.com/teetee971/akiprisaye-web/issues
