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
import { OnboardingProvider } from './context/OnboardingContext';
import { LanguageProvider } from './context/LanguageProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import OnboardingTour from './components/OnboardingTour';
import OnboardingAutoStart from './components/OnboardingAutoStart';
import HelpButton from './components/HelpButton';

// Load debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/onboardingDebug');
}

// Lazy-loaded pages - Main routes
const Home = React.lazy(() => import('./pages/Home'));
const Carte = React.lazy(() => import('./pages/Carte'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Comparateur = React.lazy(() => import('./pages/Comparateur'));

// New Admin pages
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardNew = React.lazy(() => import('./pages/admin/AdminDashboard'));
const StoreList = React.lazy(() => import('./pages/admin/stores/StoreList'));
const StoreForm = React.lazy(() => import('./pages/admin/stores/StoreForm'));
const StoreDetail = React.lazy(() => import('./pages/admin/stores/StoreDetail'));
const ProductList = React.lazy(() => import('./pages/admin/products/ProductList').then(m => ({ default: m.ProductList })));
const ProductForm = React.lazy(() => import('./pages/admin/products/ProductForm').then(m => ({ default: m.ProductForm })));
const ProductDetail = React.lazy(() => import('./pages/admin/products/ProductDetail').then(m => ({ default: m.ProductDetail })));
const ImportPage = React.lazy(() => import('./pages/admin/import/ImportPage'));
const Observatoire = React.lazy(() => import('./pages/Observatoire'));
const Methodologie = React.lazy(() => import('./pages/Methodologie'));
const Faq = React.lazy(() => import('./pages/Faq'));
const Contact = React.lazy(() => import('./pages/Contact'));
const MentionsLegales = React.lazy(() => import('./pages/MentionsLegales'));

// Additional feature pages
const DonneesPubliques = React.lazy(() => import('./pages/DonneesPubliques'));
const Contribuer = React.lazy(() => import('./pages/Contribuer'));
const ContribuerPrix = React.lazy(() => import('./pages/ContribuerPrix'));
const Comparateurs = React.lazy(() => import('./pages/Comparateurs'));
const CarteItinerairesHub = React.lazy(() => import('./pages/CarteItinerairesHub'));
const ComparateurCitoyen = React.lazy(() => import('./pages/ComparateurCitoyen'));

// Scanner & OCR pages
const ScannerHub = React.lazy(() => import('./pages/ScannerHub'));
const OCRHub = React.lazy(() => import('./pages/ocr/OCRHub'));
const ScanEAN = React.lazy(() => import('./pages/ScanEAN'));
const ProductPhotoAnalysis = React.lazy(() => import('./pages/ProductPhotoAnalysis'));
const ComparaisonEnseignes = React.lazy(() => import('./pages/ComparaisonEnseignes'));
const BasketComparison = React.lazy(() => import('./pages/BasketComparison'));

// Settings & History
const Settings = React.lazy(() => import('./pages/Settings'));
const HistoriquePrix = React.lazy(() => import('./pages/HistoriquePrix'));
const RecherchePrix = React.lazy(() => import('./pages/RecherchePrix'));
const Alertes = React.lazy(() => import('./pages/Alertes'));

// Savings Dashboard
const MesEconomies = React.lazy(() => import('./pages/MesEconomies'));

// Auth pages
const Login = React.lazy(() => import('./pages/Login'));
const Inscription = React.lazy(() => import('./pages/Inscription'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const MonCompte = React.lazy(() => import('./pages/MonCompte'));

// Pricing & Subscription
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Subscribe = React.lazy(() => import('./pages/Subscribe'));

// Observatory real-time
const ObservatoireTempsReel = React.lazy(() => import('./pages/ObservatoireTempsReel'));

// Transparency & reporting
const Transparence = React.lazy(() => import('./pages/Transparence'));
const SignalerAbus = React.lazy(() => import('./pages/SignalerAbus'));

// Admin Sync Dashboard
const SyncDashboard = React.lazy(() => import('./pages/admin/sync/SyncDashboard'));

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
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <OnboardingProvider>
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
                  {/* Admin routes with dedicated layout */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardNew />} />
                    <Route path="stores" element={<StoreList />} />
                    <Route path="stores/new" element={<StoreForm />} />
                    <Route path="stores/:id" element={<StoreDetail />} />
                    <Route path="stores/:id/edit" element={<StoreForm />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="products/:id/edit" element={<ProductForm />} />
                    <Route path="import" element={<ImportPage />} />
                    <Route path="sync" element={<SyncDashboard />} />
                  </Route>
                  
                  {/* Main site routes */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/carte" replace />} />
                    <Route path="carte" element={<Carte />} />
                    <Route path="carte-interactive" element={<MapPage />} />
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
                    <Route path="comparaison-panier" element={<BasketComparison />} />
                    <Route path="signalement" element={<SignalerAbus />} />
                    
                    {/* Settings & History */}
                    <Route path="parametres" element={<Settings />} />
                    <Route path="historique-prix" element={<HistoriquePrix />} />
                    <Route path="historique" element={<HistoriquePrix />} />
                    <Route path="recherche-prix" element={<RecherchePrix />} />
                    <Route path="alertes" element={<Alertes />} />
                    
                    {/* Savings Dashboard */}
                    <Route path="mes-economies" element={<MesEconomies />} />
                    <Route path="tableau-de-bord" element={<MesEconomies />} />
                    
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
                    
                    {/* Admin routes */}
                    <Route path="admin/sync" element={<SyncDashboard />} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/carte" replace />} />
                  </Route>
                </Routes>
                <PerformanceMonitor />
                <OnboardingAutoStart />
                <OnboardingTour />
                <HelpButton />
              </Suspense>
            </HashRouter>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
    </React.StrictMode>
  );
}
