/**
 * EspacePro – Tableau de bord professionnel
 *
 * - Vue d'ensemble du profil pro
 * - Gestion des annonces de prix (CRUD)
 * - Quota d'annonces en temps réel
 * - Statut de vérification du compte
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  Building2, Plus, Eye, Trash2, BadgeCheck, AlertCircle,
  CheckCircle, Clock, BarChart3, Tag, MapPin, RefreshCw,
  LogOut, Edit3, TrendingUp, Package, Star,
} from 'lucide-react';
import {
  loadProProfile,
  loadProAnnonces,
  saveProAnnonces,
  getRemainingQuota,
  createAnnonce,
  PRO_PLANS,
  SECTEUR_LABELS,
  FORME_JURIDIQUE_LABELS,
  formatSiret,
} from '../services/proAccountService';
import type { ProProfile, ProPriceAnnonce } from '../types/proAccount';
import { GlassCard } from '../components/ui/glass-card';

// ─── Composants utilitaires ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProProfile['verificationStatus'] }) {
  const config = {
    pending:   { label: 'En attente de vérification', color: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30', icon: <Clock className="w-3 h-3" /> },
    verified:  { label: 'Compte vérifié ✓',           color: 'bg-green-600/20 text-green-300 border-green-600/30',  icon: <CheckCircle className="w-3 h-3" /> },
    rejected:  { label: 'Dossier à compléter',         color: 'bg-red-600/20 text-red-300 border-red-600/30',       icon: <AlertCircle className="w-3 h-3" /> },
    suspended: { label: 'Compte suspendu',              color: 'bg-slate-600/20 text-gray-400 border-slate-600/30',  icon: <AlertCircle className="w-3 h-3" /> },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.color}`}>
      {c.icon}{c.label}
    </span>
  );
}

function QuotaBar({ used, max }: { used: number; max: number | null }) {
  if (max === null) {
    return (
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-orange-400" />
        <span className="text-sm text-gray-300">Annonces illimitées</span>
      </div>
    );
  }
  const pct = Math.min((used / max) * 100, 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-orange-500' : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{used} / {max} annonces utilisées</span>
        <span>{max - used} restante{max - used !== 1 ? 's' : ''}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Formulaire nouvelle annonce ─────────────────────────────────────────────

interface NewAnnonceFormProps {
  proId: string;
  plan: ProProfile['plan'];
  onSave: (annonce: ProPriceAnnonce) => void;
  onCancel: () => void;
}

function NewAnnonceForm({ proId, plan, onSave, onCancel }: NewAnnonceFormProps) {
  const [produit, setProduit] = useState('');
  const [categorie, setCategorie] = useState('');
  const [prix, setPrix] = useState('');
  const [unite, setUnite] = useState('pièce');
  const [prixPromo, setPrixPromo] = useState('');
  const [description, setDescription] = useState('');
  const [disponibilite, setDisponibilite] = useState('En stock');
  const [adresseVente, setAdresseVente] = useState('');
  const [territoire, setTerritoire] = useState('Guadeloupe');
  const [error, setError] = useState('');

  const UNITES = ['pièce', 'kg', 'g', '500g', 'L', 'cl', '75cl', 'lot', 'boîte', 'bouteille', 'heure', 'forfait', 'journée', 'semaine', 'mois'];
  const TERRITOIRES = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte', 'Saint-Martin'];

  const handleSave = () => {
    if (!produit.trim() || !categorie.trim() || !prix || !adresseVente.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    const prixNum = parseFloat(prix);
    if (isNaN(prixNum) || prixNum <= 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }
    setError('');
    const annonce = createAnnonce(proId, {
      produit: produit.trim(),
      categorie: categorie.trim(),
      prix: prixNum,
      unite,
      prixPromo: prixPromo ? parseFloat(prixPromo) : undefined,
      description: description.trim() || undefined,
      disponibilite,
      territoire,
      adresseVente: adresseVente.trim(),
    }, plan);
    onSave(annonce);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-5 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-400" />Nouvelle annonce de prix
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Produit / Service *</label>
          <input type="text" value={produit} onChange={(e) => setProduit(e.target.value)} maxLength={100}
            placeholder="Ex: Poulet entier, Coupe de cheveux, Chambre double…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie *</label>
          <input type="text" value={categorie} onChange={(e) => setCategorie(e.target.value)} maxLength={60}
            placeholder="Ex: Viande, Coiffure, Hôtellerie…"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Prix (€) *</label>
          <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} min="0" step="0.01"
            placeholder="Ex: 12.50"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Unité *</label>
          <select value={unite} onChange={(e) => setUnite(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Prix promo (€)</label>
          <input type="number" value={prixPromo} onChange={(e) => setPrixPromo(e.target.value)} min="0" step="0.01"
            placeholder="Optionnel"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={300}
          placeholder="Détails supplémentaires sur le produit ou service…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Disponibilité *</label>
          <select value={disponibilite} onChange={(e) => setDisponibilite(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['En stock', 'Disponible', 'Sur commande', 'Limité', 'Épuisé'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Territoire *</label>
          <select value={territoire} onChange={(e) => setTerritoire(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {TERRITOIRES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Adresse de vente *</label>
          <input type="text" value={adresseVente} onChange={(e) => setAdresseVente(e.target.value)} maxLength={120}
            placeholder="Adresse ou 'En ligne'"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-600/40 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
          Publier l'annonce
        </button>
        <button onClick={onCancel}
          className="px-5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Carte annonce ───────────────────────────────────────────────────────────

function AnnonceCard({ annonce, onDelete }: { annonce: ProPriceAnnonce; onDelete: (id: string) => void }) {
  const expiresIn = Math.ceil((new Date(annonce.expiresAt).getTime() - Date.now()) / (1000 * 3600 * 24));
  const isExpired = expiresIn <= 0;
  const isExpiringSoon = expiresIn > 0 && expiresIn <= 5;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isExpired ? 'bg-slate-800/20 border-slate-700/30 opacity-60' :
      'bg-slate-800/40 border-slate-600/40 hover:border-slate-500/60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300">{annonce.categorie}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              annonce.statut === 'active' ? 'bg-green-600/20 text-green-300' :
              annonce.statut === 'expiree' ? 'bg-slate-600/30 text-gray-400' :
              'bg-red-600/20 text-red-300'
            }`}>
              {annonce.statut === 'active' ? '● Actif' : annonce.statut === 'expiree' ? 'Expirée' : 'Suspendue'}
            </span>
            {isExpiringSoon && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-300">
                ⚠️ Expire dans {expiresIn}j
              </span>
            )}
          </div>

          <h3 className="font-semibold text-white text-sm">{annonce.produit}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl font-bold text-white">{annonce.prix.toFixed(2)} €</span>
            <span className="text-xs text-gray-500">/{annonce.unite}</span>
            {annonce.prixPromo && (
              <span className="text-sm font-semibold text-green-400">{annonce.prixPromo.toFixed(2)} € <span className="text-xs text-gray-500">PROMO</span></span>
            )}
          </div>

          {annonce.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{annonce.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{annonce.territoire}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{annonce.vues} vue{annonce.vues !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isExpired ? 'Expirée' : `Expire le ${new Date(annonce.expiresAt).toLocaleDateString('fr-FR')}`}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-1">
          <button
            onClick={() => onDelete(annonce.id)}
            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded"
            aria-label="Supprimer cette annonce"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

type ProTab = 'tableau_bord' | 'annonces' | 'profil';

export default function EspacePro() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [annonces, setAnnonces] = useState<ProPriceAnnonce[]>([]);
  const [activeTab, setActiveTab] = useState<ProTab>('tableau_bord');
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    const p = loadProProfile();
    if (!p) {
      navigate('/inscription-pro');
      return;
    }
    setProfile(p);
    setAnnonces(loadProAnnonces(p.id));
  }, [navigate]);

  if (!profile) return null;

  const quota = getRemainingQuota(profile);
  const plan = PRO_PLANS.find((p) => p.id === profile.plan);
  const annonceActives = annonces.filter((a) => a.statut === 'active').length;

  const handleNewAnnonce = (annonce: ProPriceAnnonce) => {
    const updated = [annonce, ...annonces];
    saveProAnnonces(profile.id, updated);
    setAnnonces(updated);
    const updatedProfile: ProProfile = {
      ...profile,
      annoncesActives: annonceActives + 1,
      annoncesTotal: profile.annoncesTotal + 1,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updatedProfile);
    setShowNewForm(false);
  };

  const handleDeleteAnnonce = (id: string) => {
    const updated = annonces.filter((a) => a.id !== id);
    saveProAnnonces(profile.id, updated);
    setAnnonces(updated);
  };

  const TABS: { id: ProTab; label: string; icon: React.ReactNode }[] = [
    { id: 'tableau_bord', label: 'Tableau de bord', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'annonces',     label: `Mes annonces (${annonceActives})`, icon: <Tag className="w-4 h-4" /> },
    { id: 'profil',       label: 'Mon profil',      icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <>
      <Helmet>
        <title>Espace Pro – {profile.raisonSociale} – A KI PRI SA YÉ</title>
        <meta name="description" content="Tableau de bord professionnel A KI PRI SA YÉ" />
      </Helmet>

      <div className="min-h-screen bg-slate-950">
        {/* Hero banner */}
        <div className="px-4 pt-4 pb-0 max-w-5xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.espacePro}
            alt="Espace Professionnel"
            gradient="from-slate-950 to-blue-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              💼 Espace Professionnel
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              Outils avancés pour professionnels et institutions
            </p>
          </HeroImage>
        </div>
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{profile.raisonSociale}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <StatusBadge status={profile.verificationStatus} />
                    {plan && (
                      <span className="text-xs bg-slate-700/60 text-gray-300 px-2 py-0.5 rounded-full">
                        Plan {plan.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Retour à l'accueil</span>
              </button>
            </div>

            {/* Alerte si en attente */}
            {profile.verificationStatus === 'pending' && (
              <div className="mt-4 bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 flex items-start gap-2">
                <Clock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-300 font-medium">Votre compte est en attente de vérification</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Envoyez vos documents justificatifs (KBIS/attestation INSEE + pièce d'identité) à{' '}
                    <a href="mailto:pro@akiprisaye.re" className="text-blue-400 underline">pro@akiprisaye.re</a>
                    {' '}pour activer votre compte (24-48h ouvrées).
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Onglets */}
          <div className="flex gap-1 bg-slate-900/50 rounded-xl p-1 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* ── Tableau de bord ──────────────────────────────────── */}
          {activeTab === 'tableau_bord' && (
            <div className="space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Annonces actives', value: annonceActives.toString(), icon: <Tag className="w-5 h-5" />, color: 'text-blue-400' },
                  { label: 'Total créées', value: profile.annoncesTotal.toString(), icon: <Package className="w-5 h-5" />, color: 'text-purple-400' },
                  { label: 'Vues totales', value: annonces.reduce((s, a) => s + a.vues, 0).toString(), icon: <Eye className="w-5 h-5" />, color: 'text-green-400' },
                  { label: 'Plan actuel', value: plan?.label ?? '—', icon: <Star className="w-5 h-5" />, color: 'text-orange-400' },
                ].map((kpi) => (
                  <GlassCard key={kpi.label} className="p-4 text-center">
                    <div className={`flex justify-center mb-2 ${kpi.color}`}>{kpi.icon}</div>
                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </GlassCard>
                ))}
              </div>

              {/* Quota */}
              <GlassCard className="p-5">
                <h2 className="text-lg font-semibold text-white mb-3">Quota d'annonces</h2>
                <QuotaBar used={annonceActives} max={quota.max} />
                {quota.max !== null && quota.remaining === 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    Quota atteint.{' '}
                    <Link to="/pricing" className="underline">Passez à un plan supérieur</Link>
                    {' '}ou supprimez des annonces.
                  </p>
                )}
              </GlassCard>

              {/* Avantages du plan */}
              {plan && (
                <GlassCard className="p-5">
                  <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Votre plan : {plan.label}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <Link to="/pricing" className="text-sm text-blue-400 hover:text-blue-300 underline flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />Changer de plan
                    </Link>
                  </div>
                </GlassCard>
              )}

              {/* Raccourcis */}
              <div className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('annonces'); setShowNewForm(true); }}
                  disabled={!quota.canPublish}
                  className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left">
                  <Plus className="w-8 h-8 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Nouvelle annonce</p>
                    <p className="text-xs text-gray-400">Publiez un prix ou un service</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('profil')}
                  className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/30 rounded-xl hover:bg-slate-800/70 transition-colors text-left">
                  <Edit3 className="w-8 h-8 text-gray-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Modifier le profil</p>
                    <p className="text-xs text-gray-400">Informations de l'établissement</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Annonces ─────────────────────────────────────────── */}
          {activeTab === 'annonces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Mes annonces de prix</h2>
                <button
                  onClick={() => setShowNewForm(true)}
                  disabled={!quota.canPublish}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />Nouvelle annonce
                </button>
              </div>

              {!quota.canPublish && (
                <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">
                    Quota atteint ({quota.max} annonces). Supprimez des annonces ou{' '}
                    <Link to="/pricing" className="underline">passez à un plan supérieur</Link>.
                  </p>
                </div>
              )}

              {showNewForm && (
                <NewAnnonceForm
                  proId={profile.id}
                  plan={profile.plan}
                  onSave={handleNewAnnonce}
                  onCancel={() => setShowNewForm(false)}
                />
              )}

              {annonces.length === 0 ? (
                <GlassCard className="py-12 text-center">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">Aucune annonce publiée pour l'instant.</p>
                  <button onClick={() => setShowNewForm(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline">
                    Créer ma première annonce
                  </button>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {annonces.map((a) => (
                    <AnnonceCard key={a.id} annonce={a} onDelete={handleDeleteAnnonce} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profil ───────────────────────────────────────────── */}
          {activeTab === 'profil' && (
            <div className="space-y-5">
              <GlassCard className="p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-blue-400" />
                  Informations légales
                </h2>
                <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Raison sociale',  value: profile.raisonSociale },
                    { label: 'SIRET',            value: formatSiret(profile.siret) },
                    { label: 'SIREN',            value: profile.siren },
                    { label: 'Code APE',         value: profile.codeApe ?? '—' },
                    { label: 'Forme juridique',  value: FORME_JURIDIQUE_LABELS[profile.formeJuridique] },
                    { label: 'Secteur',          value: SECTEUR_LABELS[profile.secteurActivite] },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-gray-500 mb-0.5">{label}</dt>
                      <dd className="text-white font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </GlassCard>

              <GlassCard className="p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Coordonnées
                </h2>
                <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Responsable', value: profile.nomResponsable },
                    { label: 'Email',       value: profile.email },
                    { label: 'Téléphone',   value: profile.telephone },
                    { label: 'Adresse',     value: `${profile.adresse}, ${profile.codePostal} ${profile.ville}` },
                    { label: 'Territoire',  value: profile.territoire },
                    { label: 'Site web',    value: profile.siteWeb ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-gray-500 mb-0.5">{label}</dt>
                      <dd className="text-white font-medium break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </GlassCard>

              <GlassCard className="p-5">
                <h2 className="text-lg font-semibold text-white mb-3">Présentation</h2>
                <p className="text-gray-300 text-sm leading-relaxed">{profile.descriptionActivite}</p>
                {profile.slogan && <p className="text-orange-300 italic mt-2 text-sm">"{profile.slogan}"</p>}
              </GlassCard>

              <div className="flex gap-3">
                <Link to="/inscription-pro"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl text-sm transition-colors">
                  <Edit3 className="w-4 h-4" />Modifier le profil
                </Link>
                <Link to="/pricing"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm transition-colors">
                  <RefreshCw className="w-4 h-4" />Changer de plan
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
