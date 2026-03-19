/**
 * AuthContext barrel
 *
 * Performance note: `useAuth` is exported from the lightweight `authHook.ts`
 * (zero Firebase runtime imports).  Critical-path components (Header,
 * RequireAuth, RequireRole) import directly from `./authHook` to avoid
 * pulling the 485 kB Firebase SDK into the main entry chunk.
 *
 * `AuthProvider` is NOT statically exported here — App.tsx lazy-loads it
 * via `React.lazy(() => import('../contexts/AuthContext'))`.
 */

// Lightweight: context object + hook, zero Firebase runtime code.
export { useAuth, AuthContext } from './authHook';
export type { AuthContextValue } from './authHook';
