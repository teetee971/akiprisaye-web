import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const FIREBASE_ENV_KEYS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID'
};

const CRITICAL_FIREBASE_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];
const firebaseConfig = Object.fromEntries(
  Object.entries(FIREBASE_ENV_KEYS).map(([configKey, envKey]) => [configKey, import.meta.env[envKey]])
);

const presentMap = Object.fromEntries(
  Object.entries(firebaseConfig).map(([key, value]) => [key, Boolean(value)])
);

const missingCriticalVars = CRITICAL_FIREBASE_KEYS.filter((key) => !presentMap[key]).map(
  (key) => FIREBASE_ENV_KEYS[key]
);

const measurementIdStatus = presentMap.measurementId ? 'OK' : 'MISSING (OK)';

if (import.meta.env.DEV) {
  console.debug(
    `[firebase-env] apiKey: ${presentMap.apiKey ? 'OK' : 'MISSING'}, authDomain: ${presentMap.authDomain ? 'OK' : 'MISSING'}, projectId: ${presentMap.projectId ? 'OK' : 'MISSING'}, appId: ${presentMap.appId ? 'OK' : 'MISSING'}, measurementId: ${measurementIdStatus}`
  );
}

let app = null;
let auth = null;
let db = null;
let analytics = null;
let firebaseError = null;
let hasCriticalFirebaseError = false;
let isFirebaseReady = false;

if (missingCriticalVars.length > 0) {
  hasCriticalFirebaseError = true;
  firebaseError = `Missing required Firebase environment variables: ${missingCriticalVars.join(', ')}`;
  console.error('Firebase configuration error:', firebaseError);
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseReady = true;

    if (firebaseConfig.measurementId && typeof window !== 'undefined') {
      isSupported()
        .then((supported) => {
          if (supported) {
            analytics = getAnalytics(app);
          } else if (import.meta.env.DEV) {
            console.debug('[firebase] Analytics not supported in this environment.');
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.debug('[firebase] Analytics initialization skipped:', error);
          }
        });
    } else if (import.meta.env.DEV) {
      console.debug('[firebase] Analytics disabled (measurementId not configured).');
    }
  } catch (error) {
    hasCriticalFirebaseError = true;
    firebaseError = error?.message || 'Unknown Firebase initialization error';
    console.error('Firebase initialization failed:', firebaseError);
  }
}

export { app, auth, db, analytics, firebaseError, hasCriticalFirebaseError, isFirebaseReady };
