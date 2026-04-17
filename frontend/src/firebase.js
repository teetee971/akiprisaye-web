// Single source of truth for Firebase — all consumers should import from here
// or from @/lib/firebase directly.
export {
  app,
  auth,
  db,
  firebaseError,
  firebaseConfig,
  missingCriticalEnvKeys,
} from './lib/firebase';
