# Firebase Authentication Setup Checklist

## Pre-Deployment Checklist

Before deploying your Firebase authentication to production, complete these steps:

### 1. Firebase Console Configuration

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your project: `a-ki-pri-sa-ye`
- [ ] Navigate to **Authentication** → **Sign-in method**

#### Enable Authentication Providers:

- [ ] **Email/Password**
  - Click on "Email/Password" provider
  - Enable "Email/Password"
  - Click Save

- [ ] **Google**
  - Click on "Google" provider
  - Enable Google sign-in
  - Add authorized domains (your deployment domain)
  - Click Save

- [ ] **Phone**
  - Click on "Phone" provider
  - Enable Phone authentication
  - Configure SMS provider (Firebase has built-in SMS)
  - Add test phone numbers for development (optional)
  - Click Save

### 2. Firestore Database Setup

- [ ] Navigate to **Firestore Database**
- [ ] Create database if not exists
- [ ] Start in **production mode** (we'll add rules next)
- [ ] Create a collection called `users` (it will be created automatically on first user sign-up)

#### Configure Security Rules:

- [ ] Click on **Rules** tab
- [ ] Replace with the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read all users (optional, adjust as needed)
    // match /users/{userId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && request.auth.uid == userId;
    // }
  }
}
```

- [ ] Click **Publish** to save the rules

### 3. Environment Variables

#### For Development (.env.local):

- [x] Already configured in `.env.local` (gitignored)

#### For Production Deployment:

Copy the values from `.env.local` and set them in your hosting provider:

**Cloudflare Pages / Vercel / Netlify:**
- [ ] Add the following environment variables:
  ```
  VITE_FIREBASE_API_KEY=AIzaSyBfQGoLoqFqNFMy2uv2JvIPepLtLeBSYU
  VITE_FIREBASE_AUTH_DOMAIN=a-ki-pri-sa-ye.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=a-ki-pri-sa-ye
  VITE_FIREBASE_STORAGE_BUCKET=a-ki-pri-sa-ye.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=187270278809
  VITE_FIREBASE_APP_ID=1:187270278809:android:ad2191f46c07530e5e5e68
  ```

### 4. Authorized Domains

- [ ] Go to **Authentication** → **Settings** → **Authorized domains**
- [ ] Add your production domain (e.g., `akiprisaye.com`, `your-app.pages.dev`)
- [ ] Add localhost for development (should already be there)

### 5. Testing Authentication

After deployment, test each authentication method:

#### Test Email/Password:
- [ ] Go to `/mon-compte` page
- [ ] Create a new account with email and password
- [ ] Sign out
- [ ] Sign in with the same credentials
- [ ] Verify user data appears correctly

#### Test Google OAuth:
- [ ] Go to `/mon-compte` page
- [ ] Click "Se connecter avec Google"
- [ ] Complete Google authentication
- [ ] Verify user data appears correctly

#### Test Phone (SMS):
- [ ] Go to `/mon-compte` page
- [ ] Enter phone number in international format (e.g., +590690000000)
- [ ] Click "Recevoir un code SMS"
- [ ] Enter the OTP code received
- [ ] Click "Vérifier le code"
- [ ] Verify user data appears correctly

### 6. Test Plan Management

- [ ] Sign in with any authentication method
- [ ] Go to `/pricing` page
- [ ] Try switching to "Premium" plan
- [ ] Verify the plan changes in `/mon-compte` page
- [ ] Check Firestore Console to verify the plan is updated in the database

### 7. Monitor and Debug

#### Check Firebase Console:

- [ ] **Authentication** → **Users** tab
  - Verify new users appear after sign-up
  - Check user metadata (creation time, last sign-in)

- [ ] **Firestore Database**
  - Check `/users` collection
  - Verify user documents have correct structure
  - Verify plan values are being saved

#### Browser Console:

- [ ] Open browser developer tools
- [ ] Check for any Firebase errors or warnings
- [ ] Verify no console errors during authentication flow

### 8. Security Hardening (Recommended)

- [ ] Enable **Email Enumeration Protection** in Firebase Auth settings
- [ ] Set up **reCAPTCHA** for phone authentication (already configured as invisible)
- [ ] Review and tighten Firestore security rules for production
- [ ] Set up **App Check** for additional security (optional)
- [ ] Enable **Multi-factor authentication** for admin accounts (optional)

### 9. Optional Enhancements

- [ ] Set up email templates for password reset (Authentication → Templates)
- [ ] Configure custom email sender (Authentication → Settings)
- [ ] Add user profile editing functionality
- [ ] Implement password reset flow
- [ ] Add email verification requirement
- [ ] Set up Firebase Analytics to track authentication events

### 10. Documentation

- [ ] Share `FIREBASE_AUTH_README.md` with your team
- [ ] Document any custom Firestore rules or configurations
- [ ] Update user-facing documentation with authentication instructions

---

## Troubleshooting

### Common Issues:

**Issue**: "Firebase: Error (auth/unauthorized-domain)"
- **Solution**: Add your domain to authorized domains in Firebase Console

**Issue**: Phone authentication not working
- **Solution**: Ensure reCAPTCHA is not blocked by ad blockers, check SMS quota in Firebase

**Issue**: "Permission denied" in Firestore
- **Solution**: Verify security rules allow the authenticated user to access their document

**Issue**: Environment variables not loading
- **Solution**: Ensure `.env.local` exists locally, or environment variables are set in hosting provider

---

## Success Criteria

✅ Users can sign up/sign in with all three methods
✅ User data is correctly stored in Firestore
✅ Plan changes are reflected in the database
✅ No security vulnerabilities or console errors
✅ Authentication state persists across page refreshes

---

## Support

For issues or questions:
1. Check `FIREBASE_AUTH_README.md` for usage examples
2. Review Firebase documentation: https://firebase.google.com/docs/auth
3. Check implementation in `IMPLEMENTATION_SUMMARY_AUTH.md`
