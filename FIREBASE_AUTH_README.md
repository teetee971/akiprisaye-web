# Firebase Authentication & Plan Management

This project now includes complete Firebase authentication with plan management (Freemium/Premium/Pro).

## Setup

### 1. Firebase Prerequisites

In your Firebase Console, make sure you have enabled:

- ✅ Email & Password authentication
- ✅ Google authentication
- ✅ Phone (SMS) authentication

### 2. Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase credentials in `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 3. Files Added

- **`src/lib/firebase.ts`** - Firebase initialization with Auth and Firestore
- **`src/lib/firestore/plan.ts`** - User plan management functions
- **`src/components/AuthForm.tsx`** - Authentication form component
- **`src/components/ui/button.tsx`** - Reusable button component
- **`src/pages/MonCompte.tsx`** - Account page with auth and plan management
- **`src/types/global.d.ts`** - TypeScript declarations

## Features

### Authentication Methods

1. **Google OAuth** - One-click sign in with Google popup
2. **Email/Password** - Traditional email/password authentication with signup
3. **Phone (SMS)** - OTP verification with invisible reCAPTCHA

### Plan Management

Three tiers available:

- **Freemium** - Basic features (default)
- **Premium** - Advanced features with unlimited history
- **Pro** - All features with API access and priority support

### User Data Structure

Data stored in Firestore `/users/{uid}`:

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "phone": "+590690000000",
  "plan": "premium",
  "createdAt": "2025-11-10T00:00:00Z"
}
```

## Usage

### Authentication Flow

Users can:
1. Visit `/mon-compte` or click "Mon Compte" in the navigation
2. Sign in using Google, Email/Password, or Phone
3. View their account information and current plan
4. Switch between Freemium/Premium/Pro plans
5. Sign out

### Integration Example

To use authentication and plan checking in your components:

```typescript
import { auth } from "@/lib/firebase";
import { getUserPlan, setUserPlan } from "@/lib/firestore/plan";
import { onAuthStateChanged } from "firebase/auth";

// Check current user
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const plan = await getUserPlan(user.uid);
    console.log(`User plan: ${plan}`);
  }
});

// Change user plan
const handleUpgrade = async () => {
  const user = auth.currentUser;
  if (user) {
    await setUserPlan(user.uid, "premium");
  }
};
```

## Security

- Firebase credentials are stored in environment variables (`.env.local`)
- `.env.local` is gitignored to prevent credential leaks
- Authentication state is managed by Firebase Auth
- Firestore rules should be configured to protect user data

## Mobile Support

- All components are responsive and mobile-friendly
- Phone authentication works on mobile devices
- PWA compatible with dark theme support
