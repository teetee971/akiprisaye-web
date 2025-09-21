import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  // User must be authenticated
  if (!currentUser) {
    return <Navigate to="/compte" replace />;
  }

  // If admin is required, check admin role
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
          <p className="text-gray-600 mb-6">Vous n'avez pas les droits d'administrateur nécessaires pour accéder à cette page.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
}