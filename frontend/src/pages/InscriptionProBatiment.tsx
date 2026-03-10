/**
 * InscriptionProBatiment – Formulaire d'inscription pour les professionnels du bâtiment
 *
 * Processus en 5 étapes :
 *  1. Informations légales (SIRET, raison sociale, forme juridique, année création)
 *  2. Gérant & Contact (prénom, nom, email, téléphone, adresse, territoire)
 *  3. Métiers & Services (corps de métier, zone, tarif, certifications)
 *  4. Documents obligatoires (engagement de détention + CGU)
 *  5. Plan tarifaire & Validation
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  HardHat, Building2, FileText, CheckCircle, ChevronRight, ChevronLeft,
  Shield, Star, Phone, Mail, MapPin, Briefcase, AlertTriangle, Upload,
  Euro, BadgeCheck, Zap, Lock,
} from 'lucide-react';
import {
  registerProBatiment,
  validateSiretLuhn,
  sirenFromSiret,
  tvaFromSiren,
  formatSiret,
  METIER_LABELS,
  PLAN_LABELS,
  PLAN_FEATURES,
  COMMISSION_RATES,
} from '@/services/proBatimentService';
import type { MetierBatiment, ProBatPlan, NewProPayload } from '@/services/proBatimentService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Données de référence ─────────────────────────────────────────────────────

const FORMES_JURIDIQUES = [
  { value: 'micro',  label: 'Micro-entreprise' },
  { value: 'ei',     label: 'EI – Entreprise Individuelle' },
  { value: 'eurl',   label: 'EURL' },
  { value: 'sarl',   label: 'SARL' },
  { value: 'sas',    label: 'SAS' },
  { value: 'sasu',   label: 'SASU' },
  { value: 'sa',     label: 'SA' },
  { value: 'autre',  label: 'Autre' },
];

const TERRITOIRES = [
  { value: 'GP', label: 'Guadeloupe' },
  { value: 'MQ', label: 'Martinique' },
  { value: 'RE', label: 'La Réunion' },
  { value: 'GF', label: 'Guyane' },
  { value: 'YT', label: 'Mayotte' },
];

const CERTIFICATIONS_OPTIONS = ['RGE', 'Qualibat', 'QualiPV', 'QualiEAU', 'Handibat', 'Aucune'];

const DOCUMENTS_LIST: { type: string; label: string; obligatoire: boolean; note?: string }[] = [
  { type: 'kbis_insee',          label: 'KBIS ou attestation INSEE',              obligatoire: true,  note: '⚠️ Upload disponible après validation' },
  { type: 'identite',            label: "Pièce d'identité du gérant",              obligatoire: true },
  { type: 'assurance_decennale', label: 'Assurance décennale en cours de validité', obligatoire: true },
  { type: 'attestation_urssaf',  label: 'Attestation URSSAF',                       obligatoire: false, note: 'Recommandée' },
  { type: 'rib',                 label: 'RIB professionnel',                        obligatoire: false, note: 'Pour facturation commission' },
];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Type interne du formulaire ───────────────────────────────────────────────

interface FormState {
  siret: string;
  formeJuridique: string;
  raisonSociale: string;
  anneeCreation: string;
  gerantPrenom: string;
  gerantNom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  territoire: string;
  metiers: MetierBatiment[];
  zoneIntervention: string;
  tarifHoraire: string;
  description: string;
  certifications: string[];
  docsConfirmed: Record<string, boolean>;
  accepteCGU: boolean;
  honnetete: boolean;
  plan: ProBatPlan;
}

const INITIAL_FORM: FormState = {
  siret: '',
  formeJuridique: '',
  raisonSociale: '',
  anneeCreation: '',
  gerantPrenom: '',
  gerantNom: '',
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  territoire: '',
  metiers: [],
  zoneIntervention: '',
  tarifHoraire: '',
  description: '',
  certifications: [],
  docsConfirmed: {},
  accepteCGU: false,
  honnetete: false,
  plan: 'free',
};

const STEPS = [
  { label: 'Légal',      icon: Building2 },
  { label: 'Gérant',     icon: HardHat },
  { label: 'Métiers',    icon: Briefcase },
  { label: 'Documents',  icon: FileText },
  { label: 'Plan',       icon: Star },
];

// ─── Barre de progression ─────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                isDone   ? 'bg-green-600 border-green-600' :
                isActive ? 'bg-orange-600 border-orange-500' :
                           'bg-slate-800 border-slate-600'
              }`}>
                {isDone
                  ? <CheckCircle className="w-5 h-5 text-white" />
                  : <Icon className="w-4 h-4 text-white" />}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${isActive ? 'text-white font-medium' : 'text-slate-500'}`}>
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
  );
}

// ─── Étape 1 – Informations légales ──────────────────────────────────────────

function Step1Legal({ form, onChange, onNext }: {
  form: FormState;
  onChange: (u: Partial<FormState>) => void;
  onNext: () => void;
}) {
  const rawSiret = form.siret.replace(/\s/g, '');
  const siretValid = validateSiretLuhn(rawSiret);
  const siren = siretValid ? sirenFromSiret(rawSiret) : '';
  const tva   = siren ? tvaFromSiren(siren) : '';

  const canContinue =
    siretValid &&
    form.raisonSociale.trim().length >= 2 &&
    !!form.formeJuridique &&
    !!form.anneeCreation &&
    +form.anneeCreation >= 1900 &&
    +form.anneeCreation <= CURRENT_YEAR;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Informations légales</h2>
      </div>

      {/* SIRET */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Numéro SIRET <span className="text-slate-500 text-xs font-normal">(14 chiffres)</span> *
        </label>
        <div className="relative">
          <input
            type="text"
            value={rawSiret.length ? formatSiret(rawSiret) : ''}
            onChange={(e) => onChange({ siret: e.target.value.replace(/\s/g, '') })}
            placeholder="123 456 789 00012"
            maxLength={17}
            className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 pr-8 ${
              rawSiret.length === 14
                ? siretValid ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500'
                : 'border-slate-600 focus:ring-orange-500'
            }`}
          />
          {rawSiret.length === 14 && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base">
              {siretValid ? '✅' : '❌'}
            </span>
          )}
        </div>
        {siretValid && (
          <p className="mt-1 text-xs text-slate-400">
            SIREN : <span className="text-green-400 font-mono">{siren}</span>
            &nbsp;·&nbsp;TVA : <span className="text-green-400 font-mono">{tva}</span>
          </p>
        )}
        {rawSiret.length === 14 && !siretValid && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> SIRET invalide (vérification Luhn échouée)
          </p>
        )}
      </div>

      {/* Raison sociale */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Raison sociale *</label>
        <input
          type="text"
          value={form.raisonSociale}
          onChange={(e) => onChange({ raisonSociale: e.target.value })}
          placeholder="Ex : Entreprise Dupont Bâtiment"
          maxLength={100}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Forme juridique */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Forme juridique *</label>
        <select
          value={form.formeJuridique}
          onChange={(e) => onChange({ formeJuridique: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">— Sélectionner —</option>
          {FORMES_JURIDIQUES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Année de création */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Année de création *</label>
        <input
          type="number"
          value={form.anneeCreation}
          onChange={(e) => onChange({ anneeCreation: e.target.value })}
          min={1900}
          max={CURRENT_YEAR}
          placeholder={String(CURRENT_YEAR)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Continuer <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Étape 2 – Gérant & Contact ───────────────────────────────────────────────

function Step2Contact({ form, onChange, onNext, onPrev }: {
  form: FormState;
  onChange: (u: Partial<FormState>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const canContinue =
    form.gerantPrenom.trim().length >= 2 &&
    form.gerantNom.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.telephone.trim().length >= 8 &&
    form.adresse.trim().length >= 5 &&
    form.codePostal.trim().length >= 4 &&
    form.ville.trim().length >= 2 &&
    !!form.territoire;

  const inputClass = 'w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <HardHat className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Gérant &amp; Contact</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Prénom du gérant *</label>
          <input type="text" value={form.gerantPrenom} onChange={(e) => onChange({ gerantPrenom: e.target.value })}
            placeholder="Jean" maxLength={50} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nom du gérant *</label>
          <input type="text" value={form.gerantNom} onChange={(e) => onChange({ gerantNom: e.target.value })}
            placeholder="Dupont" maxLength={50} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          <Mail className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Email professionnel *
        </label>
        <input type="email" value={form.email} onChange={(e) => onChange({ email: e.target.value })}
          placeholder="contact@monentreprise.fr" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          <Phone className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Téléphone *
        </label>
        <input type="tel" value={form.telephone} onChange={(e) => onChange({ telephone: e.target.value })}
          placeholder="0590 XX XX XX" maxLength={20} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          <MapPin className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Adresse professionnelle *
        </label>
        <input type="text" value={form.adresse} onChange={(e) => onChange({ adresse: e.target.value })}
          placeholder="12 rue des Flamboyants" maxLength={120} className={inputClass} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Code postal *</label>
          <input type="text" value={form.codePostal} onChange={(e) => onChange({ codePostal: e.target.value })}
            placeholder="97100" maxLength={10} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1">Ville *</label>
          <input type="text" value={form.ville} onChange={(e) => onChange({ ville: e.target.value })}
            placeholder="Pointe-à-Pitre" maxLength={80} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Territoire *</label>
        <select value={form.territoire} onChange={(e) => onChange({ territoire: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">— Sélectionner —</option>
          {TERRITOIRES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-1">
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

// ─── Étape 3 – Métiers & Services ─────────────────────────────────────────────

function Step3Metiers({ form, onChange, onNext, onPrev }: {
  form: FormState;
  onChange: (u: Partial<FormState>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const toggleMetier = (m: MetierBatiment) => {
    const next = form.metiers.includes(m)
      ? form.metiers.filter((x) => x !== m)
      : [...form.metiers, m];
    onChange({ metiers: next });
  };

  const toggleCertif = (c: string) => {
    if (c === 'Aucune') { onChange({ certifications: ['Aucune'] }); return; }
    const filtered = form.certifications.filter((x) => x !== 'Aucune');
    const next = filtered.includes(c) ? filtered.filter((x) => x !== c) : [...filtered, c];
    onChange({ certifications: next });
  };

  const canContinue = form.metiers.length > 0 && form.zoneIntervention.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Briefcase className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Métiers &amp; Services</h2>
      </div>

      {/* Corps de métier */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Corps de métier * <span className="text-slate-500 font-normal text-xs">(sélectionnez au moins 1)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(METIER_LABELS) as [MetierBatiment, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleMetier(key)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                form.metiers.includes(key)
                  ? 'bg-orange-600/30 border-orange-500 text-orange-200'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone d'intervention */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Zone d'intervention *</label>
        <input
          type="text"
          value={form.zoneIntervention}
          onChange={(e) => onChange({ zoneIntervention: e.target.value })}
          placeholder="Ex : Pointe-à-Pitre, Baie-Mahault, Abymes"
          maxLength={200}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Tarif horaire */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          <Euro className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Tarif horaire HT (€/h)
          <span className="text-slate-500 text-xs font-normal ml-1">(optionnel)</span>
        </label>
        <input
          type="number"
          value={form.tarifHoraire}
          onChange={(e) => onChange({ tarifHoraire: e.target.value })}
          placeholder="Ex : 45"
          min={0}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Présentation libre <span className="text-slate-500 text-xs font-normal">(max 500 caractères)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Décrivez votre entreprise, votre expérience, vos spécialités…"
          maxLength={500}
          rows={4}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
        <p className="text-xs text-slate-500 text-right mt-0.5">{form.description.length}/500</p>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Shield className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Certifications &amp; labels
        </label>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATIONS_OPTIONS.map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.certifications.includes(c)}
                onChange={() => toggleCertif(c)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-sm text-slate-300">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-1">
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

// ─── Étape 4 – Documents obligatoires ────────────────────────────────────────

function Step4Documents({ form, onChange, onNext, onPrev }: {
  form: FormState;
  onChange: (u: Partial<FormState>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const toggleDoc = (type: string, checked: boolean) => {
    onChange({ docsConfirmed: { ...form.docsConfirmed, [type]: checked } });
  };

  const allObligatoryConfirmed = DOCUMENTS_LIST
    .filter((d) => d.obligatoire)
    .every((d) => form.docsConfirmed[d.type]);

  const canContinue = allObligatoryConfirmed && form.accepteCGU && form.honnetete;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Documents obligatoires</h2>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
        <div className="flex items-start gap-2 mb-1">
          <Upload className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300 font-medium">Phase MVP — engagement sur l'honneur</p>
        </div>
        <p className="text-xs text-slate-400">
          L'upload direct sera disponible après validation initiale. Cochez chaque document que vous certifiez détenir.
          Notre équipe vous contactera pour en prendre copie.
        </p>
      </div>

      <div className="space-y-3">
        {DOCUMENTS_LIST.map((doc) => (
          <label key={doc.type} className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={!!form.docsConfirmed[doc.type]}
              onChange={(e) => toggleDoc(doc.type, e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-orange-500 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{doc.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  doc.obligatoire ? 'bg-red-600/30 text-red-300' : 'bg-slate-600/50 text-slate-400'
                }`}>
                  {doc.obligatoire ? 'Obligatoire' : 'Recommandé'}
                </span>
              </div>
              {doc.note && (
                <p className="text-xs text-slate-500 mt-0.5">{doc.note}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Je certifie disposer de ce document et m'engage à le transmettre à la demande de l'équipe A KI PRI SA YÉ.
              </p>
            </div>
          </label>
        ))}
      </div>

      {/* Engagements */}
      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.accepteCGU} onChange={(e) => onChange({ accepteCGU: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded accent-orange-500 shrink-0" />
          <span className="text-sm text-slate-300">
            J'accepte les{' '}
            <Link to="/mentions-legales" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
              Conditions Générales d'Utilisation
            </Link>
            {' '}de la plateforme A KI PRI SA YÉ. *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.honnetete} onChange={(e) => onChange({ honnetete: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded accent-orange-500 shrink-0" />
          <span className="text-sm text-slate-300">
            Je certifie sur l'honneur que toutes les informations fournies sont exactes et complètes. *
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-1">
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

// ─── Étape 5 – Plan tarifaire & Validation ────────────────────────────────────

function Step5Plan({ form, onChange, onSubmit, onPrev, submitting }: {
  form: FormState;
  onChange: (u: Partial<FormState>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  submitting: boolean;
}) {
  const PLANS: { id: ProBatPlan; price: string; icon: React.ReactNode; badge: string; badgeColor: string }[] = [
    { id: 'free',      price: 'Gratuit',      icon: <Lock className="w-5 h-5" />,     badge: 'En attente de vérif.',  badgeColor: 'text-yellow-300 bg-yellow-900/30 border-yellow-600/30' },
    { id: 'essentiel', price: '14,90 €/mois', icon: <BadgeCheck className="w-5 h-5" />, badge: 'Pro Vérifié ✅',      badgeColor: 'text-green-300 bg-green-900/30 border-green-600/30' },
    { id: 'premium',   price: '29,90 €/mois', icon: <Zap className="w-5 h-5" />,       badge: '💎 Premium Prioritaire', badgeColor: 'text-orange-300 bg-orange-900/30 border-orange-600/30' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Star className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Plan tarifaire</h2>
      </div>

      <div className="space-y-3">
        {PLANS.map((p) => {
          const isSelected = form.plan === p.id;
          const rate = COMMISSION_RATES[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ plan: p.id })}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-900/20 ring-2 ring-orange-500/40'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-600/30 text-orange-300' : 'bg-slate-700/50 text-slate-400'}`}>
                    {p.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{PLAN_LABELS[p.id]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    {rate > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">Commission {rate}% sur devis accepté</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-white shrink-0">{p.price}</span>
              </div>
              <ul className="mt-3 space-y-1">
                {PLAN_FEATURES[p.id].map((f, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <p className="text-xs text-slate-400">
          <strong className="text-orange-300">Modèle de commission :</strong>{' '}
          La commission s'applique uniquement sur les devis acceptés et signalés sur la plateforme.
          Gratuit si aucun devis confirmé. Aucun prélèvement automatique.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onPrev} className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />Retour
        </button>
        <button onClick={onSubmit} disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
          {submitting ? 'Envoi en cours…' : <><CheckCircle className="w-5 h-5" />Soumettre mon dossier</>}
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function InscriptionProBatiment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const rawSiret = form.siret.replace(/\s/g, '');
      const siren = sirenFromSiret(rawSiret);
      const tva = tvaFromSiren(siren);

      let uid = 'anonymous';
      await new Promise<void>((resolve) => {
        if (!auth) { resolve(); return; }
        const unsub = onAuthStateChanged(auth, (user) => {
          if (user) uid = user.uid;
          unsub();
          resolve();
        });
      });

      const payload: NewProPayload = {
        uid,
        siret:          rawSiret,
        siren,
        tva,
        raisonSociale:  form.raisonSociale.trim(),
        formeJuridique: form.formeJuridique,
        gerantPrenom:   form.gerantPrenom.trim(),
        gerantNom:      form.gerantNom.trim(),
        email:          form.email.trim(),
        telephone:      form.telephone.trim(),
        adresse:        form.adresse.trim(),
        codePostal:     form.codePostal.trim(),
        ville:          form.ville.trim(),
        territoire:     form.territoire,
        metiers:        form.metiers,
        specialites:    [],
        description:    form.description.trim(),
        zoneIntervention: form.zoneIntervention.trim(),
        tarifHoraire:   form.tarifHoraire ? Number(form.tarifHoraire) : null,
        certifications: form.certifications,
        assuranceDecen: !!form.docsConfirmed['assurance_decennale'],
        anneeCreation:  form.anneeCreation ? Number(form.anneeCreation) : null,
        documents:      [],
        plan:           form.plan,
      };

      const res = await registerProBatiment(payload);
      if (res.success && res.id) {
        setResult({ id: res.id });
      } else {
        setSubmitError(res.error ?? 'Une erreur est survenue. Veuillez réessayer.');
      }
    } catch (e) {
      setSubmitError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <>
        <Helmet>
          <title>Dossier soumis – Pro Bâtiment – A KI PRI SA YÉ</title>
                <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/inscription-pro" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/inscription-pro" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/inscription-pro" />
      </Helmet>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center space-y-5">
            <div className="text-5xl">✅</div>
            <h1 className="text-2xl font-bold text-white">Dossier soumis avec succès</h1>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 inline-block">
              <p className="text-xs text-slate-400">Référence dossier</p>
              <p className="font-mono text-orange-400 text-sm font-semibold">{result.id}</p>
            </div>
            <p className="text-slate-300 text-sm">
              Notre équipe vérifiera votre dossier sous <strong className="text-white">48 à 72h</strong>.
              Vous recevrez un email de confirmation à l'adresse indiquée.
            </p>
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  Votre profil sera publié <strong>uniquement après vérification</strong> de vos documents
                  par l'équipe A KI PRI SA YÉ.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/calculateur-batiment')}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <HardHat className="w-5 h-5" /> Retour au calculateur bâtiment
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Inscription Pro Bâtiment – A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Inscrivez votre entreprise du bâtiment sur A KI PRI SA YÉ et accédez aux chantiers en Guadeloupe, Martinique, Réunion, Guyane et Mayotte."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-600/20 border border-orange-500/30 rounded-full px-4 py-1.5 mb-4">
              <HardHat className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300 font-medium">Espace Pro Bâtiment DOM-TOM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Référencer votre entreprise
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Guadeloupe · Martinique · La Réunion · Guyane · Mayotte
            </p>
          </div>

          {/* Barre de progression */}
          <StepBar step={step} />

          {/* Contenu de l'étape */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8">
            {step === 0 && (
              <Step1Legal form={form} onChange={handleChange} onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <Step2Contact form={form} onChange={handleChange} onNext={() => setStep(2)} onPrev={() => setStep(0)} />
            )}
            {step === 2 && (
              <Step3Metiers form={form} onChange={handleChange} onNext={() => setStep(3)} onPrev={() => setStep(1)} />
            )}
            {step === 3 && (
              <Step4Documents form={form} onChange={handleChange} onNext={() => setStep(4)} onPrev={() => setStep(2)} />
            )}
            {step === 4 && (
              <Step5Plan form={form} onChange={handleChange} onSubmit={handleSubmit} onPrev={() => setStep(3)} submitting={submitting} />
            )}

            {submitError && (
              <div className="mt-4 flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center mt-4">
            Déjà inscrit ?{' '}
            <Link to="/espace-pro-batiment" className="text-orange-400 underline">Accéder à mon espace</Link>
          </p>
        </div>
      </div>
    </>
  );
}
