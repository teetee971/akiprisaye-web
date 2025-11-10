# Quick Start: Firebase Authentication & Plan Management

This guide will help you get started with the Firebase authentication system in under 5 minutes.

## 🚀 Quick Setup

### Step 1: Firebase Configuration (2 minutes)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials in `.env`:
   - Get them from [Firebase Console](https://console.firebase.google.com/) → Your Project → Settings → General

### Step 2: Enable Authentication Methods (2 minutes)

In Firebase Console → Authentication → Sign-in method, enable:
- ✅ Google
- ✅ Email/Password  
- ✅ Phone

### Step 3: Create Firestore Database (1 minute)

1. Go to Firestore Database in Firebase Console
2. Click "Create database"
3. Start in test mode (or production mode if you add security rules)

### Step 4: Test It! (1 minute)

```bash
npm run dev
```

Navigate to `http://localhost:3000/mon-compte` and try logging in!

## 📖 Common Use Cases

### Check if User is Logged In

```javascript
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);
  
  return user ? <LoggedIn user={user} /> : <Login />;
}
```

### Get User's Plan

```javascript
import { getUserPlan } from '@/lib/firestore/plan';
import { auth } from '@/lib/firebase';

const MyComponent = () => {
  const [plan, setPlan] = useState('freemium');
  
  useEffect(() => {
    if (auth.currentUser) {
      getUserPlan(auth.currentUser.uid).then(setPlan);
    }
  }, []);
  
  return <div>Your plan: {plan}</div>;
};
```

### Require Authentication

```javascript
import { auth } from '@/lib/firebase';
import { useEffect } from 'react';

function ProtectedPage() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = '/mon-compte';
      }
    });
    return () => unsubscribe();
  }, []);
  
  return <div>Protected content</div>;
}
```

### Restrict by Plan

```javascript
import { getUserPlan } from '@/lib/firestore/plan';
import { auth } from '@/lib/firebase';

function PremiumFeature() {
  const [canAccess, setCanAccess] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (auth.currentUser) {
        const plan = await getUserPlan(auth.currentUser.uid);
        setCanAccess(plan === 'premium' || plan === 'pro');
      }
    };
    checkAccess();
  }, []);
  
  return canAccess ? (
    <PremiumContent />
  ) : (
    <div>
      <p>This feature requires Premium</p>
      <a href="/pricing">Upgrade Now</a>
    </div>
  );
}
```

## 🔐 Production Security Rules

Add these to Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🆘 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
→ Check your `.env` file has all required variables

### "Missing or insufficient permissions"
→ Add Firestore security rules (see above)

### Phone auth not working
→ Enable reCAPTCHA in Firebase Console and add your domain

### "Module not found: Can't resolve '@/lib/firebase'"
→ Make sure vite.config.js has the path alias configured

## 📚 Full Documentation

See [FIREBASE_AUTH_SETUP.md](./FIREBASE_AUTH_SETUP.md) for complete documentation.

## 🎯 Next Steps

1. **Add payment processing** - Integrate Stripe/PayPal for Premium/Pro plans
2. **Email verification** - Require email verification for new accounts
3. **Password reset** - Add "Forgot Password" functionality
4. **Social auth** - Add Facebook, Twitter, GitHub login
5. **User profiles** - Extend user data with profile pictures, preferences, etc.

## 💡 Tips

- Always check `auth.currentUser` before accessing user data
- Use `onAuthStateChanged` to react to authentication changes
- Store sensitive data in environment variables
- Test with different authentication methods
- Implement proper error handling for auth failures

Happy coding! 🎉
