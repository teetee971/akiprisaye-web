import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/globals.css';
import './styles/civic-glass.css';
import './styles/glass.css';
import './styles/mobile-fixes.css';
import Home from './pages/Home';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import NotFound from './pages/NotFound';

// Lazy loading error handler to prevent black screens
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return a fallback component instead of crashing
      return {
        default: () => (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md bg-slate-900 rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-white mb-2">Module non disponible</h2>
              <p className="text-gray-300 mb-4">
                Cette fonctionnalité n'a pas pu être chargée. Veuillez rafraîchir la page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Rafraîchir
              </button>
            </div>
          </div>
        )
      };
    }
  });
}

// Lazy load other pages for better performance with retry logic
const ChatIALocal = lazyWithRetry(() => import('./components/ChatIALocal'));
const ScanOCR = lazyWithRetry(() => import('./pages/ScanOCR'));
const ScanEAN = lazyWithRetry(() => import('./pages/ScanEAN'));
const ComparaisonEnseignes = lazyWithRetry(() => import('./pages/ComparaisonEnseignes'));
const Comparateur = lazyWithRetry(() => import('./pages/Comparateur'));
const Carte = lazyWithRetry(() => import('./pages/Carte'));
const Actualites = lazyWithRetry(() => import('./pages/Actualites'));
const Alertes = lazyWithRetry(() => import('./pages/Alertes'));
const APropos = lazyWithRetry(() => import('./pages/APropos'));
const Methodologie = lazyWithRetry(() => import('./pages/Methodologie'));
const MentionsLegales = lazyWithRetry(() => import('./pages/MentionsLegales'));
const MonCompte = lazyWithRetry(() => import('./pages/MonCompte'));
const Inscription = lazyWithRetry(() => import('./pages/Inscription'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const ComprendrePrix = lazyWithRetry(() => import('./pages/ComprendrePrix'));
const ContribuerPrix = lazyWithRetry(() => import('./pages/ContribuerPrix'));
const SignalerAbus = lazyWithRetry(() => import('./pages/SignalerAbus'));
const Pricing = lazyWithRetry(() => import('./pages/Pricing.tsx'));
const PricingDetailed = lazyWithRetry(() => import('./pages/PricingDetailed'));
const Subscribe = lazyWithRetry(() => import('./pages/Subscribe'));
const LicenceInstitution = lazyWithRetry(() => import('./pages/LicenceInstitution'));
const ContactCollectivites = lazyWithRetry(() => import('./pages/ContactCollectivites'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const IaConseiller = lazyWithRetry(() => import('./pages/IaConseiller'));
const TiPanie = lazyWithRetry(() => import('./pages/TiPanie'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AIDashboard = lazyWithRetry(() => import('./pages/AIDashboard'));
const AiMarketInsights = lazyWithRetry(() => import('./pages/AiMarketInsights'));
const IEVR = lazyWithRetry(() => import('./pages/IEVR'));
const DossierMedia = lazyWithRetry(() => import('./pages/DossierMedia'));
const HistoriquePrix = lazyWithRetry(() => import('./pages/HistoriquePrix'));
const AlertesPrix = lazyWithRetry(() => import('./pages/AlertesPrix'));
const BudgetVital = lazyWithRetry(() => import('./pages/BudgetVital'));
const FauxBonsPlan = lazyWithRetry(() => import('./pages/FauxBonsPlan'));
const BudgetReelMensuel = lazyWithRetry(() => import('./pages/BudgetReelMensuel'));
const ComparateurFormats = lazyWithRetry(() => import('./pages/ComparateurFormats'));
const ListeCourses = lazyWithRetry(() => import('./pages/ListeCourses'));
const CivicModules = lazyWithRetry(() => import('./pages/CivicModules'));
const EvaluationCosmetique = lazyWithRetry(() => import('./pages/EvaluationCosmetique'));
const Observatoire = lazyWithRetry(() => import('./pages/Observatoire'));
const ObservatoryMethodology = lazyWithRetry(() => import('./pages/ObservatoryMethodology'));

// Settings page - Ticket 4
const Settings = lazy(() => import('./pages/Settings'));

// New simplified pages for automatic generation
const HomeSimple = lazyWithRetry(() => import('./pages/Home.tsx'));
const CompareSimple = lazyWithRetry(() => import('./pages/Compare.tsx'));
const NewsSimple = lazyWithRetry(() => import('./pages/News.tsx'));

// PR #1 - Assistant + FAQ étendue (v1.6.0)
const Faq = lazyWithRetry(() => import('./pages/Faq'));

// Comparateur Citoyen - Observatoire data
const ComparateurCitoyen = lazyWithRetry(() => import('./pages/ComparateurCitoyen'));

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
      .register('/service-worker.js')
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

// Global error handlers - production only to avoid interfering with development
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // Prevent default behavior that might cause black screen
    event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent default behavior
    event.preventDefault();
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
                  <Route path='scan-ean' element={<ScanEAN />} />
                  <Route path='comparaison-enseignes' element={<ComparaisonEnseignes />} />
                  <Route path='comparateur' element={<Comparateur />} />
                  <Route path='carte' element={<Carte />} />
                  <Route path='actualites' element={<NewsSimple />} />
                  <Route path='alertes' element={<Alertes />} />
                  <Route path='a-propos' element={<APropos />} />
                  <Route path='methodologie' element={<Methodologie />} />
                  <Route path='mentions-legales' element={<MentionsLegales />} />
                  <Route path='mon-compte' element={<MonCompte />} />
<<<<<<< HEAD
                  <Route path='parametres' element={<Settings />} />
=======
                  <Route path='inscription' element={<Inscription />} />
                  <Route path='login' element={<Login />} />
                  <Route path='reset-password' element={<ResetPassword />} />
                  <Route path='comprendre-prix' element={<ComprendrePrix />} />
                  <Route path='contribuer-prix' element={<ContribuerPrix />} />
                  <Route path='signaler-abus' element={<SignalerAbus />} />
>>>>>>> origin/main
                  <Route path='pricing' element={<Pricing />} />
                  <Route path='pricing-detailed' element={<PricingDetailed />} />
                  <Route path='subscribe' element={<Subscribe />} />
                  <Route path='licence-institution' element={<LicenceInstitution />} />
                  <Route path='contact-collectivites' element={<ContactCollectivites />} />
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
                  <Route path='civic-modules' element={<CivicModules />} />
                  <Route path='evaluation-cosmetique' element={<EvaluationCosmetique />} />
                  <Route path='observatoire' element={<Observatoire />} />
                  <Route path='observatoire/methodologie' element={<ObservatoryMethodology />} />
                  <Route path='comparateur-citoyen' element={<ComparateurCitoyen />} />
                  
                  {/* New simplified pages for automatic generation */}
                  <Route path='comparer' element={<CompareSimple />} />
                  <Route path='tarifs' element={<Pricing />} />
                  
                  {/* PR #1 - Assistant + FAQ étendue (v1.6.0) */}
                  <Route path='faq' element={<Faq />} />
                  
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