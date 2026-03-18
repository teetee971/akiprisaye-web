/**
 * creatorGuard.test.tsx
 *
 * Tests for the creator route guard in EspaceCreateur.
 *
 * Covered scenarios:
 *  1. Shows a loading spinner while auth is bootstrapping (prevents premature redirect)
 *  2. Redirects to / when user is authenticated but has no creator/admin role
 *  3. Renders the creator dashboard when the user has the "creator" role
 *  4. Renders the creator dashboard when the user has the "admin" role (isAdmin=true)
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

/* ── Firebase / lib mocks ──────────────────────────────────────────────── */
vi.mock('../lib/firebase', () => ({
  firebaseError: null,
  db: null,
  missingCriticalEnvKeys: [],
  wrongApiKeyDetected: false,
}));

vi.mock('../lib/authMessages', () => ({
  FIREBASE_UNAVAILABLE_MESSAGE: 'Firebase indisponible',
  getAuthErrorMessage: (err: unknown) => String(err),
}));

/* ── Logger mock ───────────────────────────────────────────────────────── */
vi.mock('../utils/logger', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

/* ── react-helmet-async mock ───────────────────────────────────────────── */
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/* ── billing/plans mock ────────────────────────────────────────────────── */
vi.mock('../billing/plans', () => ({
  PLAN_DEFINITIONS: {
    CREATOR: {
      id: 'CREATOR',
      name: 'Créateur',
      quotas: {},
      features: [],
    },
  },
}));

/* ── Auth context mock factory ─────────────────────────────────────────── */
function makeAuthMock(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    userRole: 'guest',
    loading: false,
    error: null,
    authResolved: true,
    authFlowState: 'idle' as const,
    lastIncident: null,
    isAuthenticated: false,
    displayName: null,
    email: null,
    isGuest: true,
    isCitoyen: false,
    isObservateur: false,
    isAdmin: false,
    isCreator: false,
    clearError: vi.fn(),
    clearAuthIncident: vi.fn(),
    signUpEmailPassword: vi.fn(),
    signInEmailPassword: vi.fn(),
    signInGooglePopup: vi.fn(),
    signInGoogleRedirect: vi.fn(),
    signInFacebookPopup: vi.fn(),
    signInFacebookRedirect: vi.fn(),
    signInApplePopup: vi.fn(),
    signInAppleRedirect: vi.fn(),
    signOutUser: vi.fn(),
    ...overrides,
  };
}

/* ── Mock useAuth ──────────────────────────────────────────────────────── */
let authState = makeAuthMock();

// EspaceCreateur imports from '../contexts/AuthContext' (with 's')
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));
// Some components import from '../context/AuthContext' (without 's')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

/* ───────────────────────────────────────────────────────────────────────── */

import EspaceCreateur from '../pages/EspaceCreateur';

/* Helper that renders EspaceCreateur with a "home" fallback to detect redirects */
function renderCreateur() {
  return render(
    <MemoryRouter initialEntries={['/espace-createur']}>
      <Routes>
        <Route path="/espace-createur" element={<EspaceCreateur />} />
        <Route path="/" element={<div data-testid="home-page">Accueil</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * EspaceCreateur — creator guard
 * ════════════════════════════════════════════════════════════════════════ */

describe('EspaceCreateur creator guard', () => {
  beforeEach(() => {
    authState = makeAuthMock();
  });

  it('shows a loading spinner while auth is bootstrapping (no premature redirect)', () => {
    authState = makeAuthMock({
      loading: true,
      authFlowState: 'resolving',
      authResolved: false,
      user: null,
      isAdmin: false,
      isCreator: false,
    });

    renderCreateur();

    // The spinner must be present — the component must NOT redirect to / yet
    expect(screen.getByTestId('auth-loading-spinner')).toBeTruthy();
    // The home page must NOT have been rendered (no redirect happened)
    expect(screen.queryByTestId('home-page')).toBeNull();
  });

  it('redirects to / when the authenticated user has no admin/creator role', () => {
    const fakeUser = { uid: 'u1', email: 'citoyen@example.com', displayName: 'Citoyen', photoURL: null };
    authState = makeAuthMock({
      loading: false,
      authResolved: true,
      user: fakeUser,
      userRole: 'citoyen',
      isGuest: false,
      isCitoyen: true,
      isAuthenticated: true,
      email: fakeUser.email,
      displayName: fakeUser.displayName,
      isAdmin: false,
      isCreator: false,
    });

    renderCreateur();

    // Should have been redirected to /
    expect(screen.getByTestId('home-page')).toBeTruthy();
  });

  it('renders the creator dashboard when the user has the "creator" role', () => {
    const fakeUser = { uid: 'creator-uid', email: 'creator@example.com', displayName: 'Créateur', photoURL: null };
    authState = makeAuthMock({
      loading: false,
      authResolved: true,
      user: fakeUser,
      userRole: 'creator',
      isGuest: false,
      isAuthenticated: true,
      email: fakeUser.email,
      displayName: fakeUser.displayName,
      isAdmin: true,
      isCreator: true,
    });

    renderCreateur();

    // The creator dashboard heading is rendered — no redirect occurred
    expect(screen.queryByTestId('home-page')).toBeNull();
    expect(screen.getByRole('heading', { name: /Espace Créateur/i })).toBeTruthy();
  });

  it('renders the creator dashboard when the user has the "admin" role (isAdmin=true)', () => {
    const fakeUser = { uid: 'admin-uid', email: 'admin@example.com', displayName: 'Admin', photoURL: null };
    authState = makeAuthMock({
      loading: false,
      authResolved: true,
      user: fakeUser,
      userRole: 'admin',
      isGuest: false,
      isAuthenticated: true,
      email: fakeUser.email,
      displayName: fakeUser.displayName,
      isAdmin: true,
      isCreator: false,
    });

    renderCreateur();

    // Admin users can also access the creator space
    expect(screen.queryByTestId('home-page')).toBeNull();
    expect(screen.getByRole('heading', { name: /Espace Créateur/i })).toBeTruthy();
  });
});
