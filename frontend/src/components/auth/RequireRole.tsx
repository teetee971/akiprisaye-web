/**
 * RequireRole.tsx
 *
 * Generic route guard that redirects users who don't meet a minimum role requirement.
 * Handles loading states to avoid premature redirects during auth bootstrap.
 *
 * Guard logic:
 *  1. While loading OR auth not yet resolved → spinner (never redirect prematurely)
 *  2. No user → redirect to /login?next=<current-path>
 *  3. User present but insufficient role → redirect to `redirectTo` (default: /)
 *  4. Role satisfied → render children
 */

import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/authHook';
import { hasRole } from '@/auth/rbac';
import type { UserRole } from '@/auth/rbac';

interface RequireRoleProps {
  role: UserRole;
  children: ReactElement;
  redirectTo?: string;
}

export default function RequireRole({ role, children, redirectTo = '/' }: RequireRoleProps) {
  const { user, userRole, loading, authResolved } = useAuth();
  const location = useLocation();

  // Show spinner while Firebase auth is still bootstrapping.
  // Guard BOTH `loading` and `authResolved` — defence-in-depth against any
  // edge-case where `loading` flips to false before `authResolved` does.
  if (loading || !authResolved) {
    return (
      <div
        data-testid="auth-loading-spinner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#020617',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid rgba(251,191,36,0.2)',
            borderTopColor: '#fbbf24',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!hasRole(userRole as UserRole, role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
