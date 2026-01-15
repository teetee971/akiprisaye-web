# Android App Setup - A KI PRI SA YÉ

## Overview

This document describes the Android app setup using Capacitor for the civic transparency application.

## Fundamental Principles (NON-NEGOTIABLE)

✅ **Civic information tool** - dedicated to price transparency and understanding
✅ **No commercial transactions** - not a marketplace or shopping app
✅ **Free access to information** - core transparency features always available
✅ **GDPR compliant** - no tracking, no data collection
✅ **Public interest tool** - neutral, institutional, educational

## Architecture

### App Identity

- **Official Name**: A KI PRI SA YÉ
- **Package**: com.akiprisaye.app
- **Platform**: Android
- **Primary Language**: Français
- **Zone**: DOM (Guadeloupe, Martinique, Guyane, Réunion – extensible)

### Positioning

Application citoyenne de transparence des prix et des coûts réels dans les territoires ultramarins.

**What it is:**
- A civic information tool
- A price transparency platform
- An educational resource about price formation

**What it is NOT:**
- Not a marketplace
- Not a shopping app
- Not a payment platform

### Technology Stack

- **Base**: React + Vite + TypeScript
- **Mobile Framework**: Capacitor (converts web app to native Android)
- **Build**: Gradle (Android)

## Project Structure

```
/
├── src/                          # React web app source
│   ├── services/
│   │   ├── platformService.ts    # Platform detection (web/Android)
│   │   └── premiumService.ts     # Premium subscription management
│   ├── hooks/
│   │   └── usePremium.ts         # React hook for premium features
│   └── components/
│       └── PremiumGuard.tsx      # Component to protect premium features
├── android/                      # Android native project (Capacitor)
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/
│   └── build.gradle
├── capacitor.config.ts           # Capacitor configuration
└── dist/                         # Built web app (synced to Android)
```

## Setup Instructions

### 1. Initial Setup (Already Done)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev

# Initialize Capacitor
npx cap init "A KI PRI SA YÉ" "com.akiprisaye.app" --web-dir=dist

# Add Android platform
npx cap add android
```

### 2. Build Web App

```bash
# Build the React app
npm run build

# Sync to Android
npm run cap:sync
```

### 3. Open Android Studio

```bash
# Open Android project in Android Studio
npm run cap:open:android
```

### 4. Configure Android App

**In Android Studio:**

1. Update `android/app/build.gradle`:
   - Set `minSdkVersion` to 22 or higher
   - Set `targetSdkVersion` to 33 or higher
   - Update app version

2. Update `android/app/src/main/AndroidManifest.xml`:
   - Add necessary permissions
   - Configure app metadata

## Premium Features System

### Feature Flags

Premium features are controlled via environment variables and runtime checks:

**Environment Variables** (`.env.example`):
```bash
# Premium Features (disabled by default)
VITE_FEATURE_ADVANCED_HISTORY=false       # 3+ years price history
VITE_FEATURE_MULTI_STORE_COMPARE=false    # Multi-store comparison
VITE_FEATURE_ADVANCED_EXPORT=false        # CSV/PDF export
VITE_FEATURE_PRICE_ALERTS_PREMIUM=false   # Price alerts
VITE_FEATURE_TERRITORIAL_ANALYTICS=false  # Territorial analytics
```

### Subscription Tiers

1. **CITOYEN (Free)** - Always available
   - All essential features
   - Price comparisons
   - Basic history
   - Public data access
   - No payment required

2. **CITOYEN+ (Premium)** - €3.99/month via Google Play
   - All CITOYEN features
   - 3 years price history
   - Multi-store comparison
   - PDF exports

3. **ANALYSE (Premium)** - €9.90/month via Google Play
   - All CITOYEN+ features
   - Extended history
   - CSV exports
   - Price alerts
   - Territorial analytics

### Using Premium Features in Code

#### Check Platform

```typescript
import { isAndroid, isWeb } from '@/services/platformService';

if (isAndroid()) {
  // Android-specific code
}
```

#### Check Premium Status

```typescript
import { usePremium } from '@/hooks/usePremium';

function MyComponent() {
  const { isPremium, hasFeature, loading } = usePremium();

  if (hasFeature('advancedHistory')) {
    // Show premium feature
  }
}
```

#### Protect Premium Features

```tsx
import { PremiumGuard } from '@/components/PremiumGuard';

