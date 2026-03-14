/**
 * MerchantOnboarding — Inscription enseigne sur la Marketplace
 *
 * Processus en 4 étapes :
 *  1. Identification légale (SIRET, SIREN, TVA, type d'enseigne)
 *  2. Adresse & contact
 *  3. Premier magasin (GPS obligatoire)
 *  4. Choix du plan d'abonnement (pas de freemium)
 *
 * Statut initial : PENDING (validation admin requise)
 * ❌ Pas de données fictives
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, FileText, MapPin, CreditCard,
  CheckCircle, AlertCircle, ChevronRight, ChevronLeft,
  Store, Globe, Phone, Mail,
} from 'lucide-react';
import {
  validateSiret,
  formatSiret,
  sirenFromSiret,
  tvaFromSiren,
  createMerchant,
  MARKETPLACE_PLANS,
} from '../../services/merchantService';
import { generateSubscriptionInvoice } from '../../services/merchantBillingService';
import type {
  MerchantOnboardingForm,
  MerchantType,
  ProductCategory,
  MarketplacePlan,
} from '../../types/merchant';
import type { TerritoryCode } from '../../constants/territories';
import { TERRITORIES } from '../../constants/territories';

// ─── Labels ──────────────────────────────────────────────────────────────────

const MERCHANT_TYPE_LABELS: Record<MerchantType, string> = {
  grande_enseigne:  'Grande enseigne nationale',
  franchise:        'Franchise',
  independant:      'Commerce indépendant',
  marche_local:     'Marché local',
  producteur_local: 'Producteur local',
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  alimentation_generale:  'Alimentation générale',
  fruits_legumes:         'Fruits & légumes',
  boucherie_charcuterie:  'Boucherie / charcuterie',
  poissonnerie:           'Poissonnerie',
  boulangerie_patisserie: 'Boulangerie / pâtisserie',
  epicerie_fine:          'Épicerie fine',
  boissons:               'Boissons',
  hygiene_beaute:         'Hygiène & beauté',
  entretien_maison:       'Entretien maison',
  bricolage_jardinage:    'Bricolage / jardinage',
  electronique:           'Électronique',
  habillement:            'Habillement',
  pharmacie:              'Pharmacie / parapharmacie',
  carburant:              'Carburant',
  autre:                  'Autre',
};

const TERRITORY_OPTIONS = Object.values(TERRITORIES)
  .filter((t) => t.active && t.type !== 'Metro')
  .map((t) => ({ code: t.code as TerritoryCode, label: t.name }));

// ─── État initial du formulaire ───────────────────────────────────────────────

const EMPTY_FORM: MerchantOnboardingForm = {
  nomLegal: '',
  nomCommercial: '',
  siret: '',
  tva: '',
  merchantType: 'independant',
  productCategories: [],
  activityStatus: 'ACTIVE',
  adresseSiege: '',
  codePostal: '',
  ville: '',
  territoire: 'gp',
  emailContact: '',
  telephone: '',
  siteWeb: '',
  premierMagasinNom: '',
  premierMagasinAdresse: '',
  premierMagasinVille: '',
  premierMagasinLatitude: 0,
  premierMagasinLongitude: 0,
  plan: 'essentiel',
  billingCycle: 'monthly',
  acceptesCGU: false,
  acceptesConfidentialite: false,
};

// ─── Composants utilitaires ───────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < current
                ? 'bg-green-500 border-green-500 text-white'
                : i === current
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-transparent border-white/30 text-white/40'
            }`}
          >
            {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-12 h-0.5 mx-1 ${i < current ? 'bg-green-500' : 'bg-white/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {msg}
    </p>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function MerchantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MerchantOnboardingForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof MerchantOnboardingForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalSteps = 4;

  const set = (field: keyof MerchantOnboardingForm, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ─── Dérivation automatique SIREN & TVA ────────────────────────────────────

  const handleSiretChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 14);
    set('siret', cleaned);
    if (cleaned.length === 14) {
      const siren = sirenFromSiret(cleaned);
      const tva = tvaFromSiren(siren);
      setForm((prev) => ({ ...prev, siret: cleaned, tva: prev.tva || tva }));
    }
  };

  // ─── Catégories — cases à cocher ───────────────────────────────────────────

  const toggleCategory = (cat: ProductCategory) => {
    setForm((prev) => ({
      ...prev,
      productCategories: prev.productCategories.includes(cat)
        ? prev.productCategories.filter((c) => c !== cat)
        : [...prev.productCategories, cat],
    }));
  };

  // ─── Validation par étape ─────────────────────────────────────────────────

  const validateStep = (): boolean => {
    const errs: typeof errors = {};

    if (step === 0) {
      if (!form.nomLegal.trim()) errs.nomLegal = 'Raison sociale obligatoire';
      if (!form.nomCommercial.trim()) errs.nomCommercial = 'Nom commercial obligatoire';
      if (!form.siret || form.siret.length !== 14) errs.siret = 'SIRET à 14 chiffres obligatoire';
      else if (!validateSiret(form.siret)) errs.siret = 'SIRET invalide (vérification Luhn échouée)';
      if (!form.tva.trim()) errs.tva = 'Numéro TVA obligatoire';
      if (form.productCategories.length === 0) errs.productCategories = 'Au moins une catégorie requise' as any;
    }

    if (step === 1) {
      if (!form.adresseSiege.trim()) errs.adresseSiege = 'Adresse siège obligatoire';
      if (!form.codePostal.trim()) errs.codePostal = 'Code postal obligatoire';
      if (!form.ville.trim()) errs.ville = 'Ville obligatoire';
      if (!form.emailContact.trim() || !/\S+@\S+\.\S+/.test(form.emailContact))
        errs.emailContact = 'Email valide obligatoire';
      if (!form.telephone.trim()) errs.telephone = 'Téléphone obligatoire';
    }

    if (step === 2) {
      if (!form.premierMagasinNom.trim()) errs.premierMagasinNom = 'Nom du magasin obligatoire';
      if (!form.premierMagasinAdresse.trim()) errs.premierMagasinAdresse = 'Adresse du magasin obligatoire';
      if (!form.premierMagasinVille.trim()) errs.premierMagasinVille = 'Ville du magasin obligatoire';
      if (!form.premierMagasinLatitude || form.premierMagasinLatitude === 0)
        errs.premierMagasinLatitude = 'Latitude GPS obligatoire';
      if (!form.premierMagasinLongitude || form.premierMagasinLongitude === 0)
        errs.premierMagasinLongitude = 'Longitude GPS obligatoire';
    }

    if (step === 3) {
      if (!form.acceptesCGU) errs.acceptesCGU = 'Vous devez accepter les CGU' as any;
      if (!form.acceptesConfidentialite) errs.acceptesConfidentialite = 'Vous devez accepter la politique de confidentialité' as any;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => s + 1); };
  const prevStep = () => setStep((s) => s - 1);

  // ─── Soumission finale ────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const merchant = createMerchant(form);
      generateSubscriptionInvoice(merchant.id, form.plan, form.billingCycle, form.territoire);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Rendu succès ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Dossier soumis !</h1>
          <p className="text-gray-300 mb-2">
            Votre demande d'inscription a bien été transmise.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Statut initial : <span className="text-yellow-400 font-semibold">En attente de validation</span>.
            Notre équipe examinera votre dossier dans les 48h ouvrées.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/marketplace/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Accéder à mon tableau de bord
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Rendu formulaire ────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>Inscription Enseigne — Marketplace A KI PRI SA YÉ</title>
        <meta name="description" content="Référencez votre enseigne sur la marketplace A KI PRI SA YÉ et accédez à tous les territoires ultramarins." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 rounded-full px-5 py-2 mb-6">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium text-sm">Marketplace Professionnelle</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Référencez votre enseigne</h1>
            <p className="text-gray-400 text-lg">
              Rejoignez la marketplace des territoires ultramarins français.
            </p>
          </div>

          {/* Indicateur d'étapes */}
          <StepIndicator current={step} total={totalSteps} />

          {/* Carte formulaire */}
          <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-8">

            {/* ── Étape 1 : Identification légale ── */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Identification légale
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Raison sociale *</label>
                    <input
                      type="text"
                      value={form.nomLegal}
                      onChange={(e) => set('nomLegal', e.target.value)}
                      placeholder="Ex : SAS Carrefour Guadeloupe"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.nomLegal} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nom commercial *</label>
                    <input
                      type="text"
                      value={form.nomCommercial}
                      onChange={(e) => set('nomCommercial', e.target.value)}
                      placeholder="Ex : Carrefour Gosier"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.nomCommercial} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Numéro SIRET * (14 chiffres)</label>
                    <input
                      type="text"
                      value={formatSiret(form.siret)}
                      onChange={(e) => handleSiretChange(e.target.value)}
                      placeholder="123 456 789 01234"
                      maxLength={17}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    {form.siret.length === 14 && (
                      <p className="mt-1 text-xs text-gray-400">
                        SIREN : <span className="text-white font-mono">{sirenFromSiret(form.siret)}</span>
                      </p>
                    )}
                    <FieldError msg={errors.siret} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Numéro TVA intracommunautaire *</label>
                    <input
                      type="text"
                      value={form.tva}
                      onChange={(e) => set('tva', e.target.value.toUpperCase())}
                      placeholder="FR12345678901"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <FieldError msg={errors.tva} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Type d'enseigne *</label>
                    <select
                      value={form.merchantType}
                      onChange={(e) => set('merchantType', e.target.value as MerchantType)}
                      className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(MERCHANT_TYPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Catégories de produits * (au moins une)</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([cat, label]) => (
                        <label key={cat} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.productCategories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="w-4 h-4 rounded accent-blue-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    {errors.productCategories && <FieldError msg={errors.productCategories as any} />}
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 2 : Adresse & contact ── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Adresse & contact
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Adresse du siège social *</label>
                    <input
                      type="text"
                      value={form.adresseSiege}
                      onChange={(e) => set('adresseSiege', e.target.value)}
                      placeholder="Numéro et nom de rue"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.adresseSiege} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Code postal *</label>
                      <input
                        type="text"
                        value={form.codePostal}
                        onChange={(e) => set('codePostal', e.target.value)}
                        placeholder="97100"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <FieldError msg={errors.codePostal} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Ville *</label>
                      <input
                        type="text"
                        value={form.ville}
                        onChange={(e) => set('ville', e.target.value)}
                        placeholder="Basse-Terre"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <FieldError msg={errors.ville} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Territoire *</label>
                    <select
                      value={form.territoire}
                      onChange={(e) => set('territoire', e.target.value as TerritoryCode)}
                      className="w-full bg-slate-800 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      {TERRITORY_OPTIONS.map((t) => (
                        <option key={t.code} value={t.code}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email de contact *
                    </label>
                    <input
                      type="email"
                      value={form.emailContact}
                      onChange={(e) => set('emailContact', e.target.value)}
                      placeholder="contact@votreenseigne.fr"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.emailContact} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Phone className="inline w-4 h-4 mr-1" />
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => set('telephone', e.target.value)}
                      placeholder="+590 590 XX XX XX"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.telephone} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Globe className="inline w-4 h-4 mr-1" />
                      Site web (optionnel)
                    </label>
                    <input
                      type="url"
                      value={form.siteWeb}
                      onChange={(e) => set('siteWeb', e.target.value)}
                      placeholder="https://www.votreenseigne.fr"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 3 : Premier magasin ── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-400" />
                  Premier magasin
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Enregistrez votre premier point de vente. Les coordonnées GPS sont obligatoires pour l'affichage sur la carte interactive.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nom du magasin *</label>
                    <input
                      type="text"
                      value={form.premierMagasinNom}
                      onChange={(e) => set('premierMagasinNom', e.target.value)}
                      placeholder="Ex : Super U Raizet"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.premierMagasinNom} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Adresse du magasin *</label>
                    <input
                      type="text"
                      value={form.premierMagasinAdresse}
                      onChange={(e) => set('premierMagasinAdresse', e.target.value)}
                      placeholder="Route de l'aéroport"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.premierMagasinAdresse} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ville *</label>
                    <input
                      type="text"
                      value={form.premierMagasinVille}
                      onChange={(e) => set('premierMagasinVille', e.target.value)}
                      placeholder="Les Abymes"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <FieldError msg={errors.premierMagasinVille} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Latitude GPS *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={form.premierMagasinLatitude || ''}
                        onChange={(e) => set('premierMagasinLatitude', parseFloat(e.target.value) || 0)}
                        placeholder="16.2650"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <FieldError msg={errors.premierMagasinLatitude} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Longitude GPS *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={form.premierMagasinLongitude || ''}
                        onChange={(e) => set('premierMagasinLongitude', parseFloat(e.target.value) || 0)}
                        placeholder="-61.5514"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <FieldError msg={errors.premierMagasinLongitude} />
                    </div>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
                    <strong>Comment obtenir les coordonnées GPS ?</strong><br />
                    Ouvrez Google Maps, faites un clic droit sur l'emplacement exact de votre magasin, puis copiez les coordonnées affichées.
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 4 : Plan d'abonnement ── */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Choisissez votre plan
                </h2>

                <div className="space-y-4 mb-6">
                  {MARKETPLACE_PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.plan === plan.id
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-white/15 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={form.plan === plan.id}
                            onChange={() => set('plan', plan.id as MarketplacePlan)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-semibold text-white">{plan.label}</span>
                            <p className="text-gray-400 text-xs mt-0.5">{plan.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-bold">
                            {form.billingCycle === 'annual'
                              ? `${plan.priceAnnual.toFixed(2)} €/an`
                              : `${plan.priceMonthly.toFixed(2)} €/mois`}
                          </span>
                        </div>
                      </div>
                      {form.plan === plan.id && (
                        <ul className="mt-3 space-y-1 pl-6">
                          {plan.features.map((f) => (
                            <li key={f} className="text-xs text-gray-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </label>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facturation</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 p-3 rounded-xl border cursor-pointer text-center text-sm font-medium transition-all ${
                      form.billingCycle === 'monthly' ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-white/15 text-gray-400'
                    }`}>
                      <input type="radio" name="billing" value="monthly" checked={form.billingCycle === 'monthly'}
                        onChange={() => set('billingCycle', 'monthly')} className="sr-only" />
                      Mensuelle
                    </label>
                    <label className={`flex-1 p-3 rounded-xl border cursor-pointer text-center text-sm font-medium transition-all ${
                      form.billingCycle === 'annual' ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-white/15 text-gray-400'
                    }`}>
                      <input type="radio" name="billing" value="annual" checked={form.billingCycle === 'annual'}
                        onChange={() => set('billingCycle', 'annual')} className="sr-only" />
                      Annuelle <span className="text-green-400 text-xs">(~2 mois offerts)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptesCGU}
                      onChange={(e) => set('acceptesCGU', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-gray-300">
                      J'accepte les <Link to="/mentions-legales" className="text-blue-400 underline" target="_blank" rel="noreferrer">Conditions Générales d'Utilisation</Link> de la Marketplace.
                    </span>
                  </label>
                  {errors.acceptesCGU && <FieldError msg={errors.acceptesCGU as any} />}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptesConfidentialite}
                      onChange={(e) => set('acceptesConfidentialite', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-gray-300">
                      J'accepte la <Link to="/privacy" className="text-blue-400 underline" target="_blank" rel="noreferrer">Politique de confidentialité</Link> et la collecte des données de facturation.
                    </span>
                  </label>
                  {errors.acceptesConfidentialite && <FieldError msg={errors.acceptesConfidentialite as any} />}
                </div>

                <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-xl p-4 text-sm text-yellow-300">
                  <strong>Validation manuelle requise</strong><br />
                  Votre dossier sera examiné par notre équipe dans les 48h ouvrées. Aucun prélèvement ne sera effectué avant validation.
                </div>
              </div>
            )}

            {/* Navigation entre étapes */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <button
                onClick={prevStep}
                disabled={step === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>

              {step < totalSteps - 1 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Envoi en cours…' : 'Soumettre mon dossier'}
                </button>
              )}
            </div>
          </div>

          {/* Lien déjà inscrit */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Déjà inscrit ?{' '}
            <button onClick={() => navigate('/marketplace/dashboard')} className="text-blue-400 underline">
              Accéder à mon tableau de bord
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
