import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

/**
 * Role-based access control component
 * Renders children only if user has required role(s)
 */
export default function RoleGuard({ children, requiredRoles = [], fallback = null }) {
  const { user } = useAuth();
  const { roles, loading } = useRole(user);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return fallback || (
      <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-center">
        <p className="text-slate-300">Veuillez vous connecter pour accéder à cette section.</p>
      </div>
    );
  }

  // Check if user has any of the required roles
  const hasAccess = requiredRoles.some((role) => roles[role] === true);

  if (!hasAccess) {
    return fallback || (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-center">
        <p className="text-red-300">Accès restreint. Vous n'avez pas les permissions nécessaires.</p>
      </div>
    );
  }

  return <>{children}</>;
}
