// src/pages/MonCompte.tsx
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { ALERTS_STORAGE_KEY } from "@/services/priceAlertsStorage";
import { Heart, Bell, Globe, CreditCard, User as UserIcon, Trash2, MessageCircle } from "lucide-react";

import { SEOHead } from '../components/ui/SEOHead';
const TERRITORY_STORAGE_KEY = 'akiprisaye:main_territory:v1';

const TERRITORY_OPTIONS = [
  { value: 'GP', label: '🏝️ Guadeloupe' },
  { value: 'MQ', label: '🏝️ Martinique' },
  { value: 'GF', label: '🌴 Guyane' },
  { value: 'RE', label: '🌋 La Réunion' },
  { value: 'YT', label: '🏖️ Mayotte' },
];

type Tab = 'profil' | 'favoris' | 'alertes' | 'territoire' | 'plan';

export default function MonCompte() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const [territory, setTerritory] = useState<string>('GP');
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  useEffect(() => {
    const unsubscribe = auth ? onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }) : (() => { setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const saved = safeLocalStorage?.getItem(TERRITORY_STORAGE_KEY);
    if (saved) setTerritory(saved);
    const rawAlerts = safeLocalStorage?.getItem(ALERTS_STORAGE_KEY);
    if (rawAlerts) {
      try { setAlerts(JSON.parse(rawAlerts) ?? []); } catch { /* ignore */ }
    }
  }, []);

  const handleTerritoryChange = (value: string) => {
    setTerritory(value);
    safeLocalStorage?.setItem(TERRITORY_STORAGE_KEY, value);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth!);
      navigate("/");
    } catch (err) {
      alert("Erreur lors de la déconnexion : " + err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-900/30 border-purple-700 text-purple-200",
    creator: "bg-amber-900/30 border-amber-700 text-amber-200",
    observateur: "bg-blue-900/30 border-blue-700 text-blue-200",
    citoyen: "bg-green-900/30 border-green-700 text-green-200",
    guest: "bg-gray-900/30 border-gray-700 text-gray-200",
  };
  const roleLabels: Record<string, string> = {
    admin: "Administrateur", creator: "Créateur", observateur: "Observateur",
    citoyen: "Citoyen", guest: "Invité",
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'favoris', label: 'Favoris', icon: <Heart className="w-4 h-4" />, badge: favorites.length || undefined },
    { id: 'alertes', label: 'Alertes', icon: <Bell className="w-4 h-4" />, badge: alerts.length || undefined },
    { id: 'territoire', label: 'Territoire', icon: <Globe className="w-4 h-4" /> },
    { id: 'plan', label: 'Mon plan', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <>
      <SEOHead
        title="Mon compte — Gérez votre profil et vos alertes de prix"
        description="Accédez à votre espace personnel : historique de contributions, alertes de prix, préférences et données de profil."
        canonical="https://teetee971.github.io/akiprisaye-web/mon-compte"
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <HeroImage
            src={PAGE_HERO_IMAGES.monCompte}
            alt="Mon compte"
            gradient="from-slate-950 to-slate-800"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              👤 Mon compte
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              Gérez votre profil, vos alertes et vos préférences
            </p>
          </HeroImage>
        </div>
        <div className="bg-slate-900 rounded-2xl shadow-lg overflow-hidden">

          {/* Tabs */}
          <div role="tablist" aria-label="Sections du compte" className="flex overflow-x-auto border-b border-slate-700 px-6 pt-4 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  const ids = tabs.map(t => t.id);
                  const idx = ids.indexOf(tab.id);
                  if (e.key === 'ArrowRight') setActiveTab(ids[(idx + 1) % ids.length]);
                  if (e.key === 'ArrowLeft') setActiveTab(ids[(idx - 1 + ids.length) % ids.length]);
                  if (e.key === 'Home') setActiveTab(ids[0]);
                  if (e.key === 'End') setActiveTab(ids[ids.length - 1]);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white border border-slate-700 border-b-slate-800 -mb-px'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[1.2em] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profil */}
            {activeTab === 'profil' && (
              <div role="tabpanel" id="tabpanel-profil" aria-labelledby="tab-profil">
                <h2 className="text-xl font-semibold text-white mb-4">Informations du compte</h2>
                <div className="space-y-3 text-gray-300 mb-6">
                  <div className="flex items-start gap-2">
                    <strong className="min-w-[100px]">Email:</strong>
                    <span>{user.email || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="min-w-[100px]">Nom:</strong>
                    <span>{user.displayName || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="min-w-[100px]">Rôle:</strong>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleColors[userRole as string] || roleColors.guest}`}>
                      <span className="font-medium">{roleLabels[userRole as string] || "Utilisateur"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="min-w-[100px]">Statut:</strong>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-200">Connecté</span>
                    </div>
                  </div>
                </div>

                {/* Messagerie shortcut */}
                <Link
                  to="/messagerie"
                  className="flex items-center gap-3 mb-4 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg hover:bg-indigo-900/50 transition-colors group"
                >
                  <MessageCircle className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-indigo-200">💬 Messagerie interne</p>
                    <p className="text-indigo-300 text-sm">Discutez avec d'autres utilisateurs inscrits.</p>
                  </div>
                  <span className="text-indigo-400 text-xs font-semibold">Ouvrir →</span>
                </Link>

                {/* Groupes de Parole shortcut */}
                <Link
                  to="/groupes-parole"
                  className="flex items-center gap-3 mb-6 p-4 bg-purple-900/30 border border-purple-700 rounded-lg hover:bg-purple-900/50 transition-colors group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform select-none">🗣️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-purple-200">Groupes de Parole Citoyens</p>
                    <p className="text-purple-300 text-sm">Échangez par territoire sur la vie chère.</p>
                  </div>
                  <span className="text-purple-400 text-xs font-semibold">Ouvrir →</span>
                </Link>

                <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <h3 className="text-blue-200 font-semibold mb-2">🔐 Le compte est facultatif</h3>
                  <p className="text-blue-200 text-sm mb-2">
                    Il sert uniquement à retrouver votre historique personnel sur cet appareil.
                  </p>
                  <p className="text-blue-200 text-sm">
                    <strong>Toutes les comparaisons sont accessibles sans compte.</strong>
                  </p>
                </div>

                <Button onClick={handleSignOut} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Se déconnecter
                </Button>
              </div>
            )}

            {/* Favoris */}
            {activeTab === 'favoris' && (
              <div role="tabpanel" id="tabpanel-favoris" aria-labelledby="tab-favoris">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" /> Mes produits favoris
                </h2>
                {favorites.length === 0 ? (
                  <div className="text-center py-10">
                    <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aucun favori enregistré.</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Ajoutez des produits depuis la <Link to="/comparateur" className="text-blue-400 hover:underline">page comparateur</Link>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favorites.map(fav => (
                      <div key={fav.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
                        <div className="min-w-0">
                          <Link
                            to={fav.route || `/produit/${fav.barcode}`}
                            className="font-medium text-white hover:text-blue-400 transition-colors truncate block"
                          >
                            {fav.label}
                          </Link>
                          {fav.barcode && (
                            <span className="text-xs text-slate-400 font-mono">EAN: {fav.barcode}</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          aria-label={`Retirer ${fav.label} des favoris`}
                          className="flex-shrink-0 p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alertes */}
            {activeTab === 'alertes' && (
              <div role="tabpanel" id="tabpanel-alertes" aria-labelledby="tab-alertes">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" /> Mes alertes prix
                </h2>
                {alerts.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aucune alerte active.</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Créez vos alertes depuis la <Link to="/alertes" className="text-blue-400 hover:underline">page alertes prix</Link>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(alerts as Array<{id: string; productName: string; alertType: string; territory: string}>).map(alert => (
                      <div key={alert.id} className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
                        <p className="font-medium text-white">{alert.productName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {alert.alertType === 'price_drop' ? '🔽 Baisse' : alert.alertType === 'price_increase' ? '🔼 Hausse' : '📦 Shrinkflation'}
                          {' · '}{alert.territory}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <Link to="/alertes" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Bell className="w-4 h-4" />
                    Gérer mes alertes
                  </Link>
                </div>
              </div>
            )}

            {/* Territoire */}
            {activeTab === 'territoire' && (
              <div role="tabpanel" id="tabpanel-territoire" aria-labelledby="tab-territoire">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-400" /> Mon territoire principal
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Définissez votre territoire principal pour recevoir des comparaisons et alertes personnalisées.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {TERRITORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleTerritoryChange(opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${
                        territory === opt.value
                          ? 'bg-blue-900/40 border-blue-600 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-xl">{opt.label.split(' ')[0]}</span>
                      <span className="font-medium">{opt.label.split(' ').slice(1).join(' ')}</span>
                      {territory === opt.value && (
                        <span className="ml-auto text-blue-400 text-xs font-bold">✓ Sélectionné</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plan */}
            {activeTab === 'plan' && (
              <div role="tabpanel" id="tabpanel-plan" aria-labelledby="tab-plan">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-yellow-400" /> Mon plan
                </h2>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-slate-400">Plan actuel</p>
                      <p className="text-2xl font-bold text-white">Freemium</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-medium">Gratuit</span>
                  </div>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Comparaisons illimitées</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Historique basique (7j)</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 1 territoire</li>
                    <li className="flex items-center gap-2"><span className="text-slate-600">✗</span> Alertes prix (Premium)</li>
                    <li className="flex items-center gap-2"><span className="text-slate-600">✗</span> Historique avancé 1 an (Premium)</li>
                  </ul>
                </div>
                <Link
                  to="/pricing"
                  className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Voir les plans et passer à Premium
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

