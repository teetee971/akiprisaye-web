# Firebase Authentication & Plan Management - Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  /mon-compte     │        │    /pricing      │              │
│  │                  │        │                  │              │
│  │  - Auth Form     │        │  - Plan Cards    │              │
│  │  - User Info     │        │  - Features      │              │
│  │  - Plan Display  │        │  - Selection     │              │
│  │  - Sign Out      │        │  - Activation    │              │
│  └────────┬─────────┘        └────────┬─────────┘              │
│           │                           │                        │
│           └───────────┬───────────────┘                        │
│                       │                                        │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Components                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AuthForm.jsx                                │  │
│  │  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Google OAuth  │  │ Email/Pass   │  │ Phone/OTP    │  │  │
│  │  └───────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                       │                                        │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase SDK Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              src/lib/firebase.js                           ││
│  │                                                            ││
│  │  export const auth = getAuth(app);                        ││
│  │  export const db = getFirestore(app);                     ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │           src/lib/firestore/plan.js                        ││
│  │                                                            ││
│  │  - getUserPlan(uid)     → Get user's current plan         ││
│  │  - setUserPlan(uid, plan) → Update user's plan            ││
│  └────────────────────────────────────────────────────────────┘│
│                       │                                        │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Backend                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Firebase Authentication Service                   │  │
│  │                                                          │  │
│  │  ✅ Google OAuth Provider                                │  │
│  │  ✅ Email/Password Provider                              │  │
│  │  ✅ Phone/SMS Provider (with reCAPTCHA)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Cloud Firestore Database                          │  │
│  │                                                          │  │
│  │  Collection: users                                       │  │
│  │  {                                                       │  │
│  │    "[uid]": {                                            │  │
│  │      email: string,                                      │  │
│  │      name: string,                                       │  │
│  │      phone: string,                                      │  │
│  │      plan: "freemium" | "premium" | "pro",              │  │
│  │      createdAt: timestamp                                │  │
│  │    }                                                     │  │
│  │  }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Choose Authentication Method               │
│                                             │
│  ┌─────────────┐  ┌─────────────┐         │
│  │   Google    │  │   Email     │         │
│  │   OAuth     │  │  Password   │         │
│  └──────┬──────┘  └──────┬──────┘         │
│         │                │                 │
│         │         ┌──────────────┐         │
│         │         │    Phone     │         │
│         │         │   SMS/OTP    │         │
│         │         └──────┬───────┘         │
└─────────┼────────────────┼─────────────────┘
          │                │
          ▼                ▼
┌──────────────────────────────────────────┐
│     Firebase Authentication Service      │
│                                          │
│  - Validate credentials                  │
│  - Generate auth tokens                  │
│  - Create user session                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│     Create/Update User in Firestore      │
│                                          │
│  - Store user data                       │
│  - Set default plan (freemium)           │
│  - Record creation timestamp             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│     Redirect to Application              │
│                                          │
│  - User authenticated                    │
│  - Session active                        │
│  - Access granted to protected features  │
└──────────────────────────────────────────┘
```

## 💎 Plan Management Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Navigate to /pricing                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Display Available Plans                │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │Freemium │  │ Premium │  │  Pro   │  │
│  │  Free   │  │ 4.99€/mo│  │9.99€/mo│  │
│  └────┬────┘  └────┬────┘  └────┬───┘  │
│       │            │             │      │
└───────┼────────────┼─────────────┼──────┘
        │            │             │
        └────────────┼─────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│  Check Authentication Status            │
│                                         │
│  Is user logged in?                     │
│  ┌───────┐           ┌───────┐          │
│  │  YES  │           │  NO   │          │
│  └───┬───┘           └───┬───┘          │
└──────┼───────────────────┼──────────────┘
       │                   │
       │                   ▼
       │          ┌─────────────────┐
       │          │ Redirect to     │
       │          │ /mon-compte     │
       │          │ (Auth Required) │
       │          └─────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Update Plan in Firestore               │
│                                         │
│  await setUserPlan(uid, selectedPlan)   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Confirm Plan Update                    │
│                                         │
│  - Show success message                 │
│  - Update UI to reflect new plan        │
│  - Enable/disable features accordingly  │
└─────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         Client Side                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  User Action                                                   │
│      │                                                         │
│      ├─► Login with Google ──────────────────┐                │
│      │                                       │                │
│      ├─► Login with Email ────────────────┐  │                │
│      │                                     │  │                │
│      ├─► Login with Phone ──────────┐     │  │                │
│      │                              │     │  │                │
│      └─► Select Plan ─────┐         │     │  │                │
│                            │         │     │  │                │
└────────────────────────────┼─────────┼─────┼──┼────────────────┘
                             │         │     │  │
                             ▼         ▼     ▼  ▼
┌────────────────────────────────────────────────────────────────┐
│                      Firebase SDK (Client)                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  auth.signInWithPopup()                                        │
│  auth.signInWithEmailAndPassword()                             │
│  auth.signInWithPhoneNumber()                                  │
│  setDoc(db, 'users', uid, { plan })                            │
│                                                                │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     Firebase Backend                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │        Authentication Service                        │     │
│  │  - Verify credentials                                │     │
│  │  - Generate JWT tokens                               │     │
│  │  - Manage user sessions                              │     │
│  └──────────────────┬───────────────────────────────────┘     │
│                     │                                          │
│  ┌──────────────────▼───────────────────────────────────┐     │
│  │        Firestore Database                            │     │
│  │  Collection: users/{uid}                             │     │
│  │  - email, name, phone, plan, createdAt               │     │
│  └──────────────────┬───────────────────────────────────┘     │
│                     │                                          │
└─────────────────────┼──────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────────┐
│                  Response to Client                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  - User object with UID                                        │
│  - Authentication state                                        │
│  - User plan data                                              │
│  - Success/Error messages                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 🔒 Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                    Security Layer 1                            │
│                  Environment Variables                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  .env (not committed to git)                                   │
│  ├─ VITE_FIREBASE_API_KEY                                      │
│  ├─ VITE_FIREBASE_AUTH_DOMAIN                                  │
│  ├─ VITE_FIREBASE_PROJECT_ID                                   │
│  └─ ... other Firebase credentials                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Security Layer 2                            │
│                Firebase Authentication                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  - OAuth 2.0 (Google)                                          │
│  - Email verification                                          │
│  - Phone OTP verification                                      │
│  - Session management                                          │
│  - JWT token validation                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Security Layer 3                            │
│                Firestore Security Rules                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  rules_version = '2';                                          │
│  service cloud.firestore {                                     │
│    match /databases/{database}/documents {                     │
│      match /users/{userId} {                                   │
│        allow read, write:                                      │
│          if request.auth != null &&                            │
│             request.auth.uid == userId;                        │
│      }                                                         │
│    }                                                           │
│  }                                                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Security Layer 4                            │
│                    Code Security                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✅ CodeQL Analysis: 0 vulnerabilities                         │
│  ✅ No hardcoded credentials                                   │
│  ✅ Input validation                                           │
│  ✅ Error handling without exposing internals                  │
│  ✅ Secure session management                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 🎯 Component Hierarchy

```
App
│
├─ BrowserRouter
│  │
│  └─ Routes
│     │
│     ├─ Route: /mon-compte
│     │  └─ MonCompte.jsx
│     │     │
│     │     ├─ AuthForm.jsx (if not logged in)
│     │     │  ├─ Google Sign-in Button
│     │     │  ├─ Email/Password Form
│     │     │  └─ Phone/OTP Form
│     │     │
│     │     └─ Account Info (if logged in)
│     │        ├─ User Information
│     │        ├─ Plan Display
│     │        └─ Sign Out Button
│     │
│     └─ Route: /pricing
│        └─ Pricing.jsx
│           ├─ Freemium Plan Card
│           ├─ Premium Plan Card
│           └─ Pro Plan Card
│              └─ Select Plan Button
│                 └─ setUserPlan()
│
└─ Firebase Listeners
   ├─ auth.onAuthStateChanged()
   └─ Firestore real-time updates
