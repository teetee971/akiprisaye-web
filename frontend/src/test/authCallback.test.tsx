/**
 * authCallback.test.tsx
 *
 * Tests for the /auth/callback route — the dedicated OAuth callback page.
 *
 * Covered scenarios:
 *  1. Mobile → signInWithRedirect used (SocialLoginButtons navigates to /auth/callback)
 *  2. AuthCallbackPage shows no form/social buttons before auth stabilises
 *  3. Success → redirect to /mon-compte after user is confirmed
 *  4. No user after loading → clean return to /connexion
 *  5. sessionStorage flag is removed after auth cycle completes
 *  6. No redirect loop: invalid direct access → navigate to /connexion
 *  7. Timeout guard fires AUTH_REDIRECT_TIMEOUT event when auth hangs
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

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

/* ── Auth service mocks ────────────────────────────────────────────────── */
const mockSignInGoogleRedirect = vi.fn().mockResolvedValue(undefined);
const mockSignInFacebookRedirect = vi.fn().mockResolvedValue(undefined);
const mockSignInAppleRedirect = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/auth', () => ({
  signInGoogleRedirect: (...args: unknown[]) => mockSignInGoogleRedirect(...args),
  signInFacebookRedirect: (...args: unknown[]) => mockSignInFacebookRedirect(...args),
  signInAppleRedirect: (...args: unknown[]) => mockSignInAppleRedirect(...args),
}));

/* ── authStorage mock (flag lifecycle) ─────────────────────────────────── */
vi.mock('../auth/authStorage', () => ({
  setRedirectPendingFlag: ({ provider, next }: { provider: string; next: string }) => {
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({ provider, next, ts: Date.now() })
    );
  },
  getRedirectPendingFlag: () => {
    try {
      const raw = sessionStorage.getItem('auth:return:pending');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  clearRedirectPendingFlag: () => {
    sessionStorage.removeItem('auth:return:pending');
  },
  REDIRECT_PENDING_KEY: 'auth:return:pending',
}));

/* ── authIncidents mock ─────────────────────────────────────────────────── */
vi.mock('../auth/authIncidents', () => ({
  getAuthIncidentUserMessage: () => null,
}));

/* ── authLogger mock ───────────────────────────────────────────────────── */
const mockAuthLog = vi.fn();
vi.mock('../utils/authLogger', () => ({
  authLog: (...args: unknown[]) => mockAuthLog(...args),
}));

/* ── Auth context mock factory ─────────────────────────────────────────── */
function makeAuthMock(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    loading: false,
    authResolved: true,
    lastIncident: null,
    userRole: 'guest',
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

let authState = makeAuthMock();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));
vi.mock('../context/authHook', () => ({
  useAuth: () => authState,
  AuthContext: { _currentValue: undefined },
}));

