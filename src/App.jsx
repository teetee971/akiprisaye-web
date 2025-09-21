import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Accueil from './pages/Accueil';
import Produits from './pages/Produits';
import Favoris from './pages/Favoris';
import VieChere from './pages/VieChere';
import Compte from './pages/Compte';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Accueil />} />
            <Route path="produits" element={<Produits />} />
            <Route path="favoris" element={<Favoris />} />
            <Route path="vie-chere" element={<VieChere />} />
            <Route path="compte" element={<Compte />} />
            <Route 
              path="admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

