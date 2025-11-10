# Firebase Authentication & Plan Management

This document describes the Firebase authentication and plan management system integrated into the application.

## 🔑 Features

### Authentication Methods
- ✅ **Google OAuth** - Sign in with Google account
- ✅ **Email/Password** - Traditional email and password authentication
- ✅ **Phone (SMS)** - Phone number authentication with OTP verification

### Plan Management
- 🆓 **Freemium** - Free tier with basic features
- 💎 **Premium** - Enhanced features for 4.99€/month
- 🚀 **Pro** - All features for 9.99€/month

## 📦 Setup Instructions

### 1. Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following authentication methods in **Authentication > Sign-in method**:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Phone (requires configuration of reCAPTCHA)

### 2. Environment Variables

Create a `.env` file at the root of the project with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can find these values in your Firebase project settings under:
**Project Settings > General > Your apps > SDK setup and configuration**

### 3. Firestore Database Setup

1. Go to **Firestore Database** in Firebase Console
2. Create a new database (start in production mode or test mode)
3. The application will automatically create a `users` collection with the following structure:

```javascript
{
  "users": {
    "uid_example": {
      "email": "user@example.com",
      "name": "User Name",
      "phone": "+590XXXXXXXXX",
      "plan": "freemium", // or "premium" or "pro"
      "createdAt": "2025-11-10T00:00:00Z"
    }
  }
}
```

### 4. Firestore Security Rules

Add the following security rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read and write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧩 Architecture

### Files Structure

```
src/
├── lib/
│   ├── firebase.js              # Firebase initialization
│   └── firestore/
│       └── plan.js              # Plan management utilities
├── components/
│   └── AuthForm.jsx             # Authentication form component
└── pages/
    ├── MonCompte.jsx            # Account management page
    └── Pricing.jsx              # Pricing and plan selection page
```

### Key Components

#### `src/lib/firebase.js`
Initializes Firebase app with configuration from environment variables and exports:
- `auth` - Firebase Authentication instance
- `db` - Firestore Database instance

#### `src/lib/firestore/plan.js`
Provides utilities for plan management:
- `getUserPlan(uid)` - Get user's current plan
- `setUserPlan(uid, plan)` - Update user's plan

#### `src/components/AuthForm.jsx`
Full-featured authentication form with:
- Google sign-in button
- Email/password authentication (login & signup)
- Phone number authentication with OTP
- Mode switching between login and signup

#### `src/pages/MonCompte.jsx`
Account management page that shows:
- User information (email, name, phone, UID)
- Current subscription plan
- Sign out functionality
- Link to pricing page
- Authentication form for non-logged users

#### `src/pages/Pricing.jsx`
Pricing page with:
- Three plan tiers (Freemium, Premium, Pro)
- Plan features comparison
- Plan selection and activation
- Current plan indicator

## 🚀 Usage

### Adding Authentication to a Page

```javascript
import { auth } from '../lib/firebase';
import { useEffect, useState } from 'react';

function MyPage() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  
  return (
    <div>
      {user ? (
        <p>Welcome {user.email}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Checking User Plan

```javascript
import { getUserPlan } from '../lib/firestore/plan';
import { auth } from '../lib/firebase';

const checkUserPlan = async () => {
  const user = auth.currentUser;
  if (user) {
    const plan = await getUserPlan(user.uid);
    console.log('User plan:', plan); // "freemium", "premium", or "pro"
  }
};
```

### Updating User Plan

```javascript
import { setUserPlan } from '../lib/firestore/plan';
import { auth } from '../lib/firebase';

const upgradeToPremium = async () => {
  const user = auth.currentUser;
  if (user) {
    await setUserPlan(user.uid, 'premium');
    alert('Plan upgraded to Premium!');
  }
};
```

## 🔒 Security Considerations

1. **Never commit `.env` files** - The `.env` file is already in `.gitignore`
2. **Use Firestore Security Rules** - Ensure users can only access their own data
3. **Validate on backend** - For production, implement server-side validation for plan changes
4. **Phone Authentication** - Requires reCAPTCHA configuration in Firebase Console

## 📱 Routes

- `/mon-compte` - Account management and authentication
- `/pricing` - View and select subscription plans

## 🧪 Testing

To test the authentication system:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/mon-compte` to test authentication

3. Sign in using one of the methods:
   - Google (requires Google account)
   - Email/Password (creates new account on signup)
   - Phone (requires valid phone number with country code, e.g., +590XXXXXXXXX)

4. Check Firestore Console to verify user data is saved

5. Navigate to `/pricing` to test plan selection

## 🛠️ Troubleshooting

### reCAPTCHA Issues
If phone authentication fails, ensure:
1. reCAPTCHA is enabled in Firebase Console
2. Your domain is authorized in Firebase Console
3. Check browser console for specific error messages

### Authentication Errors
- Check that all Firebase environment variables are set correctly
- Verify authentication methods are enabled in Firebase Console
- Check browser console for detailed error messages

### Plan Not Updating
- Ensure Firestore security rules allow write access for authenticated users
- Check that user is logged in before updating plan
- Verify Firestore database is properly configured

## 📚 Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Firebase Guide](https://firebase.google.com/docs/web/setup)