function AdvancedFeaturePage() {
  return (
    <PremiumGuard feature="advancedHistory">
      <AdvancedHistoryComponent />
    </PremiumGuard>
  );
}
```

## Google Play Billing Integration

### TODO: Next Steps

1. **Add Google Play Billing Plugin**
   ```bash
   npm install @capacitor-community/in-app-purchases
   ```

2. **Configure Products in Google Play Console**
   - Create subscription products
   - Set pricing (€3.99/month, €9.90/month)
   - Configure success/cancel callbacks

3. **Implement Billing Flow**
   - Purchase initiation
   - Subscription verification
   - Status synchronization
   - Restore purchases

4. **Update premiumService.ts**
   - Replace localStorage with Google Play Billing API
   - Implement real subscription checks
   - Handle subscription lifecycle

### Security

- ✅ No secret keys in code
- ✅ Subscription verification via Google Play
- ✅ No payment data stored locally
- ✅ PCI DSS compliant (Google handles payments)

## Development Workflow

### Local Development

```bash
# Start web dev server
npm run dev

# Access at http://localhost:5173
```

### Android Development

```bash
# Build and sync to Android
npm run android:dev

# This will:
# 1. Build the web app (npm run build)
# 2. Sync to Android (cap sync android)
# 3. Open Android Studio (cap open android)
```

### Testing Premium Features

For testing before Google Play Billing integration:

```typescript
import { setSubscriptionStatus, SubscriptionTier, getPremiumFeatures } from '@/services/premiumService';

// Simulate premium subscription
setSubscriptionStatus({
  isActive: true,
  tier: SubscriptionTier.CITOYEN_PLUS,
  features: getPremiumFeatures(SubscriptionTier.CITOYEN_PLUS),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```

## Build for Production

### Web Build

```bash
npm run build
# Output in dist/
```

### Android APK (Debug)

In Android Studio:
1. Build > Generate Signed Bundle / APK
2. Select APK
3. Choose debug or release

### Android App Bundle (Production)

**First time?** Generate your release keystore:
```bash
cd android
./generate-release-keystore.sh
```

See [ANDROID_KEYSTORE_GUIDE.md](./ANDROID_KEYSTORE_GUIDE.md) for detailed instructions.

In Android Studio:
1. Build > Generate Signed Bundle / APK
2. Select Android App Bundle
3. Sign with release keystore (`android/release.jks`)
4. Upload to Google Play Console

## Google Play Console Setup

### 1. Create App

1. Go to Google Play Console
2. Create new app
3. Fill in app details

### 2. Configure In-App Products

1. Monetize > Products > Subscriptions
2. Create subscription products:
   - ID: `citoyen_plus`
   - Price: €3.99/month
   - ID: `analyse`
   - Price: €9.90/month

### 3. Internal Testing

1. Testing > Internal testing
2. Create test track
3. Upload APK/AAB
4. Add testers via email

### 4. Prepare for Production

1. Complete store listing
2. Add screenshots (1080x1920)
3. Add privacy policy URL
4. Complete content rating questionnaire
5. Submit for review

## Guarantees & Compliance

### Code Guarantees

```typescript
// In premiumService.ts
export function hasCitoyenAccess(): boolean {
  return true; // CITOYEN mode is ALWAYS available - NON-NEGOTIABLE
}
```

### Compliance

- ✅ **GDPR**: No user tracking, no data collection
- ✅ **Public Interest**: Neutral observatory tool
- ✅ **Free Access**: CITOYEN mode always free
- ✅ **Transparent Pricing**: Clear subscription tiers
- ✅ **No Dark Patterns**: Optional premium, no pressure
- ✅ **Cancel Anytime**: Google Play manages subscriptions

## Troubleshooting

### Build Issues

**Issue**: `vite: not found`
**Solution**: Run `npm install` first

**Issue**: Android build fails
**Solution**: Check Android Studio SDK installation

### Capacitor Issues

**Issue**: Changes not reflected in Android
**Solution**: Run `npm run cap:sync` after changes

**Issue**: Plugin not found
**Solution**: Ensure plugin is installed and synced

## Support & Documentation

- Capacitor Docs: https://capacitorjs.com/docs
- Google Play Billing: https://developer.android.com/google/play/billing
- React: https://react.dev

## Next Steps

- [ ] Generate release keystore (see [ANDROID_KEYSTORE_GUIDE.md](./ANDROID_KEYSTORE_GUIDE.md))
- [ ] Add Google Play Billing plugin
- [ ] Configure subscription products in Google Play Console
- [ ] Implement real subscription verification
- [ ] Test on physical Android device
- [ ] Prepare for internal testing
- [ ] Submit to Google Play for review
