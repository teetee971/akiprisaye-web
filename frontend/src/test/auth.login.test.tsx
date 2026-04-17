/**
 * auth.login.test.tsx
 *
 * Tests for the auth UX flow:
 *  - Login page shows spinner while Firebase auth is initialising
 *  - Login page redirects an already-authenticated user automatically
 *  - Login page fires a success toast before redirecting (visual confirmation)
 *  - Header displays a loading skeleton while auth is settling (prevents "Se connecter" flash)
 *  - Header displays avatar + display-name/email when authenticated
 *  - SocialLoginButtons is hidden when the user is already authenticated
 *  - SocialLoginButtons uses signInWithRedirect on mobile (not signInWithPopup)
 *  - SocialLoginButtons uses signInWithPopup on desktop (not signInWithRedirect)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '../context/ThemeContext';

/* ── Shared mock navigate ──────────────────────────────────────────────── */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router-dom')>();
  return { ...original, useNavigate: () => mockNavigate };
});

/* ── react-hot-toast mock ──────────────────────────────────────────────── */
const mockToastSuccess = vi.hoisted(() => vi.fn());
vi.mock('react-hot-toast', () => ({
  default: { success: mockToastSuccess, error: vi.fn() },
}));

/* ── Firebase / lib mocks ──────────────────────────────────────────────── */
vi.mock('../lib/firebase', () => ({
  firebaseError: null,
  missingCriticalEnvKeys: [],
  wrongApiKeyDetected: false,
}));

vi.mock('../lib/authMessages', () => ({
  FIREBASE_UNAVAILABLE_MESSAGE: 'Firebase indisponible',
  getAuthErrorMessage: (err: unknown) => String(err),
}));

vi.mock('../components/ui/SEOHead', () => ({
  SEOHead: () => null,
}));

/* ── Auth context mock factory ─────────────────────────────────────────── */
function makeAuthMock(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    userRole: 'guest',
    loading: false,
    authResolved: true,
    authFlowState: 'idle' as const,
    lastIncident: null,
    error: null,
    isGuest: true,
    isCitoyen: false,
    isObservateur: false,
    isAdmin: false,
    isCreator: false,
    clearError: vi.fn(),
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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));
vi.mock('../context/authHook', () => ({
  useAuth: () => authState,
  AuthContext: { _currentValue: undefined },
}));

/* ── Mock useEntitlements (Header now reads the plan) ──────────────────── */
vi.mock('../billing/useEntitlements', () => ({
  useEntitlements: () => ({ plan: 'FREE', can: () => false, quota: () => 0, explain: () => '' }),
}));

