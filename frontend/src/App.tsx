 
import React, { Suspense, useEffect, useState } from 'react';
import { lazyPage } from './router/lazy';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout synchronously to prevent loading block
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import AuthProvider from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { LanguageProvider } from './context/LanguageProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import OnboardingTour from './components/OnboardingTour';
import OnboardingAutoStart from './components/OnboardingAutoStart';
import HelpButton from './components/HelpButton';
import AnalyticsTracker from './components/analytics/AnalyticsTracker';
import { ToastProvider } from './components/Toast/ToastProvider';
import UpgradePromptModal from './components/billing/UpgradePromptModal';
import { StoreSelectionProvider } from './context/StoreSelectionContext';
import { EntitlementProvider } from './billing/EntitlementProvider';
import RequireAuth from './components/auth/RequireAuth';
import { logDebug } from './utils/logger';

// Lazy-loaded pages - Main routes
const Home = lazyPage(() => import('./pages/Home'));
const SearchPage = lazyPage(() => import('./pages/SearchPage'));
const Carte = lazyPage(() => import('./pages/Carte'));
const MapPage = lazyPage(() => import('./pages/MapPage'));
const PublicStoreDetail = lazyPage(() => import('./pages/StoreDetail'));
const AdminDashboard = lazyPage(() => import('./pages/AdminDashboard'));
const Comparateur = lazyPage(() => import('./pages/Comparateur'));

