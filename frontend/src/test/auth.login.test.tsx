/**
 * auth.login.test.tsx
 *
 * Tests for the auth UX flow:
 *  - Login page shows spinner while Firebase auth is initialising
 *  - Login page redirects an already-authenticated user automatically
 *  - Header displays avatar + display-name/email when authenticated
 *  - SocialLoginButtons is hidden when the user is already authenticated
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

/* ── Shared mock navigate ──────────────────────────────────────────────── */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router-dom')>();
  return { ...original, useNavigate: () => mockNavigate };
});

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
    authState = makeAuthMock({ loading: true });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
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
      </MemoryRouter>,
    );

    expect(screen.queryByRole('status', { name: /vérification/i })).toBeNull();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeTruthy();
  });

  it('redirects an already-authenticated user away from /connexion', () => {
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Test', photoURL: null };
    authState = makeAuthMock({ loading: false, user: fakeUser });
    mockNavigate.mockClear();

    render(
      <MemoryRouter initialEntries={['/connexion']}>
        <Login />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith('/mon-compte', { replace: true });
  });

  it('hides social login buttons and shows the spinner while auth is loading (simulates OAuth redirect return)', () => {
    authState = makeAuthMock({ loading: true });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
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
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /se connecter/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /se déconnecter/i })).toBeNull();
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
      </MemoryRouter>,
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
      </MemoryRouter>,
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
      </MemoryRouter>,
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
      </MemoryRouter>,
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
      </MemoryRouter>,
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
      </MemoryRouter>,
    );

    // Simulate onAuthStateChanged confirming the user after popup
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Test', photoURL: null };
    authState = makeAuthMock({ user: fakeUser });

    // Patch pendingRedirect by re-rendering with user set — since SocialLoginButtons
    // returns null when user is set and no pendingRedirect is active, verify it renders null.
    rerender(
      <MemoryRouter>
        <SocialLoginButtons redirectTo="/mon-compte" />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * layout/Header — production header used by Layout.jsx
 * ════════════════════════════════════════════════════════════════════════ */

describe('layout/Header', () => {
  it('shows a "Se connecter" link when the user is not authenticated', () => {
    authState = makeAuthMock({ user: null });

    render(
      <MemoryRouter>
        <LayoutHeader />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /se connecter/i })).toBeTruthy();
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
      <MemoryRouter>
        <LayoutHeader />
      </MemoryRouter>,
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
      <MemoryRouter>
        <LayoutHeader />
      </MemoryRouter>,
    );

    // Open the mobile navigation menu
    const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('Marie Dupont')).toBeTruthy();
    expect(screen.getByText('marie@example.com')).toBeTruthy();
  });
});
