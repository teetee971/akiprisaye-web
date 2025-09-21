import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Admin() {
  const { currentUser, userClaims, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    adminUsers: 0
  });

  useEffect(() => {
    // In a real app, you'd fetch this data from your backend
    // For demo purposes, we'll show mock data
    setStats({
      totalUsers: 150,
      premiumUsers: 45,
      adminUsers: 3
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
        <p className="text-gray-600">Droits d'administrateur requis.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🛡️ Interface d'administration</h1>
            <p className="text-gray-600 mt-2">Tableau de bord sécurisé - A KI PRI SA YÉ</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Connecté en tant que :</p>
            <p className="font-semibold">{currentUser?.email || 'Administrateur'}</p>
            <button
              onClick={handleLogout}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-3 mr-4">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Utilisateurs total</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-full p-3 mr-4">
              <span className="text-white text-xl">👑</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Utilisateurs Premium</h3>
              <p className="text-3xl font-bold text-green-600">{stats.premiumUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-full p-3 mr-4">
              <span className="text-white text-xl">🛡️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Administrateurs</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.adminUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Gestion des utilisateurs</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              📋 Voir tous les utilisateurs
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              👑 Gérer les comptes Premium
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              🚫 Utilisateurs suspendus
            </button>
          </div>
        </div>

        {/* System Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Gestion du système</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              📊 Statistiques détaillées
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              💰 Gestion des prix
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              🏪 Gestion des magasins
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔒 Sécurité</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              🔑 Logs de connexion
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              🛡️ Tentatives d'intrusion
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              🔐 Configuration 2FA
            </button>
          </div>
        </div>

        {/* Content Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Gestion du contenu</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              📰 Articles et actualités
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              🏆 Gestion du palmarès
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              📱 Configuration de l'app
            </button>
          </div>
        </div>
      </div>

      {/* Current User Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations de session</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>UID:</strong> {currentUser?.uid}
          </div>
          <div>
            <strong>Email:</strong> {currentUser?.email}
          </div>
          <div>
            <strong>Rôle Admin:</strong> {userClaims?.admin ? '✅ Oui' : '❌ Non'}
          </div>
          <div>
            <strong>Premium:</strong> {userClaims?.premium ? '✅ Oui' : '❌ Non'}
          </div>
        </div>
      </div>
    </div>
  );
}