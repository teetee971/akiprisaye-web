import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/glass.css';
import Home from './pages/Home';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import NotFound from './pages/NotFound';

// Lazy load other pages for better performance
const ChatIALocal = lazy(() => import('./components/ChatIALocal'));
const ScanOCR = lazy(() => import('./pages/ScanOCR'));
const Comparateur = lazy(() => import('./pages/Comparateur'));
const Carte = lazy(() => import('./pages/Carte'));
const Actualites = lazy(() => import('./pages/Actualites'));
const Alertes = lazy(() => import('./pages/Alertes'));
const APropos = lazy(() => import('./pages/APropos'));
const Methodologie = lazy(() => import('./pages/Methodologie'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const MonCompte = lazy(() => import('./pages/MonCompte'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Contact = lazy(() => import('./pages/Contact'));
const IaConseiller = lazy(() => import('./pages/IaConseiller'));
const TiPanie = lazy(() => import('./pages/TiPanie'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AIDashboard = lazy(() => import('./pages/AIDashboard'));
const AiMarketInsights = lazy(() => import('./pages/AiMarketInsights'));
const IEVR = lazy(() => import('./pages/IEVR'));
const DossierMedia = lazy(() => import('./pages/DossierMedia'));
const HistoriquePrix = lazy(() => import('./pages/HistoriquePrix'));
const AlertesPrix = lazy(() => import('./pages/AlertesPrix'));
const BudgetVital = lazy(() => import('./pages/BudgetVital'));
const FauxBonsPlan = lazy(() => import('./pages/FauxBonsPlan'));
const BudgetReelMensuel = lazy(() => import('./pages/BudgetReelMensuel'));
const ComparateurFormats = lazy(() => import('./pages/ComparateurFormats'));
const ListeCourses = lazy(() => import('./pages/ListeCourses'));

// Loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">Chargement...</p>
      </div>
    </div>
  );
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        if (import.meta.env.DEV) {
          console.log('Service Worker enregistré');
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('Erreur SW :', err);
        }
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path='/' element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path='chat' element={<ChatIALocal />} />
                  <Route path='scan' element={<ScanOCR />} />
                  <Route path='comparateur' element={<Comparateur />} />
                  <Route path='carte' element={<Carte />} />
                  <Route path='actualites' element={<Actualites />} />
                  <Route path='alertes' element={<Alertes />} />
                  <Route path='a-propos' element={<APropos />} />
                  <Route path='methodologie' element={<Methodologie />} />
                  <Route path='mentions-legales' element={<MentionsLegales />} />
                  <Route path='mon-compte' element={<MonCompte />} />
                  <Route path='pricing' element={<Pricing />} />
                  <Route path='contact' element={<Contact />} />
                  <Route path='ia-conseiller' element={<IaConseiller />} />
                  <Route path='ti-panie' element={<TiPanie />} />
                  <Route path='admin/dashboard' element={<AdminDashboard />} />
                  <Route path='admin/ai-dashboard' element={<AIDashboard />} />
                  <Route path='admin/ai-market-insights' element={<AiMarketInsights />} />
                  <Route path='ievr' element={<IEVR />} />
                  <Route path='dossier-media' element={<DossierMedia />} />
                  <Route path='historique-prix' element={<HistoriquePrix />} />
                  <Route path='alertes-prix' element={<AlertesPrix />} />
                  <Route path='budget-vital' element={<BudgetVital />} />
                  <Route path='faux-bons-plans' element={<FauxBonsPlan />} />
                  <Route path='budget-reel-mensuel' element={<BudgetReelMensuel />} />
                  <Route path='comparateur-formats' element={<ComparateurFormats />} />
                  <Route path='liste-courses' element={<ListeCourses />} />
                  <Route path='*' element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);