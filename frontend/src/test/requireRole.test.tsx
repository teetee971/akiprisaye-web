/**
 * requireRole.test.tsx
 *
 * Tests for RequireRole, RequireCreator, and RequireAdmin guard components.
 *
 * Covered scenarios:
 *  1. RequireRole shows loading spinner while auth is bootstrapping
 *  2. RequireRole redirects to /login when user is not authenticated
 *  3. RequireRole redirects when role is insufficient
 *  4. RequireRole grants access when role is sufficient
 *  5. RequireCreator allows creator and admin
 *  6. RequireCreator blocks citoyen/guest
 *  7. RequireAdmin allows only admin
 *  8. RequireAdmin blocks creator/citoyen/guest
 */
/* eslint-disable jsx-a11y/aria-role -- "role" is a custom RequireRole/RequireCreator/RequireAdmin prop, not an ARIA attribute */

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

/* ── Auth context mock ─────────────────────────────────────────────────── */
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
    refreshClaims: vi.fn(),
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

let authState = makeAuthMock();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));
// authHook.ts is the new lightweight module used by RequireRole/RequireAuth
vi.mock('../context/authHook', () => ({
  useAuth: () => authState,
  AuthContext: { _currentValue: undefined },
}));

/* ── Import guard components after mocks ─────────────────────────────── */
import RequireRole from '../components/auth/RequireRole';
import RequireCreator from '../components/auth/RequireCreator';
import RequireAdmin from '../components/auth/RequireAdmin';

/* ── Helpers ───────────────────────────────────────────────────────────── */
const fakeUser = { uid: 'u1', email: 'user@test.com', displayName: 'Test', photoURL: null };

function renderWithRole(element: JSX.Element, initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/" element={<div data-testid="home-page">Accueil</div>} />
        <Route path="/login" element={<div data-testid="login-page">Connexion</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ── RequireRole ────────────────────────────────────────────────────────────

describe('RequireRole', () => {
  beforeEach(() => {
    authState = makeAuthMock();
  });

  it('shows loading spinner while auth is bootstrapping', () => {
    authState = makeAuthMock({ loading: true, authResolved: false });

    renderWithRole(
      <RequireRole role="creator">
        <div data-testid="protected-content">Contenu protégé</div>
      </RequireRole>
    );

    expect(screen.getByTestId('auth-loading-spinner')).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('shows loading spinner when loading=false but authResolved=false (race guard)', () => {
    // Edge case: loading flipped to false before auth was fully settled
    authState = makeAuthMock({ loading: false, authResolved: false, user: null });

    renderWithRole(
      <RequireRole role="creator">
        <div data-testid="protected-content">Contenu protégé</div>
      </RequireRole>
    );

    // Must NOT redirect prematurely — show spinner instead
    expect(screen.getByTestId('auth-loading-spinner')).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).toBeNull();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('redirects to /login when user is not authenticated', () => {
    authState = makeAuthMock({ loading: false, user: null, isGuest: true });

    renderWithRole(
      <RequireRole role="creator">
        <div data-testid="protected-content">Contenu protégé</div>
      </RequireRole>
    );

    expect(screen.getByTestId('login-page')).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('redirects to / when role is insufficient', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'citoyen',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireRole role="creator">
        <div data-testid="protected-content">Contenu protégé</div>
      </RequireRole>
    );

    expect(screen.getByTestId('home-page')).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('renders content when role is sufficient', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'creator',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireRole role="creator">
        <div data-testid="protected-content">Contenu protégé</div>
      </RequireRole>
    );

    expect(screen.getByTestId('protected-content')).toBeTruthy();
    expect(screen.queryByTestId('home-page')).toBeNull();
  });

  it('admin role satisfies creator requirement', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'admin',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireRole role="creator">
        <div data-testid="protected-content">Contenu protégé</div>
      </RequireRole>
    );

    expect(screen.getByTestId('protected-content')).toBeTruthy();
  });

  it('uses custom redirectTo when provided', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'citoyen',
      isAuthenticated: true,
      isGuest: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireRole role="admin" redirectTo="/login">
                <div data-testid="protected-content">Contenu</div>
              </RequireRole>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">Connexion</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeTruthy();
  });
});

// ── RequireCreator ─────────────────────────────────────────────────────────

describe('RequireCreator', () => {
  beforeEach(() => {
    authState = makeAuthMock();
  });

  it('allows creator role', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'creator',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireCreator>
        <div data-testid="creator-content">Espace créateur</div>
      </RequireCreator>
    );

    expect(screen.getByTestId('creator-content')).toBeTruthy();
  });

  it('allows admin role (admin can access creator space)', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'admin',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireCreator>
        <div data-testid="creator-content">Espace créateur</div>
      </RequireCreator>
    );

    expect(screen.getByTestId('creator-content')).toBeTruthy();
  });

  it('blocks citoyen role', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'citoyen',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireCreator>
        <div data-testid="creator-content">Espace créateur</div>
      </RequireCreator>
    );

    expect(screen.getByTestId('home-page')).toBeTruthy();
    expect(screen.queryByTestId('creator-content')).toBeNull();
  });

  it('blocks guest (unauthenticated)', () => {
    authState = makeAuthMock({ loading: false, user: null, isGuest: true });

    renderWithRole(
      <RequireCreator>
        <div data-testid="creator-content">Espace créateur</div>
      </RequireCreator>
    );

    expect(screen.getByTestId('login-page')).toBeTruthy();
    expect(screen.queryByTestId('creator-content')).toBeNull();
  });
});

// ── RequireAdmin ───────────────────────────────────────────────────────────

describe('RequireAdmin', () => {
  beforeEach(() => {
    authState = makeAuthMock();
  });

  it('allows admin role', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'admin',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireAdmin>
        <div data-testid="admin-content">Espace admin</div>
      </RequireAdmin>
    );

    expect(screen.getByTestId('admin-content')).toBeTruthy();
  });

  it('blocks creator role (creator !== admin)', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'creator',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireAdmin>
        <div data-testid="admin-content">Espace admin</div>
      </RequireAdmin>
    );

    expect(screen.getByTestId('home-page')).toBeTruthy();
    expect(screen.queryByTestId('admin-content')).toBeNull();
  });

  it('blocks citoyen role', () => {
    authState = makeAuthMock({
      loading: false,
      user: fakeUser,
      userRole: 'citoyen',
      isAuthenticated: true,
      isGuest: false,
    });

    renderWithRole(
      <RequireAdmin>
        <div data-testid="admin-content">Espace admin</div>
      </RequireAdmin>
    );

    expect(screen.getByTestId('home-page')).toBeTruthy();
    expect(screen.queryByTestId('admin-content')).toBeNull();
  });

  it('shows loading spinner when auth is resolving', () => {
    authState = makeAuthMock({ loading: true, authResolved: false });

    renderWithRole(
      <RequireAdmin>
        <div data-testid="admin-content">Espace admin</div>
      </RequireAdmin>
    );

    expect(screen.getByTestId('auth-loading-spinner')).toBeTruthy();
  });
});