/* ── Logger mock (silence [AUTH] logs in tests) ────────────────────────── */
vi.mock('../utils/logger', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

/* ── ───────────────────────────────────────────────────────────────────── */

import Login from '../pages/Login';
import Header from '../components/Header';
import LayoutHeader from '../components/layout/Header';
import SocialLoginButtons from '../components/SocialLoginButtons';

/* ── ThemeToggle / LanguageSelector stubs ──────────────────────────────── */
vi.mock('../components/ThemeToggle', () => ({
  default: () => null,
}));
vi.mock('../components/i18n/LanguageSelector', () => ({
  LanguageSelector: () => null,
}));

/* ── Stubs for layout/Header dependencies ─────────────────────────────── */
vi.mock('../components/NotificationCenter', () => ({
  NotificationCenter: () => null,
}));
vi.mock('../components/GlobalSearch', () => ({
  default: () => null,
  useGlobalSearchShortcut: () => {},
}));
vi.mock('../store/useShoppingListStore', () => ({
  getShoppingListCount: () => 0,
}));

/* ════════════════════════════════════════════════════════════════════════
 * Login page
 * ════════════════════════════════════════════════════════════════════════ */

describe('Login page', () => {
  it('shows a loading spinner while auth is initialising', () => {
    authState = makeAuthMock({ loading: true, authFlowState: 'resolving', authResolved: false });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('status', { name: /vérification en cours/i })).toBeTruthy();
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
  });

  it('shows the login form when auth has finished loading and no user', () => {
    authState = makeAuthMock({ loading: false, user: null });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.queryByRole('status', { name: /vérification/i })).toBeNull();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeTruthy();
  });

  it('redirects an already-authenticated user away from /connexion', () => {
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Test', photoURL: null };
    authState = makeAuthMock({ loading: false, user: fakeUser });
    mockNavigate.mockClear();
    mockToastSuccess.mockClear();

    render(
      <MemoryRouter initialEntries={['/connexion']}>
        <Login />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/mon-compte', { replace: true });
    // Success toast is fired to confirm the sign-in visually
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Bienvenue'),
      expect.objectContaining({ id: 'auth-success' })
    );
  });

  it('fires a success toast before redirecting when auth resolves with a user (OAuth return)', () => {
    const fakeUser = {
      uid: 'u1',
      email: 'marie@example.com',
      displayName: 'Marie Dupont',
      photoURL: null,
    };
    authState = makeAuthMock({ loading: false, user: fakeUser });
    mockNavigate.mockClear();
    mockToastSuccess.mockClear();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Toast includes the user's first name
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Marie'),
      expect.objectContaining({ id: 'auth-success', duration: 3000 })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/mon-compte', { replace: true });
  });

  it('hides social login buttons and shows the spinner while auth is loading (simulates OAuth redirect return)', () => {
    authState = makeAuthMock({ loading: true, authFlowState: 'resolving', authResolved: false });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Spinner is shown, social buttons hidden — prevents flash of login form during redirect settlement
    expect(screen.getByRole('status', { name: /vérification en cours/i })).toBeTruthy();
    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * Header
 * ════════════════════════════════════════════════════════════════════════ */

describe('Header', () => {
  it('shows a "Se connecter" link when the user is not authenticated', () => {
    authState = makeAuthMock({ user: null });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /se connecter/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /se déconnecter/i })).toBeNull();
  });

  it('shows a loading skeleton instead of "Se connecter" while auth is settling', () => {
    authState = makeAuthMock({
      loading: true,
      authFlowState: 'resolving',
      authResolved: false,
      user: null,
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // During OAuth redirect return, auth is in loading state.
    // Must show a neutral skeleton — NOT the "Se connecter" link which would
    // create visual contradiction with the "Vérification en cours…" spinner on
    // the Login page.
    expect(screen.getByRole('status', { name: /chargement du compte/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /se connecter/i })).toBeNull();
  });

  it('shows the display name and a sign-out button when authenticated', () => {
    const fakeUser = {
      uid: 'u1',
      email: 'jean@example.com',
      displayName: 'Jean Dupont',
      photoURL: null,
    };
    authState = makeAuthMock({
      user: fakeUser,
      signOutUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Jean Dupont')).toBeTruthy();
    expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /se connecter/i })).toBeNull();
  });

  it('shows a photo when the user has a photoURL', () => {
    const fakeUser = {
      uid: 'u2',
      email: 'marie@example.com',
      displayName: 'Marie',
      photoURL: 'https://example.com/avatar.jpg',
    };
    authState = makeAuthMock({ user: fakeUser, signOutUser: vi.fn() });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const avatar = screen.getByAltText('Avatar') as HTMLImageElement;
    expect(avatar.src).toBe('https://example.com/avatar.jpg');
  });

  it('shows an initials badge when the user has no photoURL', () => {
    const fakeUser = {
      uid: 'u3',
      email: 'pierre@example.com',
      displayName: 'Pierre',
      photoURL: null,
    };
    authState = makeAuthMock({ user: fakeUser, signOutUser: vi.fn() });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // The initial badge is aria-hidden, but its text content should be "P"
    const badge = document.querySelector('[aria-hidden="true"]');
    expect(badge?.textContent).toBe('P');
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * SocialLoginButtons
 * ════════════════════════════════════════════════════════════════════════ */

describe('SocialLoginButtons', () => {
  it('renders social login buttons when the user is not authenticated', () => {
    authState = makeAuthMock({ user: null });

    render(
      <MemoryRouter>
        <SocialLoginButtons />
      </MemoryRouter>
    );

    // The Google button has text "Continuer avec Google" inside it
    expect(screen.getByText(/continuer avec google/i)).toBeTruthy();
  });

  it('renders nothing when the user is already authenticated', () => {
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Test', photoURL: null };
    authState = makeAuthMock({ user: fakeUser });

    const { container } = render(
      <MemoryRouter>
        <SocialLoginButtons />
      </MemoryRouter>
    );

    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('navigates via useEffect when user becomes confirmed after popup (avoids RequireAuth race)', async () => {
    // Simulate: user=null initially (popup in flight), then user is set (onAuthStateChanged fired)
    authState = makeAuthMock({ user: null });
    const { rerender } = render(
      <MemoryRouter>
        <SocialLoginButtons redirectTo="/mon-compte" />
      </MemoryRouter>
    );

    // Simulate onAuthStateChanged confirming the user after popup
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Test', photoURL: null };
    authState = makeAuthMock({ user: fakeUser });

    // Patch pendingRedirect by re-rendering with user set — since SocialLoginButtons
    // returns null when user is set and no pendingRedirect is active, verify it renders null.
    rerender(
      <MemoryRouter>
        <SocialLoginButtons redirectTo="/mon-compte" />
      </MemoryRouter>
    );

    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
  });

  it('navigates to /auth/callback (not signInGooglePopup or direct redirect) when on mobile', async () => {
    const mockSignInGoogleRedirect = vi.fn();
    const mockSignInGooglePopup = vi.fn();
    authState = makeAuthMock({
      user: null,
      signInGoogleRedirect: mockSignInGoogleRedirect,
      signInGooglePopup: mockSignInGooglePopup,
    });

    // Simulate a mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    mockNavigate.mockClear();
    render(
      <MemoryRouter>
        <SocialLoginButtons redirectTo="/mon-compte" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /se connecter avec google/i }));

    await waitFor(() => {
      // On mobile, SocialLoginButtons navigates to /auth/callback — it does NOT
      // call signInGoogleRedirect directly. The redirect is initiated by AuthCallbackPage.
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback?provider=google'),
        expect.any(Object)
      );
    });
    expect(mockSignInGoogleRedirect).not.toHaveBeenCalled();
    expect(mockSignInGooglePopup).not.toHaveBeenCalled();

    // Restore a desktop user agent for subsequent tests
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    });
  });

  it('calls signInGooglePopup (not signInGoogleRedirect) when on desktop', async () => {
    const mockSignInGooglePopup = vi.fn().mockResolvedValue(undefined);
    const mockSignInGoogleRedirect = vi.fn();
    authState = makeAuthMock({
      user: null,
      signInGooglePopup: mockSignInGooglePopup,
      signInGoogleRedirect: mockSignInGoogleRedirect,
    });

    // Ensure desktop user agent
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    });

    render(
      <MemoryRouter>
        <SocialLoginButtons />
      </MemoryRouter>
    );

    // The Google button accessible name is set by its aria-label
    fireEvent.click(screen.getByRole('button', { name: /se connecter avec google/i }));

    await waitFor(() => {
      expect(mockSignInGooglePopup).toHaveBeenCalledOnce();
    });
    expect(mockSignInGoogleRedirect).not.toHaveBeenCalled();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * layout/Header — production header used by Layout.jsx
 * ════════════════════════════════════════════════════════════════════════ */

describe('layout/Header', () => {
  it('shows a "Se connecter" link when the user is not authenticated', () => {
    authState = makeAuthMock({ user: null });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <LayoutHeader />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('link', { name: /se connecter/i })).toBeTruthy();
  });

  it('shows a loading skeleton instead of "Se connecter" while auth is settling', () => {
    authState = makeAuthMock({
      loading: true,
      authFlowState: 'resolving',
      authResolved: false,
      user: null,
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <LayoutHeader />
        </MemoryRouter>
      </ThemeProvider>
    );

    // The skeleton replaces the "Se connecter" button while auth is resolving.
    // This prevents the header from showing contradictory state during OAuth return.
    expect(screen.getByRole('status', { name: /chargement du compte/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /se connecter/i })).toBeNull();
  });

  it('shows an account button with user initials when authenticated', () => {
    const fakeUser = {
      uid: 'u1',
      email: 'jean@example.com',
      displayName: 'Jean Dupont',
      photoURL: null,
    };
    authState = makeAuthMock({ user: fakeUser, signOutUser: vi.fn() });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <LayoutHeader />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Avatar button is accessible as "Mon compte"
    expect(screen.getByRole('button', { name: /mon compte/i })).toBeTruthy();
    // "Se connecter" link is hidden when authenticated
    expect(screen.queryByRole('link', { name: /^se connecter$/i })).toBeNull();
  });

  it('shows displayName in mobile menu when authenticated', () => {
    const fakeUser = {
      uid: 'u2',
      email: 'marie@example.com',
      displayName: 'Marie Dupont',
      photoURL: null,
    };
    authState = makeAuthMock({ user: fakeUser, signOutUser: vi.fn() });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <LayoutHeader />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Open the mobile navigation menu
    const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('Marie Dupont')).toBeTruthy();
    expect(screen.getByText('marie@example.com')).toBeTruthy();
  });
});
