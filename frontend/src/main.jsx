import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import L from 'leaflet';

import './styles/glass.css';
import './styles/mobile-fixes.css';
import './styles/leaflet-overrides.css';
import './styles/a11y.css';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Fix Leaflet marker icons for Vite/Cloudflare build
// Point to our bundled markers in /public/leaflet/
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PerformanceMonitor } from './components/PerformanceMonitor';

// Import real pages - Main routes
import Home from './pages/Home';
import Carte from './pages/Carte';
import AdminDashboard from './pages/AdminDashboard';
import Comparateur from './pages/Comparateur';
import Observatoire from './pages/Observatoire';
import Methodologie from './pages/Methodologie';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import MentionsLegales from './pages/MentionsLegales';

// Additional feature pages
import DonneesPubliques from './pages/DonneesPubliques';
import Contribuer from './pages/Contribuer';
import ContribuerPrix from './pages/ContribuerPrix';
import Comparateurs from './pages/Comparateurs';
import CarteItinerairesHub from './pages/CarteItinerairesHub';
import ComparateurCitoyen from './pages/ComparateurCitoyen';

// Scanner & OCR pages
import ScannerHub from './pages/ScannerHub';
import OCRHub from './pages/ocr/OCRHub';
import ScanEAN from './pages/ScanEAN';
import ProductPhotoAnalysis from './pages/ProductPhotoAnalysis';
import ComparaisonEnseignes from './pages/ComparaisonEnseignes';

// Settings & History
import Settings from './pages/Settings';
import HistoriquePrix from './pages/HistoriquePrix';
import RecherchePrix from './pages/RecherchePrix';
import Alertes from './pages/Alertes';

// Auth pages
import Login from './pages/Login';
import Inscription from './pages/Inscription';
import ResetPassword from './pages/ResetPassword';
import MonCompte from './pages/MonCompte';

// Pricing & Subscription
import Pricing from './pages/Pricing';
import Subscribe from './pages/Subscribe';

// Observatory real-time
import ObservatoireTempsReel from './pages/ObservatoireTempsReel';

// Transparency & reporting
import Transparence from './pages/Transparence';
import SignalerAbus from './pages/SignalerAbus';

/**
 * Root application render with HashRouter for Cloudflare Pages SPA
 * ErrorBoundary is intentionally placed at the highest level
 * to avoid any blank screen in production.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element #root not found');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <HashRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse text-lg">
                      Chargement…
                    </div>
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/carte" replace />} />
                    <Route path="carte" element={<Carte />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="home" element={<Home />} />
                    <Route path="comparateur" element={<Comparateur />} />
                    <Route path="observatoire" element={<Observatoire />} />
                    <Route path="methodologie" element={<Methodologie />} />
                    <Route path="faq" element={<Faq />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="mentions-legales" element={<MentionsLegales />} />
                    
                    {/* Additional feature routes */}
                    <Route path="donnees-publiques" element={<DonneesPubliques />} />
                    <Route path="contribuer" element={<Contribuer />} />
                    <Route path="contribuer-prix" element={<ContribuerPrix />} />
                    <Route path="comparateurs" element={<Comparateurs />} />
                    <Route path="carte-itineraires" element={<CarteItinerairesHub />} />
                    <Route path="comparateur-citoyen" element={<ComparateurCitoyen />} />
                    
                    {/* Scanner & OCR routes */}
                    <Route path="scan" element={<ScannerHub />} />
                    <Route path="scanner" element={<ScannerHub />} />
                    <Route path="scan-ean" element={<ScanEAN />} />
                    <Route path="analyse-photo-produit" element={<ProductPhotoAnalysis />} />
                    <Route path="ocr" element={<OCRHub />} />
                    
                    {/* Comparison & Reporting */}
                    <Route path="comparaison-enseignes" element={<ComparaisonEnseignes />} />
                    <Route path="signalement" element={<SignalerAbus />} />
                    
                    {/* Settings & History */}
                    <Route path="parametres" element={<Settings />} />
                    <Route path="historique-prix" element={<HistoriquePrix />} />
                    <Route path="historique" element={<HistoriquePrix />} />
                    <Route path="recherche-prix" element={<RecherchePrix />} />
                    <Route path="alertes" element={<Alertes />} />
                    
                    {/* Auth routes */}
                    <Route path="login" element={<Login />} />
                    <Route path="connexion" element={<Login />} />
                    <Route path="inscription" element={<Inscription />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="mon-compte" element={<MonCompte />} />
                    
                    {/* Pricing & Subscription */}
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="subscribe" element={<Subscribe />} />
                    <Route path="subscribe/success" element={<Subscribe />} />
                    
                    {/* Observatory real-time */}
                    <Route path="observatoire-temps-reel" element={<ObservatoireTempsReel />} />
                    
                    {/* Transparency & reporting */}
                    <Route path="transparence" element={<Transparence />} />
                    <Route path="signaler-abus" element={<SignalerAbus />} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/carte" replace />} />
                  </Route>
                </Routes>
                <PerformanceMonitor />
              </Suspense>
            </HashRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