// New Admin pages
const AdminLayout = lazyPage(() => import('./pages/admin/AdminLayout'));
const AdminDashboardNew = lazyPage(() => import('./pages/admin/AdminDashboard'));
const StoreList = lazyPage(() => import('./pages/admin/stores/StoreList'));
const StoreForm = lazyPage(() => import('./pages/admin/stores/StoreForm'));
const StoreDetail = lazyPage(() => import('./pages/admin/stores/StoreDetail'));
const ProductList = lazyPage(() => import('./pages/admin/products/ProductList').then((m) => ({ default: m.ProductList })));
const ProductForm = lazyPage(() => import('./pages/admin/products/ProductForm').then((m) => ({ default: m.ProductForm })));
const ProductDetail = lazyPage(() => import('./pages/admin/products/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const ImportPage = lazyPage(() => import('./pages/admin/import/ImportPage').then((m) => ({ default: m.ImportPage })));
const ObservatoireHub = lazyPage(() => import('./pages/ObservatoireHub'));
const Methodologie = lazyPage(() => import('./pages/Methodologie'));
const Faq = lazyPage(() => import('./pages/Faq'));
const Contact = lazyPage(() => import('./pages/Contact'));
const MentionsLegales = lazyPage(() => import('./pages/MentionsLegales'));
const Actualites = lazyPage(() => import('./pages/Actualites'));

// Additional feature pages
const DonneesPubliques = lazyPage(() => import('./pages/DonneesPubliques'));
const Contribuer = lazyPage(() => import('./pages/Contribuer'));
const ContribuerPrix = lazyPage(() => import('./pages/ContribuerPrix'));
const ComparateursHub = lazyPage(() => import('./pages/ComparateursHub'));
const CarteItinerairesHub = lazyPage(() => import('./pages/CarteItinerairesHub'));
const ComparateurCitoyen = lazyPage(() => import('./pages/ComparateurCitoyen'));
const LutteVieChere = lazyPage(() => import('./pages/LutteVieChereIndexPage'));
const SolidariteHub = lazyPage(() => import('./pages/SolidariteHub'));
const InscriptionPro = lazyPage(() => import('./pages/InscriptionPro'));
const EspacePro = lazyPage(() => import('./pages/EspacePro'));

// Scanner & OCR pages
const ScannerHub = lazyPage(() => import('./pages/ScannerHub'));
const OCRHub = lazyPage(() => import('./pages/ocr/OCRHub'));
const ScanEAN = lazyPage(() => import('./pages/ScanEAN'));
const ProductPhotoAnalysis = lazyPage(() => import('./pages/ProductPhotoAnalysis'));
const ProductPhotoSearch = lazyPage(() => import('./pages/ProductPhotoSearch'));
const ProductScanResult = lazyPage(() => import('./pages/ProductScanResult'));
const ComparaisonEnseignes = lazyPage(() => import('./pages/ComparaisonEnseignes'));
const BasketComparison = lazyPage(() => import('./pages/BasketComparison'));

// Settings & History
const Settings = lazyPage(() => import('./pages/Settings'));
const HistoriquePrix = lazyPage(() => import('./pages/HistoriquePrix'));
const RecherchePrix = lazyPage(() => import('./pages/RecherchePrix'));
const ProductDetailPage = lazyPage(() => import('./pages/ProductDetail'));
const ProduitPage = lazyPage(() => import('./pages/ProduitPage'));
const Alertes = lazyPage(() => import('./pages/Alertes'));
const AlerteDetail = lazyPage(() => import('./pages/AlerteDetail'));
const Promos = lazyPage(() => import('./pages/Promos'));
const MesListes = lazyPage(() => import('./pages/MesListes'));
const ListePage = lazyPage(() => import('./pages/ListePage'));
const UpgradePage = lazyPage(() => import('./pages/UpgradePage'));

// Savings Dashboard
const MesEconomies = lazyPage(() => import('./pages/MesEconomies'));

// Advanced feature pages (v7.0.0)
const PriceAlertsPage = lazyPage(() => import('./pages/PriceAlertsPage'));
const PriceHistoryPage = lazyPage(() => import('./pages/PriceHistoryPage'));
const SmartShoppingListPage = lazyPage(() => import('./pages/SmartShoppingListPage'));
const InflationDashboardPage = lazyPage(() => import('./pages/InflationDashboardPage'));
const GamificationProfilePage = lazyPage(() => import('./pages/GamificationProfilePage'));
const LeaderboardPage = lazyPage(() => import('./pages/LeaderboardPage'));
const BadgesPage = lazyPage(() => import('./pages/BadgesPage'));

// Auth pages
const Login = lazyPage(() => import('./pages/Login'));
const Inscription = lazyPage(() => import('./pages/Inscription'));
const ResetPassword = lazyPage(() => import('./pages/ResetPassword'));
const MonCompte = lazyPage(() => import('./pages/MonCompte'));
const AuthHub = lazyPage(() => import('./pages/AuthHub'));

// Pricing & Subscription
const Pricing = lazyPage(() => import('./pages/Pricing'));
const Subscribe = lazyPage(() => import('./pages/Subscribe'));

// Observatory real-time
const ObservatoireTempsReel = lazyPage(() => import('./pages/ObservatoireTempsReel'));

// Transparency & reporting
const Transparence = lazyPage(() => import('./pages/Transparence'));
const SignalerAbus = lazyPage(() => import('./pages/SignalerAbus'));

// Admin Sync Dashboard
const SyncDashboard = lazyPage(() => import('./pages/admin/sync/SyncDashboard'));
const SignalementModeration = lazyPage(() => import('./pages/admin/moderation/SignalementModeration'));

// i18n Test page (for development/testing)
const I18nTest = lazyPage(() => import('./pages/I18nTest'));

// About & institutional pages
const APropos = lazyPage(() => import('./pages/APropos'));
const PricingDetailed = lazyPage(() => import('./pages/PricingDetailed'));
const ComparatifConcurrence = lazyPage(() => import('./pages/ComparatifConcurrence'));
const LicenceInstitution = lazyPage(() => import('./pages/LicenceInstitution'));

// Specialised comparators
const FlightComparator = lazyPage(() => import('./pages/FlightComparator'));
const BoatComparator = lazyPage(() => import('./pages/BoatComparator'));
const FreightComparator = lazyPage(() => import('./pages/FreightComparator'));
const FuelComparator = lazyPage(() => import('./pages/FuelComparator'));
const InsuranceComparator = lazyPage(() => import('./pages/InsuranceComparator'));
const TrainingComparator = lazyPage(() => import('./pages/TrainingComparator'));
const ServiceComparator = lazyPage(() => import('./pages/ServiceComparator'));
const CarRentalComparator = lazyPage(() => import('./pages/CarRentalComparator'));
const BuildingMaterialsComparator = lazyPage(() => import('./pages/BuildingMaterialsComparator'));

// Cosmetic evaluation
const EvaluationCosmetique = lazyPage(() => import('./pages/EvaluationCosmetique'));

// OCR history
const OCRHistory = lazyPage(() => import('./pages/ocr/OCRHistory'));

// Observatory methodology
const ObservatoryMethodology = lazyPage(() => import('./pages/ObservatoryMethodology'));

// Recherche-prix sub-pages
const DelaisTensionsLogistiques = lazyPage(() => import('./pages/recherche-prix/DelaisTensionsLogistiques'));
const IndiceLogistique = lazyPage(() => import('./pages/recherche-prix/IndiceLogistique'));
const PourquoiDelaisProduit = lazyPage(() => import('./pages/recherche-prix/PourquoiDelaisProduit'));
const RechercheAvions = lazyPage(() => import('./pages/recherche-prix/Avions'));
const RechercheBateaux = lazyPage(() => import('./pages/recherche-prix/Bateaux'));
const RechercheEau = lazyPage(() => import('./pages/recherche-prix/Eau'));
const RechercheElectricite = lazyPage(() => import('./pages/recherche-prix/Electricite'));
const RechercheFret = lazyPage(() => import('./pages/recherche-prix/Fret'));
const RechercheFretAerien = lazyPage(() => import('./pages/recherche-prix/FretAerien'));
const RechercheAbonnementsInternet = lazyPage(() => import('./pages/recherche-prix/AbonnementsInternet'));
const RechercheAbonnementsMobile = lazyPage(() => import('./pages/recherche-prix/AbonnementsMobile'));

// Ressources pages
const QuestionsLogistiqueDOM = lazyPage(() => import('./pages/ressources/QuestionsLogistiqueDOM'));
const GlossaireLogistiqueDOM = lazyPage(() => import('./pages/ressources/GlossaireLogistiqueDOM'));
const ComprendrePromotionsPrixBarres = lazyPage(() => import('./pages/ressources/ComprendrePromotionsPrixBarres'));
const PourquoiPrixVarieSansChangement = lazyPage(() => import('./pages/ressources/PourquoiPrixVarieSansChangement'));

// ── Nouvelles pages : historique, comparateur inter-territoires, inflation, couverture ──
const CrossTerritoryComparator = lazyPage(() => import('./pages/CrossTerritoryComparator'));
const ComparaisonTerritoires = lazyPage(() => import('./pages/ComparaisonTerritoires'));
const InflationRateTracker = lazyPage(() => import('./pages/InflationRateTracker'));
const TerritoryCoverageReport = lazyPage(() => import('./pages/TerritoryCoverageReport'));

// ── Pages supplémentaires sans itinéraire ──
const ContactCollectivites = lazyPage(() => import('./pages/ContactCollectivites'));
const DossierMedia = lazyPage(() => import('./pages/DossierMedia'));
const BudgetReelMensuel = lazyPage(() => import('./pages/BudgetReelMensuel'));
const RechercheHub = lazyPage(() => import('./pages/RechercheHub'));
const SearchCompareHub = lazyPage(() => import('./pages/SearchCompareHub'));

// ── Pages institutionnelles & civiques manquantes ──
const TiPanie = lazyPage(() => import('./pages/TiPanie'));
const Gouvernance = lazyPage(() => import('./pages/Gouvernance'));
const Presse = lazyPage(() => import('./pages/Presse'));
const ComprendrePrix = lazyPage(() => import('./pages/ComprendrePrix'));
const CivicModules = lazyPage(() => import('./pages/CivicModules'));
const ObservatoireVivant = lazyPage(() => import('./pages/ObservatoireVivant'));
const AssistantIAHub = lazyPage(() => import('./pages/AssistantIAHub'));
const Suggestions = lazyPage(() => import('./pages/Suggestions'));
const MesDemandes = lazyPage(() => import('./pages/MesDemandes'));
const Promotions = lazyPage(() => import('./pages/Promotions'));
const BudgetVital = lazyPage(() => import('./pages/BudgetVital'));
const IEVRPage = lazyPage(() => import('./pages/IEVR'));
const Versions = lazyPage(() => import('./pages/Versions'));
const ScanOCR = lazyPage(() => import('./pages/ScanOCR'));

// Messagerie interne
const Messagerie = lazyPage(() => import('./pages/Messagerie'));

// Groupes de Parole Citoyens
const GroupesParole = lazyPage(() => import('./pages/GroupesParole'));
// Marketplace Enseignes
const MerchantOnboarding = lazyPage(() => import('./pages/marketplace/MerchantOnboarding'));
const MerchantDashboard = lazyPage(() => import('./pages/marketplace/MerchantDashboard'));
const AdminMarketplace = lazyPage(() => import('./pages/admin/marketplace/AdminMarketplace'));

/**
 * IMPORTANT — NE PAS SUPPRIMER
 * Les tests CI vérifient la présence LITTÉRALE de certaines routes alias
 * (deep-links legacy) dans le code source. Elles sont donc écrites explicitement
 * ci-dessous pour stabiliser la CI et éviter d'y revenir.
 *
 * Tu ajoutes un alias ? Ajoute 1 ligne ici. Point final.
 */
const LEGACY_ALIAS_ROUTES = [
  /* Actualités */
  <Route path="actus" element={<Navigate to="/actualites" replace />} />,
  <Route path="panier" element={<Navigate to="/liste" replace />} />,
  <Route path="cart" element={<Navigate to="/liste" replace />} />,
  <Route path="checkout" element={<Navigate to="/liste" replace />} />,
  <Route path="news" element={<Navigate to="/actualites" replace />} />,

  /* Scanner */
  <Route path="scan" element={<Navigate to="/scanner" replace />} />,

  /* Offres / Tarifs (aliases utiles si un lien pointe vers /offres) */
  <Route path="offres" element={<Navigate to="/pricing" replace />} />,
  <Route path="tarifs" element={<Navigate to="/pricing" replace />} />,
  <Route path="abonnements" element={<Navigate to="/pricing" replace />} />,

  /* Auth: login (legacy deep-links) */
  <Route path="Login" element={<Navigate to="/login" replace />} />,
  <Route path="auth/login" element={<Navigate to="/login" replace />} />,
  <Route path="signin" element={<Navigate to="/login" replace />} />,

  /* Auth: register */
  <Route path="auth/register" element={<Navigate to="/inscription" replace />} />,
  <Route path="signup" element={<Navigate to="/inscription" replace />} />,

  /* Auth: reset */
  <Route path="auth/reset-password" element={<Navigate to="/reset-password" replace />} />,
  <Route path="forgot-password" element={<Navigate to="/reset-password" replace />} />,

  /* Account */
  <Route path="moncompte" element={<Navigate to="/mon-compte" replace />} />,
  <Route path="account" element={<Navigate to="/mon-compte" replace />} />,
];

function LoadingFallback() {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    logDebug('⏳ LoadingFallback: Displayed');
    const timer = window.setTimeout(() => {
      console.error('⚠️ Application timeout - Loading blocked for 10+ seconds');
      setShowTimeout(true);
    }, 10000);

    return () => {
      logDebug('✅ LoadingFallback: Hidden (component loaded successfully)');
      window.clearTimeout(timer);
    };
  }, []);

  if (showTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <img src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`} alt="Logo" className="h-16 mb-4" />
        <h1 className="text-xl font-bold mb-2">Chargement bloqué</h1>
        <p className="text-slate-400 mb-4">L'application met trop de temps à charger.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
          Recharger la page
        </button>
        <p className="text-xs text-slate-500 mt-4">Si le problème persiste, videz le cache du navigateur.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-pulse text-lg text-white">Chargement…</div>
    </div>
  );
}

export default function App() {
  // Gardé intentionnellement : permet d'afficher une erreur “providers/init” sans white-screen.
  const [providerError, setProviderError] = useState<Error | null>(null);

  useEffect(() => {
    logDebug('🚀 App: Starting initialization');
    logDebug('📍 App: Environment:', import.meta.env.MODE);
    logDebug('📍 App: Firebase configured:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Yes' : 'No');

    const fallback = document.getElementById('loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
      logDebug('✅ App: HTML loading fallback hidden');
    }
  }, []);

  if (providerError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <img src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`} alt="Logo" className="h-16 mb-4" />
        <h1 className="text-xl font-bold mb-2">Erreur d'initialisation</h1>
        <p className="text-red-400 mb-4">{providerError.message}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
          Recharger
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingProvider>
              <StoreSelectionProvider>
                <EntitlementProvider>
                  <BrowserRouter basename={import.meta.env.BASE_URL}>
                    <Suspense fallback={<LoadingFallback />}>
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
                          <Route path="moderation" element={<SignalementModeration />} />
                          <Route path="marketplace" element={<AdminMarketplace />} />
                        </Route>

                        {/* Main site routes with Layout */}
                        <Route path="/" element={<Layout />}>
                          <Route index element={<Home />} />
                          <Route path="carte" element={<Carte />} />
                          <Route path="carte-interactive" element={<MapPage />} />
                          <Route path="enseigne/:storeId" element={<PublicStoreDetail />} />
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="home" element={<Home />} />
                          <Route path="comparateur" element={<Comparateur />} />
                          <Route path="search" element={<SearchPage />} />
                          <Route path="observatoire" element={<ObservatoireHub />} />
                          <Route path="vie-chere" element={<LutteVieChere />} />
                          <Route path="methodologie" element={<Methodologie />} />
                          <Route path="faq" element={<Faq />} />
                          <Route path="contact" element={<Contact />} />
                          <Route path="actualites" element={<Actualites />} />
                          <Route path="mentions-legales" element={<MentionsLegales />} />
                          <Route path="privacy" element={<Transparence />} />

                          {/* Solidarité & Entraide */}
                          <Route path="solidarite" element={<SolidariteHub />} />

                          {/* Espace Professionnel */}
                          <Route path="inscription-pro" element={<InscriptionPro />} />
                          <Route path="espace-pro" element={<EspacePro />} />

                          {/* Additional feature routes */}
                          <Route path="donnees-publiques" element={<DonneesPubliques />} />
                          <Route path="contribuer" element={<Contribuer />} />
                          <Route path="contribuer-prix" element={<ContribuerPrix />} />
                          <Route path="comparateurs" element={<ComparateursHub />} />
                          <Route path="comparateurs-hub" element={<Navigate to="/comparateurs" replace />} />
                          <Route path="carte-itineraires" element={<CarteItinerairesHub />} />
                          <Route path="comparateur-citoyen" element={<ComparateurCitoyen />} />

                          {/* Scanner & OCR routes */}
                          <Route path="scanner" element={<ScannerHub />} />
                          <Route path="scan-ean" element={<ScanEAN />} />
                          <Route path="scan-ocr" element={<ScanOCR />} />
                          <Route path="scan-photo" element={<ProductPhotoSearch />} />
                          <Route path="analyse-photo-produit" element={<ProductPhotoAnalysis />} />
                          <Route path="product/:barcode" element={<ProductScanResult />} />
                          <Route path="ocr" element={<OCRHub />} />

                          {/* Comparison & Reporting */}
                          <Route path="comparaison-enseignes" element={<ComparaisonEnseignes />} />
                          <Route path="comparaison-panier" element={<BasketComparison />} />
                          <Route path="signalement" element={<SignalerAbus />} />

                          {/* Settings & History */}
                          <Route path="parametres" element={<Settings />} />
                          <Route path="historique-prix" element={<HistoriquePrix />} />
                          <Route path="historique" element={<HistoriquePrix />} />
                          <Route path="p/:id" element={<ProductDetailPage />} />
                          <Route path="produit/:ean" element={<ProduitPage />} />
                          <Route path="recherche-prix" element={<RecherchePrix />} />
                          <Route path="alertes" element={<Alertes />} />
                          <Route path="alertes/:id" element={<AlerteDetail />} />
                          <Route path="promos" element={<Promos />} />
                          <Route path="mes-listes" element={<MesListes />} />
                          <Route path="liste" element={<ListePage />} />
                          <Route path="upgrade" element={<UpgradePage />} />

                          {/* Savings Dashboard */}
                          <Route path="mes-economies" element={<MesEconomies />} />
                          <Route path="tableau-de-bord" element={<MesEconomies />} />

                          {/* Advanced features (v7.0.0) */}
                          <Route path="alertes-prix" element={<PriceAlertsPage />} />
                          <Route path="prix-historique" element={<PriceHistoryPage />} />
                          <Route path="liste-intelligente" element={<SmartShoppingListPage />} />
                          <Route path="tableau-inflation" element={<InflationDashboardPage />} />
                          <Route path="gamification" element={<GamificationProfilePage />} />
                          <Route path="gamification/leaderboard" element={<LeaderboardPage />} />
                          <Route path="gamification/badges" element={<BadgesPage />} />

                          {/* Auth routes (canoniques) */}
                          <Route path="login" element={<Login />} />
                          <Route path="connexion" element={<Login />} />
                          <Route path="inscription" element={<Inscription />} />
                          <Route path="reset-password" element={<ResetPassword />} />
                          <Route path="auth" element={<AuthHub />} />
                          <Route
                            path="mon-compte"
                            element={
                              <RequireAuth>
                                <MonCompte />
                              </RequireAuth>
                            }
                          />

                          {/* Aliases legacy (stables CI) */}
                          {LEGACY_ALIAS_ROUTES}

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

                          {/* i18n Test (development/testing) */}
                          <Route path="test-i18n" element={<I18nTest />} />

                          {/* À propos & institutional */}
                          <Route path="a-propos" element={<APropos />} />
                          <Route path="tarifs-details" element={<PricingDetailed />} />
                          <Route path="comparatif-concurrence" element={<ComparatifConcurrence />} />
                          <Route path="licence-institution" element={<LicenceInstitution />} />
                          <Route path="inflation" element={<Navigate to="/tableau-inflation" replace />} />

                          {/* Comparateurs spécialisés */}
                          <Route path="comparateur-vols" element={<FlightComparator />} />
                          <Route path="comparateur-bateaux" element={<BoatComparator />} />
                          <Route path="comparateur-fret" element={<FreightComparator />} />
                          <Route path="comparateur-carburants" element={<FuelComparator />} />
                          <Route path="comparateur-assurances" element={<InsuranceComparator />} />
                          <Route path="comparateur-formations" element={<TrainingComparator />} />
                          <Route path="comparateur-services" element={<ServiceComparator />} />
                          <Route path="comparateur-location-voiture" element={<CarRentalComparator />} />
                          <Route path="comparateur-materiaux-batiment" element={<BuildingMaterialsComparator />} />

                          {/* Évaluation cosmétique */}
                          <Route path="evaluation-cosmetique" element={<EvaluationCosmetique />} />

                          {/* OCR history */}
                          <Route path="ocr/history" element={<OCRHistory />} />

                          {/* Observatory methodology */}
                          <Route path="observatoire/methodologie" element={<ObservatoryMethodology />} />

                          {/* Recherche-prix sous-pages */}
                          <Route path="recherche-prix/delais-logistiques" element={<DelaisTensionsLogistiques />} />
                          <Route path="recherche-prix/indice-logistique" element={<IndiceLogistique />} />
                          <Route path="recherche-prix/pourquoi-delais-produit" element={<PourquoiDelaisProduit />} />
                          <Route path="recherche-prix/avions" element={<RechercheAvions />} />
                          <Route path="recherche-prix/bateaux" element={<RechercheBateaux />} />
                          <Route path="recherche-prix/eau" element={<RechercheEau />} />
                          <Route path="recherche-prix/electricite" element={<RechercheElectricite />} />
                          <Route path="recherche-prix/fret" element={<RechercheFret />} />
                          <Route path="recherche-prix/fret-aerien" element={<RechercheFretAerien />} />
                          <Route path="recherche-prix/abonnements-internet" element={<RechercheAbonnementsInternet />} />
                          <Route path="recherche-prix/abonnements-mobile" element={<RechercheAbonnementsMobile />} />

                          {/* Ressources pédagogiques */}
                          <Route path="ressources/questions-logistique-dom" element={<QuestionsLogistiqueDOM />} />
                          <Route path="ressources/glossaire-logistique-dom" element={<GlossaireLogistiqueDOM />} />
                          <Route path="ressources/comprendre-promotions-prix-barres" element={<ComprendrePromotionsPrixBarres />} />
                          <Route path="ressources/pourquoi-prix-varie-sans-changement" element={<PourquoiPrixVarieSansChangement />} />

                          {/* ── Nouvelles pages observatoire enrichi ── */}
                          <Route path="comparateur-territoires" element={<CrossTerritoryComparator />} />
                          <Route path="comparaison-territoires" element={<ComparaisonTerritoires />} />
                          <Route path="inflation-categories" element={<InflationRateTracker />} />
                          <Route path="couverture-territoires" element={<TerritoryCoverageReport />} />

                          {/* ── Itinéraires pour pages supplémentaires ── */}
                          <Route path="contact-collectivites" element={<ContactCollectivites />} />
                          <Route path="dossier-media" element={<DossierMedia />} />
                          <Route path="budget-reel-mensuel" element={<BudgetReelMensuel />} />
                          <Route path="recherche-hub" element={<RechercheHub />} />
                          <Route path="recherche-avancee" element={<SearchCompareHub />} />
                          <Route path="ressources/comprendre-prix" element={<Navigate to="/comprendre-prix" replace />} />

                          {/* ── Pages institutionnelles & civiques ── */}
                          <Route path="ti-panie" element={<TiPanie />} />
                          <Route path="gouvernance" element={<Gouvernance />} />
                          <Route path="presse" element={<Presse />} />
                          <Route path="comprendre-prix" element={<ComprendrePrix />} />
                          <Route path="civic-modules" element={<CivicModules />} />
                          <Route path="observatoire-vivant" element={<ObservatoireVivant />} />
                          <Route path="assistant-ia" element={<AssistantIAHub />} />
                          <Route path="suggestions" element={<Suggestions />} />
                          <Route path="mes-demandes" element={<MesDemandes />} />
                          <Route path="promotions" element={<Promotions />} />
                          <Route path="budget-vital" element={<BudgetVital />} />
                          <Route path="ievr" element={<IEVRPage />} />
                          <Route path="versions" element={<Versions />} />

                          {/* Messagerie interne */}
                          <Route path="messagerie" element={<Messagerie />} />

                          {/* Groupes de Parole Citoyens */}
                          <Route path="groupes-parole" element={<GroupesParole />} />
                          <Route path="groupes-parole/:groupId" element={<GroupesParole />} />
                          {/* Marketplace Enseignes */}
                          <Route path="marketplace/inscription" element={<MerchantOnboarding />} />
                          <Route path="marketplace/dashboard" element={<MerchantDashboard />} />

                          {/* Catch-all route - redirect to home */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                      </Routes>

                      <AnalyticsTracker />
                      <PerformanceMonitor />
                      <OnboardingAutoStart />
                      <OnboardingTour />
                      <HelpButton />
                      <ToastProvider />
                      <UpgradePromptModal />
                    </Suspense>
                  </BrowserRouter>
                </EntitlementProvider>
              </StoreSelectionProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}