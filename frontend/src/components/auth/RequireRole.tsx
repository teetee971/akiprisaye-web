/**
 * RequireRole.tsx
 *
 * Generic route guard that redirects users who don't meet a minimum role requirement.
 * Handles loading states to avoid premature redirects during auth bootstrap.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/auth/rbac";
import type { UserRole } from "@/auth/rbac";

interface RequireRoleProps {
  role: UserRole;
  children: JSX.Element;
  redirectTo?: string;
}

export default function RequireRole({ role, children, redirectTo = "/" }: RequireRoleProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        data-testid="auth-loading-spinner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#020617",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(251,191,36,0.2)",
            borderTopColor: "#fbbf24",
            animation: "spin 0.7s linear infinite",
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
