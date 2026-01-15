# Capacitor Android Setup - Implementation Checklist

## ✅ Completed

### Phase 1: Capacitor Initialization
- [x] Installed Capacitor dependencies (@capacitor/core, @capacitor/cli, @capacitor/android)
- [x] Initialized Capacitor project (com.akiprisaye.app)
- [x] Added Android platform
- [x] Created capacitor.config.ts
- [x] Generated Android project structure

### Phase 2: Premium Feature System
- [x] Created platform detection service (src/services/platformService.ts)
- [x] Created premium subscription service (src/services/premiumService.ts)
- [x] Created usePremium React hook (src/hooks/usePremium.ts)
- [x] Created PremiumGuard component (src/components/PremiumGuard.tsx)
- [x] Added premium feature flags to .env.example
- [x] Updated .gitignore for Android build files

### Phase 3: Build & Sync
- [x] Updated package.json with Capacitor scripts
- [x] Verified build passes (npm run build ✓)
- [x] Synced to Android platform (npx cap sync android ✓)
- [x] Created comprehensive documentation (ANDROID_SETUP.md)

## 🔄 In Progress / TODO

### Phase 4: Google Play Billing Integration (Next Steps)
- [ ] Install Google Play Billing plugin
  ```bash
  npm install @capacitor-community/in-app-purchases
  ```
- [ ] Configure billing in Android manifest
- [ ] Create subscription products in Google Play Console
- [ ] Implement purchase flow
- [ ] Implement subscription verification
- [ ] Update premiumService.ts to use real billing API
- [ ] Test subscription flow

### Phase 5: Android Configuration
- [ ] Update AndroidManifest.xml with required permissions
- [ ] Configure app icons and splash screen
- [ ] Set up signing configuration for release builds
- [ ] Update app version and build numbers
- [ ] Add privacy policy URL

### Phase 6: Testing
- [ ] Test on physical Android device
- [ ] Test premium feature guards
- [ ] Test subscription flow (when billing is integrated)
- [ ] Test restore purchases
- [ ] Test app lifecycle (background/foreground)

### Phase 7: Google Play Console Setup
- [ ] Create app in Google Play Console
- [ ] Upload app bundle
- [ ] Configure store listing
- [ ] Add screenshots (1080x1920)
- [ ] Complete content rating questionnaire
- [ ] Set up internal testing track
- [ ] Add test users

### Phase 8: Production Preparation
- [ ] Generate signed APK/AAB
- [ ] Test on multiple Android versions
- [ ] Performance optimization
- [ ] Final security review
- [ ] Submit for review

## 📋 Feature Flags Status

### Premium Features (Currently Disabled)
- `VITE_FEATURE_ADVANCED_HISTORY=false` - 3+ years price history
- `VITE_FEATURE_MULTI_STORE_COMPARE=false` - Multi-store comparison
- `VITE_FEATURE_ADVANCED_EXPORT=false` - CSV/PDF exports
- `VITE_FEATURE_PRICE_ALERTS_PREMIUM=false` - Price alerts
- `VITE_FEATURE_TERRITORIAL_ANALYTICS=false` - Territorial analytics

**Note**: Features are disabled by default. They will be enabled when:
1. Running on Android platform (detected via Capacitor)
2. User has active subscription (verified via Google Play Billing)

## 🎯 Subscription Tiers

### CITOYEN (Free) - Always Available
- All essential features
- Price comparisons
- Basic history
- Public data access
- **Status**: Active on web and Android

### CITOYEN+ (€3.99/month) - Android Only
- All CITOYEN features
- 3 years price history
- Multi-store comparison
- PDF exports
- **Status**: Awaiting Google Play Billing integration

### ANALYSE (€9.90/month) - Android Only
- All CITOYEN+ features
- Extended history
- CSV exports
- Price alerts
- Territorial analytics
- **Status**: Awaiting Google Play Billing integration

## 🔐 Security & Compliance

### Guarantees Implemented
- ✅ CITOYEN mode is always free (hardcoded in premiumService.ts)
- ✅ No web payments (platform checks prevent premium on web)
- ✅ Premium only on Android (via isAndroid() checks)
- ✅ No payment data stored locally
- ✅ GDPR compliant (no tracking)

### Code Evidence
```typescript
// In premiumService.ts
export function hasCitoyenAccess(): boolean {
  return true; // CITOYEN mode is ALWAYS available - NON-NEGOTIABLE
}

// On web, always return free tier
if (!isAndroid()) {
  return defaultStatus; // Free tier
}
```

## 📱 Testing Premium Features (Development)

For testing before Google Play Billing integration:

```typescript
import { 
  setSubscriptionStatus, 
  SubscriptionTier, 
  getPremiumFeatures 
} from '@/services/premiumService';

// Simulate CITOYEN+ subscription
setSubscriptionStatus({
  isActive: true,
  tier: SubscriptionTier.CITOYEN_PLUS,
  features: getPremiumFeatures(SubscriptionTier.CITOYEN_PLUS),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});
```

## 🚀 Quick Commands

```bash
# Build web app
npm run build

# Sync to Android
npm run cap:sync

# Build and open Android Studio
npm run android:dev

# Open Android Studio only
npm run cap:open:android
```

## 📖 Documentation

- Main setup guide: `ANDROID_SETUP.md`
- Capacitor docs: https://capacitorjs.com/docs
- Google Play Billing: https://developer.android.com/google/play/billing

## ⚠️ Important Notes

1. **No payments active yet** - Google Play Billing not yet integrated
2. **Web version stays free** - No premium features on web
3. **CITOYEN mode guaranteed free** - Cannot be disabled or blocked
4. **Premium is optional** - All essential features remain free
5. **Android Studio required** - For building and testing APK

## 🎉 Current Status

**Phase 1-3 Complete**: Capacitor initialized, premium system created, build verified
**Next**: Integrate Google Play Billing plugin and configure subscriptions
