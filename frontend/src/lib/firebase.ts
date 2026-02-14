// src/lib/firebase.ts
// Re-export from centralized Firebase configuration
export {
  app,
  auth,
  db,
  analytics,
  firebaseError,
  hasCriticalFirebaseError,
  isFirebaseReady
} from '../firebase.js';
