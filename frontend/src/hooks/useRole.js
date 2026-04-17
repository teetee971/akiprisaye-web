import { useEffect, useState } from 'react';
import { getIdTokenResult } from 'firebase/auth';

/**
 * Custom hook to get user roles from Firebase custom claims
 * @param {Object} user - Firebase user object
 * @returns {Object} roles - Object containing role flags (admin, partner, editor, user)
 */
export function useRole(user) {
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles({});
      setLoading(false);
      return;
    }

    getIdTokenResult(user)
      .then((tokenResult) => {
        setRoles(tokenResult.claims);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching user roles:', error);
        setRoles({});
        setLoading(false);
      });
  }, [user]);

  return { roles, loading };
}

/**
 * Check if user has specific role
 * @param {Object} user - Firebase user object
 * @param {string} requiredRole - Role to check ('admin', 'partner', 'editor', 'user')
 * @returns {boolean} hasRole - Whether user has the required role
 */
export function useHasRole(user, requiredRole) {
  const { roles, loading } = useRole(user);

  if (loading) return null;
  return roles[requiredRole] === true;
}
