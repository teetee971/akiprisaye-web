/**
 * authDebugPanel.test.tsx
 *
 * Tests for the AuthDebugPanel visual overlay:
 *  - Hidden by default (no sessionStorage flag, and debug disabled)
 *  - Visible when sessionStorage['auth:debug'] === '1'
 *  - Shows loading state correctly
 *  - Shows user info when authenticated
 *  - Shows "no flag" when sessionStorage flag is absent
 *  - Shows pending flag provider when set
 *  - Displays the current route
 *  - Renders new auth events via the event bus
 *  - Collapses/expands on header click
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

/* ── Auth context mock ─────────────────────────────────────────────────── */
function makeAuthMock(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    loading: false,
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

/* ── authStorage mock ──────────────────────────────────────────────────── */
// Mirrors the real getRedirectPendingFlag() including TTL expiry.
// NOTE: vi.mock factories are hoisted, so the constant must be defined
// with vi.hoisted() or inlined directly — avoid outer-scope variable refs.
const REDIRECT_PENDING_TTL_MS = vi.hoisted(() => 5 * 60 * 1000);

vi.mock('../auth/authStorage', () => ({
  REDIRECT_PENDING_TTL_MS: 5 * 60 * 1000,
  getRedirectPendingFlag: () => {
    const TTL = 5 * 60 * 1000;
    try {
      const raw = sessionStorage.getItem('auth:return:pending');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > TTL) {
        sessionStorage.removeItem('auth:return:pending');
        return null;
      }
      return data;
    } catch { return null; }
  },
  getAuthRetryCount: () => 0,
  clearAuthTransientStorage: () => { sessionStorage.clear(); },
}));

/* ── authLogger: mock isAuthDebugEnabled so we control visibility ──────── */
// We keep the real event bus (authLog, useAuthEvents) but mock the
// isAuthDebugEnabled function so tests don't depend on import.meta.env.DEV.
let mockDebugEnabled = false;
vi.mock('../utils/authLogger', async (importOriginal) => {
  const real = await importOriginal<typeof import('../utils/authLogger')>();
  return {
    ...real,
    isAuthDebugEnabled: () => mockDebugEnabled,
  };
});

/* ── Import components under test ─────────────────────────────────────── */
import { authLog } from '../utils/authLogger';
import AuthDebugPanel from '../components/AuthDebugPanel';

/* ── Helpers ────────────────────────────────────────────────────────────── */