/* ── Logger mock ───────────────────────────────────────────────────────── */
vi.mock('../utils/logger', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

/* ── Import component under test ───────────────────────────────────────── */
import AuthCallbackPage from '../pages/AuthCallbackPage';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { fireEvent } from '@testing-library/react';

/* ── Helpers ───────────────────────────────────────────────────────────── */
function renderCallback(search = '?provider=google&next=%2Fmon-compte') {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </MemoryRouter>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 1. Mobile → SocialLoginButtons navigates to /auth/callback (not direct redirect)
 * ════════════════════════════════════════════════════════════════════════ */

describe('SocialLoginButtons — mobile redirect', () => {
  beforeEach(() => {
    authState = makeAuthMock({ user: null });
    mockNavigate.mockClear();

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) Mobile/15E148',
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
  });

  it('navigates to /auth/callback with provider and next params on mobile', async () => {
    render(
      <MemoryRouter>
        <SocialLoginButtons redirectTo="/mon-compte" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /se connecter avec google/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/auth/callback?provider=google&next=%2Fmon-compte',
        { replace: false }
      );
    });
  });

  it('does NOT call signInGoogleRedirect directly from SocialLoginButtons on mobile', async () => {
    render(
      <MemoryRouter>
        <SocialLoginButtons redirectTo="/mon-compte" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /se connecter avec google/i }));

    await waitFor(() => {
      expect(mockSignInGoogleRedirect).not.toHaveBeenCalled();
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * 2. AuthCallbackPage — no form / no social buttons before auth stabilises
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthCallbackPage — neutral state while pending', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockSignInGoogleRedirect.mockClear();
  });

  it('shows a loading spinner and no form/social buttons on first load', async () => {
    // First load: no flag in sessionStorage, provider=google provided
    authState = makeAuthMock({ loading: true, authResolved: false });

    renderCallback('?provider=google&next=%2Fmon-compte');

    // The page renders a neutral loading screen
    const status = screen.getByRole('status', { name: /connexion google en cours/i });
    expect(status).toBeTruthy();

    // No form, no email input, no social buttons
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.queryByLabelText(/adresse e-mail/i)).toBeNull();
    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
    expect(screen.queryByText(/continuer avec facebook/i)).toBeNull();
    expect(screen.queryByText(/continuer avec apple/i)).toBeNull();
  });

  it('sets the sessionStorage flag before calling signInWithRedirect on first load', async () => {
    authState = makeAuthMock({ loading: true, authResolved: false });

    renderCallback('?provider=google&next=%2Fmon-compte');

    await waitFor(() => {
      expect(mockSignInGoogleRedirect).toHaveBeenCalledOnce();
    });

    // Flag should have been set before the redirect call
    expect(sessionStorage.getItem('auth:return:pending')).not.toBeNull();
  });

  it('shows loading spinner on OAuth return (flag is set, loading=true)', async () => {
    // Simulate OAuth return: flag is already in sessionStorage
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );
    authState = makeAuthMock({ loading: true, authResolved: false });

    renderCallback();

    const status = screen.getByRole('status', { name: /connexion google en cours/i });
    expect(status).toBeTruthy();

    // Still no form/social buttons
    expect(screen.queryByText(/continuer avec google/i)).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * 3. Success → redirect to /mon-compte
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthCallbackPage — success path', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockToastSuccess.mockClear();
    mockAuthLog.mockClear();
  });

  it('redirects to /mon-compte after user is confirmed', async () => {
    const fakeUser = { uid: 'u1', displayName: 'Marie', email: 'm@e.com', photoURL: null };

    // Simulate OAuth return scenario
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: fakeUser, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mon-compte', { replace: true });
    });
  });

  it('fires a success toast with the user first name on success', async () => {
    const fakeUser = { uid: 'u1', displayName: 'Marie Dupont', email: 'm@e.com', photoURL: null };

    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: fakeUser, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Marie'),
        expect.objectContaining({ id: 'auth-success' })
      );
    });
  });

  it('logs AUTH_STATE_USER_PRESENT and AUTH_NAVIGATE_AFTER_SUCCESS events on success', async () => {
    const fakeUser = { uid: 'u1', displayName: 'Test', email: 't@e.com', photoURL: null };

    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: fakeUser, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(mockAuthLog).toHaveBeenCalledWith('AUTH_STATE_USER_PRESENT', expect.any(Object));
      expect(mockAuthLog).toHaveBeenCalledWith('AUTH_NAVIGATE_AFTER_SUCCESS', expect.any(Object));
    });
  });

  it('respects a custom next param in the flag', async () => {
    const fakeUser = { uid: 'u1', displayName: null, email: 't@e.com', photoURL: null };

    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mes-economies',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: fakeUser, loading: false });

    renderCallback('?provider=google&next=%2Fmes-economies');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mes-economies', { replace: true });
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * 4. No user after loading → clean return to /connexion
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthCallbackPage — no-user path', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockAuthLog.mockClear();
  });

  it('shows an error state when auth resolves with no user', async () => {
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: null, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(screen.getByText(/connexion annulée ou refusée/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /retour à la connexion/i })).toBeTruthy();
    });
  });

  it('logs AUTH_STATE_NO_USER when auth resolves without a user', async () => {
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: null, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(mockAuthLog).toHaveBeenCalledWith('AUTH_STATE_NO_USER');
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * 5. sessionStorage flag is removed after auth cycle completes
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthCallbackPage — flag cleanup', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
  });

  it('removes the sessionStorage flag after a successful auth cycle', async () => {
    const fakeUser = { uid: 'u1', displayName: 'Test', email: 't@e.com', photoURL: null };

    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: fakeUser, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mon-compte', { replace: true });
    });

    expect(sessionStorage.getItem('auth:return:pending')).toBeNull();
  });

  it('removes the sessionStorage flag even when auth resolves with no user', async () => {
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: null, loading: false });

    renderCallback();

    await waitFor(() => {
      expect(screen.getByText(/connexion annulée ou refusée/i)).toBeTruthy();
    });

    expect(sessionStorage.getItem('auth:return:pending')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * 6. No redirect loop: invalid direct access → navigate to /connexion
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthCallbackPage — anti-loop / direct access', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockSignInGoogleRedirect.mockClear();
  });

  it('redirects to /connexion when accessed directly without provider or flag', async () => {
    authState = makeAuthMock({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/connexion', { replace: true });
    });

    // signInWithRedirect must NOT have been called
    expect(mockSignInGoogleRedirect).not.toHaveBeenCalled();
  });

  it('does NOT cause a redirect loop when flag is absent and provider is invalid', async () => {
    authState = makeAuthMock({ user: null, loading: false });

    renderCallback('?provider=invalid&next=%2Fmon-compte');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/connexion', { replace: true });
    });

    // Only one navigate call — not a loop
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * 7. Timeout guard
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthCallbackPage — timeout guard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockAuthLog.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('shows a timeout message and logs AUTH_REDIRECT_TIMEOUT if auth hangs for 15s', async () => {
    // OAuth return: flag is set, auth stays loading=true indefinitely
    sessionStorage.setItem(
      'auth:return:pending',
      JSON.stringify({
        provider: 'google',
        next: '/mon-compte',
        ts: Date.now(),
      })
    );

    authState = makeAuthMock({ user: null, loading: true, authResolved: false });

    renderCallback();

    // Advance time past the 15-second timeout
    await act(async () => {
      vi.advanceTimersByTime(16_000);
    });

    expect(mockAuthLog).toHaveBeenCalledWith('AUTH_REDIRECT_TIMEOUT');

    // Shows a user-friendly timeout message
    expect(screen.getByText(/la connexion a pris trop de temps/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /retour à la connexion/i })).toBeTruthy();

    // Flag cleaned up
    expect(sessionStorage.getItem('auth:return:pending')).toBeNull();
  });
});
