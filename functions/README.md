# Firebase Cloud Functions - A KI PRI SA YÉ

This directory contains Firebase Cloud Functions for the A KI PRI SA YÉ platform.

## Prerequisites

```bash
npm install -g firebase-tools
firebase login
```

## Setup

1. **Initialize Firebase Functions** (if not already done):
```bash
firebase init functions
```

2. **Install dependencies**:
```bash
cd functions
npm install firebase-functions firebase-admin luxon
```

3. **Configure environment variables**:
```bash
# Set partner API keys (comma-separated)
firebase functions:config:set partners.keys="KEY1,KEY2,KEY3"

# View current config
firebase functions:config:get
```

## Functions

### 1. Role Management (`roles.js`)

**Purpose**: Manage user roles via Firebase custom claims

**Functions**:
- `setUserRole(uid, role)` - Set user role (admin only)
- `getUserRole(uid)` - Get user role and claims

**Deployment**:
```bash
firebase deploy --only functions:setUserRole,functions:getUserRole
```

**Usage from Frontend**:
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setUserRole = httpsCallable(functions, 'setUserRole');

// Set user as partner
await setUserRole({ uid: 'user123', role: 'partner' });
```

**Valid Roles**:
- `admin` - Full access (dashboard, forecast, user management)
- `partner` - Limited to own baskets
- `editor` - Can add/edit but not delete
- `user` - Public read-only access

---

### 2. Partner Webhook (`partnerWebhook.js`)

**Purpose**: Allow partner stores to push basket updates via API

**Endpoint**: `https://YOUR-PROJECT.cloudfunctions.net/partnerWebhook`

**Deployment**:
```bash
firebase deploy --only functions:partnerWebhook,functions:getPartnerStats
```

**Authentication**: API key in `x-partner-key` header

**Request Example**:
```bash
curl -X POST https://YOUR-PROJECT.cloudfunctions.net/partnerWebhook \
  -H "x-partner-key: YOUR_PARTNER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "store": "Carrefour Destrellan",
    "territory": "Guadeloupe",
    "title": "Panier Fruits Bio",
    "price": 6.50,
    "estimatedValue": 12.00,
    "stock": 15,
    "items": ["bananes", "tomates", "salade"],
    "pickupWindow": "17:00-19:00",
    "lat": 16.262,
    "lon": -61.583,
    "img": "/img/panie-fruits.jpg"
  }'
```

**Response**:
```json
{
  "ok": true,
  "id": "abc123",
  "action": "created",
  "message": "Basket processed successfully"
}
```

---

### 3. AI Dynamic Pricing (`aiDynamicPricing.js`)

**Purpose**: Automatically adjust basket prices based on AI forecast

**Schedule**: Runs every 6 hours (00:00, 06:00, 12:00, 18:00 Guadeloupe time)

**Deployment**:
```bash
firebase deploy --only functions:aiDynamicPricing,functions:triggerAiPricing
```

**Algorithm**:
- Forecast < 3 units → -10% price (clear stock)
- Forecast > 10 units → +5% price (high demand)
- Otherwise → no change

**Manual Trigger** (Admin only):
```javascript
const triggerPricing = httpsCallable(functions, 'triggerAiPricing');
await triggerPricing();
```

**Job Logs**: Stored in `ai_pricing_jobs` collection

---

## Complete Deployment

Deploy all functions at once:
```bash
firebase deploy --only functions
```

## Monitoring

View function logs:
```bash
firebase functions:log
```

Monitor specific function:
```bash
firebase functions:log --only partnerWebhook
```

## Security Rules

Ensure Firestore security rules are configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ti-Panié baskets
    match /ti_panie/{basketId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true ||
         request.auth.token.admin == true);
    }
    
    // User documents
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
        request.auth.token.admin == true;
    }
    
    // Forecast data (read-only for users)
    match /ti_panie_forecast/{forecastId} {
      allow read: if true;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

## Testing

Test functions locally:
```bash
firebase emulators:start --only functions,firestore
```

## Troubleshooting

**Issue**: "Permission denied" when calling functions

**Solution**: Ensure user has correct role in custom claims or Firestore

**Issue**: Partner webhook returns 403

**Solution**: Check that partner key is configured: `firebase functions:config:get partners.keys`

**Issue**: AI pricing not running

**Solution**: Check function logs: `firebase functions:log --only aiDynamicPricing`

## Cost Estimation

- **setUserRole**: ~$0.40 per 1M calls
- **partnerWebhook**: ~$0.40 per 1M calls
- **aiDynamicPricing**: ~$0.10 per month (4 runs/day)

Free tier includes 2M function invocations/month.

## Support

For issues or questions, contact the development team or check Firebase documentation:
https://firebase.google.com/docs/functions