```

## 📦 Module Dependencies

```
MonCompte.jsx
  ├─ useState (react)
  ├─ useEffect (react)
  ├─ auth (from @/lib/firebase)
  ├─ signOut (from firebase/auth)
  ├─ getUserPlan (from @/lib/firestore/plan)
  ├─ AuthForm (from @/components/AuthForm)
  └─ Button (from @/components/ui/button)

Pricing.jsx
  ├─ useState (react)
  ├─ useEffect (react)
  ├─ auth (from @/lib/firebase)
  ├─ getUserPlan (from @/lib/firestore/plan)
  ├─ setUserPlan (from @/lib/firestore/plan)
  └─ Button (from @/components/ui/button)

AuthForm.jsx
  ├─ useState (react)
  ├─ GoogleAuthProvider (from firebase/auth)
  ├─ signInWithPopup (from firebase/auth)
  ├─ signInWithEmailAndPassword (from firebase/auth)
  ├─ createUserWithEmailAndPassword (from firebase/auth)
  ├─ RecaptchaVerifier (from firebase/auth)
  ├─ signInWithPhoneNumber (from firebase/auth)
  ├─ auth (from @/lib/firebase)
  ├─ db (from @/lib/firebase)
  ├─ doc (from firebase/firestore)
  ├─ setDoc (from firebase/firestore)
  └─ Button (from @/components/ui/button)

firebase.js
  ├─ initializeApp (from firebase/app)
  ├─ getAuth (from firebase/auth)
  └─ getFirestore (from firebase/firestore)

plan.js
  ├─ db (from @/lib/firebase)
  ├─ doc (from firebase/firestore)
  ├─ setDoc (from firebase/firestore)
  └─ getDoc (from firebase/firestore)
```

## 🌐 Network Flow

```
Client Browser
      │
      │ (1) User visits /mon-compte
      ▼
   React App
      │
      │ (2) Renders MonCompte.jsx
      ▼
   Check Auth State
      │
      ├─ (3a) If logged in ────────────┐
      │                                │
      └─ (3b) If not logged in ────┐   │
                                   │   │
                                   ▼   ▼
                              AuthForm  Display Account
                                   │
                                   │ (4) User submits auth
                                   ▼
                         Firebase Auth Service
                                   │
                                   │ (5) Verify & create session
                                   ▼
                         Firestore Database
                                   │
                                   │ (6) Store/retrieve user data
                                   ▼
                            Update UI
                                   │
                                   │ (7) Show authenticated state
                                   ▼
                         User can now access features
```

---

**Architecture Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Production Ready