function renderPanel(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthDebugPanel />
    </MemoryRouter>,
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * Visibility gating
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthDebugPanel — visibility', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState = makeAuthMock();
    mockDebugEnabled = false;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders nothing when debug is disabled (production default)', () => {
    mockDebugEnabled = false;

    const { container } = renderPanel();
    // Panel must be invisible — no element rendered
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('complementary', { name: /auth debug panel/i })).toBeNull();
  });

  it('renders the panel when debug is enabled', () => {
    mockDebugEnabled = true;

    renderPanel();

    expect(screen.getByRole('complementary', { name: /auth debug panel/i })).toBeTruthy();
    expect(screen.getByText(/auth debug/i)).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * State display
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthDebugPanel — state display', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState = makeAuthMock();
    mockDebugEnabled = true;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows LOADING badge when auth.loading is true', () => {
    authState = makeAuthMock({ loading: true });
    renderPanel();
    expect(screen.getByTitle('LOADING')).toBeTruthy();
  });

  it('shows READY badge when auth.loading is false', () => {
    authState = makeAuthMock({ loading: false });
    renderPanel();
    expect(screen.getByTitle('READY')).toBeTruthy();
  });

  it('shows "no user" badge when no user is authenticated', () => {
    authState = makeAuthMock({ user: null });
    renderPanel();
    expect(screen.getByTitle('✗ no user')).toBeTruthy();
  });

  it('shows user email badge when authenticated', () => {
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Test', photoURL: null };
    authState = makeAuthMock({ user: fakeUser });
    renderPanel();
    // Title is prefixed with the checkmark in StatusBadge
    expect(screen.getByTitle('✓ test@example.com')).toBeTruthy();
  });

  it('shows "no flag" badge when auth:return:pending is absent', () => {
    renderPanel();
    expect(screen.getByTitle('✗ no flag')).toBeTruthy();
  });

  it('shows provider name when auth:return:pending is set', async () => {
    sessionStorage.setItem('auth:return:pending', JSON.stringify({
      provider: 'google', next: '/mon-compte', ts: Date.now(),
    }));

    renderPanel();

    // The flag is read synchronously in the useEffect[enabled] on mount.
    await waitFor(() => {
      // StatusBadge label = "⏳ google"
      expect(screen.getByTitle(/⏳ google/)).toBeTruthy();
    });
  });

  it('shows the current route in the body', () => {
    renderPanel('/connexion?next=%2Fmon-compte');
    expect(screen.getByTitle('/connexion?next=%2Fmon-compte')).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * Event bus integration
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthDebugPanel — live event display', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState = makeAuthMock();
    mockDebugEnabled = true;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows AUTH_STATE_USER_PRESENT event after authLog fires', async () => {
    renderPanel();

    act(() => {
      authLog('AUTH_STATE_USER_PRESENT', { uid: 'u1' });
    });

    await waitFor(() => {
      // Event name may appear in "Last event" row and/or event history list
      const matches = screen.getAllByText(/AUTH_STATE_USER_PRESENT/);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('shows AUTH_REDIRECT_TIMEOUT event after authLog fires', async () => {
    renderPanel();

    act(() => {
      authLog('AUTH_REDIRECT_TIMEOUT');
    });

    await waitFor(() => {
      const matches = screen.getAllByText(/AUTH_REDIRECT_TIMEOUT/);
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * Collapse / expand behaviour
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthDebugPanel — collapse/expand', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState = makeAuthMock();
    mockDebugEnabled = true;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('collapses the body when the header is clicked', () => {
    renderPanel();

    // Body is initially visible — READY badge is present
    expect(screen.getByTitle('READY')).toBeTruthy();

    // Click the header to collapse
    fireEvent.click(screen.getByTitle(/collapse auth debug panel/i));

    // Body content should no longer be in the DOM
    expect(screen.queryByTitle('READY')).toBeNull();
  });

  it('re-expands when the header is clicked again', () => {
    renderPanel();

    const header = screen.getByTitle(/collapse auth debug panel/i);
    fireEvent.click(header);
    expect(screen.queryByTitle('READY')).toBeNull();

    fireEvent.click(screen.getByTitle(/expand auth debug panel/i));
    expect(screen.getByTitle('READY')).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * TTL expiry of auth:return:pending flag
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthDebugPanel — TTL expiry of redirect pending flag', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState = makeAuthMock();
    mockDebugEnabled = true;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('treats a fresh flag as valid', async () => {
    sessionStorage.setItem('auth:return:pending', JSON.stringify({
      provider: 'google', next: '/mon-compte', ts: Date.now(),
    }));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTitle(/⏳ google/)).toBeTruthy();
    });
  });

  it('treats an expired flag as absent (ts older than TTL)', async () => {
    // Simulate a flag written more than 5 minutes ago
    const expiredTs = Date.now() - REDIRECT_PENDING_TTL_MS - 1000;
    sessionStorage.setItem('auth:return:pending', JSON.stringify({
      provider: 'google', next: '/mon-compte', ts: expiredTs,
    }));

    renderPanel();

    // getRedirectPendingFlag clears the stale entry and returns null
    await waitFor(() => {
      expect(screen.getByTitle('✗ no flag')).toBeTruthy();
    });
  });

  it('clears the sessionStorage entry when the flag is expired', async () => {
    const expiredTs = Date.now() - REDIRECT_PENDING_TTL_MS - 1000;
    sessionStorage.setItem('auth:return:pending', JSON.stringify({
      provider: 'facebook', next: '/', ts: expiredTs,
    }));

    renderPanel();

    await waitFor(() => {
      // The mock getRedirectPendingFlag removes the key when TTL is exceeded
      expect(sessionStorage.getItem('auth:return:pending')).toBeNull();
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════
 * Event-driven flag refresh (no polling)
 * ════════════════════════════════════════════════════════════════════════ */

describe('AuthDebugPanel — event-driven flag refresh', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState = makeAuthMock();
    mockDebugEnabled = true;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows "no flag" before any auth event when flag is absent', () => {
    renderPanel();
    // Synchronous check — initial read should already have run
    expect(screen.queryByTitle(/⏳/)).toBeNull();
  });

  it('updates flag display when AUTH_REDIRECT_START event fires', async () => {
    renderPanel();

    // Initially no flag
    await waitFor(() => expect(screen.getByTitle('✗ no flag')).toBeTruthy());

    // Simulate the redirect start: write the flag then fire the event
    sessionStorage.setItem('auth:return:pending', JSON.stringify({
      provider: 'google', next: '/mon-compte', ts: Date.now(),
    }));

    act(() => {
      authLog('AUTH_REDIRECT_START', { provider: 'google' });
    });

    // The subscription re-reads the flag — no 500ms polling required
    await waitFor(() => {
      expect(screen.getByTitle(/⏳ google/)).toBeTruthy();
    });
  });

  it('clears flag display when AUTH_REDIRECT_RESULT_RESOLVED event fires', async () => {
    sessionStorage.setItem('auth:return:pending', JSON.stringify({
      provider: 'google', next: '/mon-compte', ts: Date.now(),
    }));

    renderPanel();

    await waitFor(() => expect(screen.getByTitle(/⏳ google/)).toBeTruthy());

    // Simulate the OAuth return: clear the flag then fire the result event
    sessionStorage.removeItem('auth:return:pending');

    act(() => {
      authLog('AUTH_REDIRECT_RESULT_RESOLVED');
    });

    await waitFor(() => {
      expect(screen.getByTitle('✗ no flag')).toBeTruthy();
    });
  });
});
