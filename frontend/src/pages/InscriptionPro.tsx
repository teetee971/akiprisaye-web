/**
 * InscriptionPro – Formulaire d'inscription compte professionnel
 *
 * Processus en 4 étapes :
 *  1. Informations légales (SIRET, raison sociale, forme juridique)
 *  2. Coordonnées & contact
 *  3. Présentation de l'établissement
 *  4. Choix du plan tarifaire & validation
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, FileText, User, MapPin, Globe,
  CheckCircle, AlertCircle, ChevronRight, ChevronLeft,
  BadgeCheck, Zap, BarChart3, Star, CreditCard,
} from 'lucide-react';
import {
  validateSiret,
  formatSiret,
  PRO_PLANS,
  FORME_JURIDIQUE_LABELS,
  SECTEUR_LABELS,
  createProProfileFromForm,
  saveProProfile,
} from '../services/proAccountService';
import type { ProRegistrationForm, FormeJuridique, SecteurActivite, ProPlan } from '../types/proAccount';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Données de référence ────────────────────────────────────────────────────

const TERRITOIRES = [
  'Guadeloupe', 'Martinique', 'Guyane', 'La Réunion',
  'Mayotte', 'Saint-Martin', 'Saint-Barthélemy', 'Métropole',
];

const DOCUMENTS_REQUIS: { type: string; label: string; obligatoire: boolean; detail: string }[] = [
  {
    type: 'kbis_insee',
    label: 'Extrait KBIS ou attestation INSEE',
    obligatoire: true,
    detail: 'Moins de 3 mois. Pour une micro-entreprise : attestation de l\'INSEE ou avis de situation.',
  },
  {
    type: 'identity',
    label: 'Pièce d\'identité du gérant',
    obligatoire: true,
    detail: 'Carte nationale d\'identité ou passeport en cours de validité.',
  },
  {
    type: 'urssaf',
    label: 'Attestation de vigilance URSSAF',
    obligatoire: false,
    detail: 'Recommandé pour les auto-entrepreneurs. Disponible sur urssaf.fr.',
  },
  {
    type: 'rib',
    label: 'RIB professionnel',
    obligatoire: false,
    detail: 'Optionnel. Nécessaire uniquement pour les plans payants.',
  },
];

// ─── Étape 1 – Informations légales ─────────────────────────────────────────

interface Step1Props {
  form: ProRegistrationForm;
  onChange: (updates: Partial<ProRegistrationForm>) => void;
  onNext: () => void;
}

function Step1Legal({ form, onChange, onNext }: Step1Props) {
  const [siretError, setSiretError] = useState('');
  const [touched, setTouched] = useState(false);

  const handleSiretChange = (value: string) => {
    const raw = value.replace(/\s/g, '');
    onChange({ siret: raw });
    if (touched || raw.length === 14) {
      const result = validateSiret(raw);
      setSiretError(result.error ?? '');
    }
  };

  const handleSiretBlur = () => {
    setTouched(true);
    const result = validateSiret(form.siret);
    setSiretError(result.error ?? '');
  };

  const canContinue =
    form.raisonSociale.trim().length >= 2 &&
    validateSiret(form.siret).valid &&
    !!form.formeJuridique &&
    !!form.secteurActivite;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Informations légales</h2>
      </div>

      {/* Raison sociale */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Raison sociale / Nom commercial *
        </label>
        <input
          type="text"
          value={form.raisonSociale}
          onChange={(e) => onChange({ raisonSociale: e.target.value })}
          placeholder="Ex : Supermarché Chez Marie, Boulangerie Dupont…"
          maxLength={100}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SIRET */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Numéro SIRET *
          <span className="ml-2 text-xs text-gray-500 font-normal">(14 chiffres)</span>
        </label>
        <input
          type="text"
          value={form.siret ? formatSiret(form.siret) : ''}
          onChange={(e) => handleSiretChange(e.target.value)}
          onBlur={handleSiretBlur}
          placeholder="123 456 789 00012"
          maxLength={17}
          className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
            siretError ? 'border-red-500 focus:ring-red-500' : validateSiret(form.siret).valid && form.siret ? 'border-green-500 focus:ring-green-500' : 'border-slate-600 focus:ring-blue-500'
          }`}
        />
        {siretError && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{siretError}
          </p>
        )}
        {validateSiret(form.siret).valid && form.siret && !siretError && (
          <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />SIRET valide — SIREN : {form.siret.slice(0, 9)}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Disponible sur votre extrait KBIS ou sur{' '}
          <a href="https://www.sirene.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">sirene.fr</a>
        </p>
      </div>

      {/* Forme juridique */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Forme juridique *</label>
        <select
          value={form.formeJuridique}
          onChange={(e) => onChange({ formeJuridique: e.target.value as FormeJuridique })}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Sélectionner —</option>
          {(Object.entries(FORME_JURIDIQUE_LABELS) as [FormeJuridique, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Secteur d'activité */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Secteur d'activité *</label>
        <select
          value={form.secteurActivite}
          onChange={(e) => onChange({ secteurActivite: e.target.value as SecteurActivite })}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Sélectionner —</option>
          {(Object.entries(SECTEUR_LABELS) as [SecteurActivite, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Code APE (optionnel) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Code APE / NAF
          <span className="ml-2 text-xs text-gray-500 font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={form.codeApe ?? ''}
          onChange={(e) => onChange({ codeApe: e.target.value.toUpperCase() })}
          placeholder="Ex : 4711D, 5610A…"
          maxLength={6}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Continuer <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Étape 2 – Coordonnées ───────────────────────────────────────────────────

interface Step2Props {
  form: ProRegistrationForm;
  onChange: (updates: Partial<ProRegistrationForm>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function Step2Contact({ form, onChange, onNext, onPrev }: Step2Props) {
  const canContinue =
    form.nomResponsable.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8 &&
    form.telephone.trim().length >= 8 &&
    form.adresse.trim().length >= 5 &&
    form.ville.trim().length >= 2 &&
    form.territoire !== '';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <User className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Coordonnées & Contact</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nom du responsable *</label>
          <input type="text" value={form.nomResponsable} onChange={(e) => onChange({ nomResponsable: e.target.value })}
            placeholder="Prénom Nom" maxLength={80}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Téléphone *</label>
          <input type="tel" value={form.telephone} onChange={(e) => onChange({ telephone: e.target.value })}
            placeholder="0590 XX XX XX" maxLength={20}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email professionnel *</label>
        <input type="email" value={form.email} onChange={(e) => onChange({ email: e.target.value })}
          placeholder="contact@monentreprise.fr"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Mot de passe *
          <span className="ml-2 text-xs text-gray-500 font-normal">(min. 8 caractères)</span>
        </label>
        <input type="password" value={form.password} onChange={(e) => onChange({ password: e.target.value })}
          placeholder="••••••••" minLength={8}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Adresse professionnelle *</label>
        <input type="text" value={form.adresse} onChange={(e) => onChange({ adresse: e.target.value })}
          placeholder="Numéro et nom de la rue" maxLength={120}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Code postal *</label>
          <input type="text" value={form.codePostal} onChange={(e) => onChange({ codePostal: e.target.value })}
            placeholder="97100" maxLength={10}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Ville *</label>
          <input type="text" value={form.ville} onChange={(e) => onChange({ ville: e.target.value })}
            placeholder="Pointe-à-Pitre" maxLength={80}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Territoire *</label>
        <select value={form.territoire} onChange={(e) => onChange({ territoire: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">— Sélectionner —</option>
          {TERRITOIRES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Site web <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="url" value={form.siteWeb ?? ''} onChange={(e) => onChange({ siteWeb: e.target.value })}
            placeholder="https://www.moncommerce.fr"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl font-medium transition-colors flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />Retour
        </button>
        <button onClick={onNext} disabled={!canContinue}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
          Continuer <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Étape 3 – Présentation ──────────────────────────────────────────────────

interface Step3Props {
  form: ProRegistrationForm;
  onChange: (updates: Partial<ProRegistrationForm>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function Step3Presentation({ form, onChange, onNext, onPrev }: Step3Props) {
  const canContinue = form.descriptionActivite.trim().length >= 30;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Présentation de l'établissement</h2>
      </div>
      <p className="text-sm text-gray-400">
        Ces informations seront affichées sur votre fiche publique, visible par tous les utilisateurs.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description de votre activité *
          <span className="ml-2 text-xs text-gray-500 font-normal">(min. 30 caractères)</span>
        </label>
        <textarea value={form.descriptionActivite} onChange={(e) => onChange({ descriptionActivite: e.target.value })}
          rows={5} maxLength={600}
          placeholder="Présentez votre commerce, vos produits ou services, votre engagement qualité, vos horaires d'ouverture, ce qui vous distingue…"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
        <p className="text-xs text-gray-500 mt-0.5">{form.descriptionActivite.length}/600</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Slogan <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
        </label>
        <input type="text" value={form.slogan ?? ''} onChange={(e) => onChange({ slogan: e.target.value })}
          placeholder="Ex : Les meilleurs prix de l'île !" maxLength={80}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>

      {/* Documents requis */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents à fournir après validation
        </h3>
        <div className="space-y-3">
          {DOCUMENTS_REQUIS.map((doc) => (
            <div key={doc.type} className="flex items-start gap-3">
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                doc.obligatoire ? 'bg-red-600/30 text-red-300' : 'bg-slate-600/50 text-gray-400'
              }`}>
                {doc.obligatoire ? 'Obligatoire' : 'Optionnel'}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-200">{doc.label}</p>
                <p className="text-xs text-gray-500">{doc.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          📧 Les documents seront à envoyer par email après la création du compte.
          Votre compte sera activé après vérification (24-48h ouvrées).
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl font-medium transition-colors flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />Retour
        </button>
        <button onClick={onNext} disabled={!canContinue}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
          Continuer <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Étape 4 – Plan tarifaire ────────────────────────────────────────────────

interface Step4Props {
  form: ProRegistrationForm;
  onChange: (updates: Partial<ProRegistrationForm>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  submitting: boolean;
}

function PlanIcon({ plan }: { plan: ProPlan }) {
  const icons: Record<ProPlan, React.ReactNode> = {
    decouverte:  <Zap className="w-5 h-5" />,
    essentiel:   <BadgeCheck className="w-5 h-5" />,
    commerce:    <BarChart3 className="w-5 h-5" />,
    franchise:   <Star className="w-5 h-5" />,
    a_la_carte:  <CreditCard className="w-5 h-5" />,
  };
  return <>{icons[plan]}</>;
}

function Step4Plan({ form, onChange, onSubmit, onPrev, submitting }: Step4Props) {
  const canSubmit = !!form.plan && form.acceptesCGU && form.acceptesConfidentialite;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bold text-white">Choisissez votre plan</h2>
      </div>

      <div className="space-y-3">
        {PRO_PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange({ plan: plan.id })}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              form.plan === plan.id
                ? plan.highlight
                  ? 'border-orange-500 bg-orange-900/20 ring-2 ring-orange-500/50'
                  : 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/50'
                : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${form.plan === plan.id ? 'bg-blue-600/30 text-blue-300' : 'bg-slate-700/50 text-gray-400'}`}>
                  <PlanIcon plan={plan.id} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{plan.label}</span>
                    {plan.highlight && (
                      <span className="text-xs bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded-full">Recommandé</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {plan.price === 0 ? (
                  <span className="text-lg font-bold text-green-400">Gratuit</span>
                ) : plan.price === null ? (
                  <span className="text-sm text-gray-300">Sur devis</span>
                ) : (
                  <span className="text-lg font-bold text-white">
                    {plan.price}€
                    <span className="text-xs text-gray-400 font-normal">/{plan.priceUnit}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.features.slice(0, 3).map((f, i) => (
                <span key={i} className="text-xs bg-slate-700/50 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />{f}
                </span>
              ))}
              {plan.features.length > 3 && (
                <span className="text-xs text-gray-500">+{plan.features.length - 3} autres…</span>
              )}
            </div>

            {plan.annoncesMax !== null && (
              <div className="mt-2 text-xs text-blue-300 font-medium">
                📋 Quota : {plan.annoncesMax} annonce{plan.annoncesMax > 1 ? 's' : ''} active{plan.annoncesMax > 1 ? 's' : ''}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Engagements */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.acceptesCGU} onChange={(e) => onChange({ acceptesCGU: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded accent-blue-500 shrink-0" />
          <span className="text-sm text-gray-300">
            J'accepte les{' '}
            <Link to="/mentions-legales" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Conditions Générales d'Utilisation</Link>
            {' '}et je certifie que les informations fournies sont exactes. *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.acceptesConfidentialite} onChange={(e) => onChange({ acceptesConfidentialite: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded accent-blue-500 shrink-0" />
          <span className="text-sm text-gray-300">
            J'accepte la{' '}
            <Link to="/transparence" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Politique de confidentialité</Link>
            . *
          </span>
        </label>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
        <p className="text-xs text-gray-400">
          <strong className="text-blue-300">Activation du compte :</strong> Après validation de votre dossier (SIRET + pièces justificatives),
          votre compte sera activé sous 24 à 48h ouvrées. Vous recevrez un email de confirmation.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl font-medium transition-colors flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />Retour
        </button>
        <button onClick={onSubmit} disabled={!canSubmit || submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
          {submitting ? (
            <>Création en cours…</>
          ) : (
            <><CheckCircle className="w-5 h-5" />Créer mon compte pro</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

const INITIAL_FORM: ProRegistrationForm = {
  raisonSociale: '',
  siret: '',
  formeJuridique: '' as FormeJuridique,
  secteurActivite: '' as SecteurActivite,
  codeApe: '',
  nomResponsable: '',
  email: '',
  password: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  territoire: '',
  siteWeb: '',
  descriptionActivite: '',
  slogan: '',
  plan: 'essentiel',
  acceptesCGU: false,
  acceptesConfidentialite: false,
};

const STEPS = [
  { label: 'Légal',       icon: Building2 },
  { label: 'Contact',     icon: User },
  { label: 'Présentation',icon: FileText },
  { label: 'Plan',        icon: CreditCard },
];

export default function InscriptionPro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProRegistrationForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (updates: Partial<ProRegistrationForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const profile = createProProfileFromForm(form);
      saveProProfile(profile);
      setTimeout(() => {
        navigate('/espace-pro');
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Inscription Professionnel – A KI PRI SA YÉ</title>
        <meta name="description" content="Ouvrez un compte professionnel et publiez vos prix sur A KI PRI SA YÉ" />
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/inscription-pro" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/inscription-pro" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/inscription-pro" />
      </Helmet>

      <HeroImage
        src={PAGE_HERO_IMAGES.inscriptionPro}
        alt="Inscription Professionnelle"
        gradient="from-slate-950 to-indigo-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>💼 Inscription Professionnelle</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Accès pro pour enseignes, institutions et collectivités</p>
      </HeroImage>

      <div className="min-h-screen bg-slate-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isDone ? 'bg-green-600 border-green-600' :
                      isActive ? 'bg-blue-600 border-blue-600' :
                      'bg-slate-800 border-slate-600'
                    }`}>
                      {isDone ? <CheckCircle className="w-5 h-5 text-white" /> : <Icon className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${isActive ? 'text-white font-medium' : 'text-gray-500'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${i < step ? 'bg-green-600' : 'bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Contenu de l'étape */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
            {step === 0 && <Step1Legal form={form} onChange={handleChange} onNext={() => setStep(1)} />}
            {step === 1 && <Step2Contact form={form} onChange={handleChange} onNext={() => setStep(2)} onPrev={() => setStep(0)} />}
            {step === 2 && <Step3Presentation form={form} onChange={handleChange} onNext={() => setStep(3)} onPrev={() => setStep(1)} />}
            {step === 3 && <Step4Plan form={form} onChange={handleChange} onSubmit={handleSubmit} onPrev={() => setStep(2)} submitting={submitting} />}
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Déjà un compte pro ?{' '}
            <Link to="/espace-pro" className="text-blue-400 underline">Accéder à mon espace</Link>
          </p>
        </div>
      </div>
    </>
  );
}
