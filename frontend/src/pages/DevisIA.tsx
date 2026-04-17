/**
 * DevisIA — Formulaire de demande de devis intelligent
 *
 * Étapes :
 *   1. Identité légale (organisation, SIRET, contact)
 *   2. Besoin & contexte (territoire, types, délai, profondeur)
 *   3. Estimation IA (affichage transparent & disclaimé)
 *   4. Confirmation & soumission
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createDevisRequest,
  type ClientType,
  type TypeBesoin,
  type DelaiSouhaite,
  type NiveauProfondeur,
} from '@/services/devisService';
import {
  computeEstimation,
  TYPE_BESOIN_LABELS,
  DELAI_LABELS,
  PROFONDEUR_LABELS,
  CLIENT_TYPE_LABELS,
} from '@/services/devisEstimationEngine';
import { TERRITORIES } from '@/constants/territories';

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Identité', 'Besoin', 'Estimation', 'Confirmation'];

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'collectivite', label: 'Collectivité locale' },
  { value: 'ministere', label: 'Ministère / Préfecture' },
  { value: 'association', label: 'Association' },
  { value: 'franchise', label: 'Groupe / Franchise' },
  { value: 'cabinet', label: "Cabinet d'étude" },
  { value: 'autre', label: 'Autre organisation' },
];

const BESOINS: { value: TypeBesoin; label: string; description: string }[] = [
  {
    value: 'analyse_prix',
    label: 'Analyse des prix',
    description: 'Comparaison et évolution des prix dans un territoire',
  },
  {
    value: 'etude_territoriale',
    label: 'Étude territoriale',
    description: "Panorama complet vie chère / pouvoir d'achat sur un territoire",
  },
  {
    value: 'audit_vie_chere',
    label: 'Audit vie chère',
    description: 'Diagnostic approfondi des mécanismes inflationnistes',
  },
  {
    value: 'rapport_institutionnel',
    label: 'Rapport institutionnel',
    description: "Document officiel à destination d'une assemblée ou d'une presse",
  },
  {
    value: 'acces_donnees',
    label: 'Accès aux données',
    description: 'Extraction et mise à disposition de datasets structurés',
  },
];

const TERRITOIRES = Object.values(TERRITORIES).map((t) => t.name);

// ── Form state type ───────────────────────────────────────────────────────────

interface FormData {
  clientType: ClientType;
  organisation: string;
  siret: string;
  contactNom: string;
  contactEmail: string;
  contactTel: string;
  territoire: string;
  typesBesoin: TypeBesoin[];
  delai: DelaiSouhaite;
  niveauProfondeur: NiveauProfondeur;
  descriptionLibre: string;
}

const INITIAL_FORM: FormData = {
  clientType: 'collectivite',
  organisation: '',
  siret: '',
  contactNom: '',
  contactEmail: '',
  contactTel: '',
  territoire: 'Guadeloupe',
  typesBesoin: [],
  delai: 'flexible',
  niveauProfondeur: 'standard',
  descriptionLibre: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevisIA() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth!, (u) => setUser(u));
  }, []);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [estimation, setEstimation] = useState<ReturnType<typeof computeEstimation> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devisId, setDevisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Validation per step ──────────────────────────────────────────────────────

  function validateStep0(): string | null {
    if (!form.organisation.trim()) return "Le nom de l'organisation est requis.";
    if (!form.siret.trim()) return 'Le SIRET / SIREN est requis.';
    if (!/^\d{9}(\d{5})?$/.test(form.siret.replace(/\s/g, '')))
      return 'Le SIRET doit contenir 9 (SIREN) ou 14 chiffres.';
    if (!form.contactNom.trim()) return 'Le nom du contact est requis.';
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      return 'Un email de contact valide est requis.';
    return null;
  }

  function validateStep1(): string | null {
    if (form.typesBesoin.length === 0) return 'Sélectionnez au moins un type de besoin.';
    if (!form.territoire) return 'Le territoire est requis.';
    return null;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function goNext() {
    setError(null);
    if (step === 0) {
      const err = validateStep0();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      // Compute estimation before showing step 2
      try {
        const est = computeEstimation({
          typesBesoin: form.typesBesoin,
          niveauProfondeur: form.niveauProfondeur,
          delai: form.delai,
          territoire: form.territoire,
        });
        setEstimation(est);
      } catch {
        setError("Erreur lors du calcul de l'estimation.");
        return;
      }
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!estimation) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await createDevisRequest({
        clientType: form.clientType,
        organisation: form.organisation,
        siret: form.siret,
        contactNom: form.contactNom,
        contactEmail: form.contactEmail,
        contactTel: form.contactTel,
        territoire: form.territoire,
        typesBesoin: form.typesBesoin,
        delai: form.delai,
        niveauProfondeur: form.niveauProfondeur,
        descriptionLibre: form.descriptionLibre,
        estimation,
        createdBy: user?.uid ?? 'anonymous',
      });
      setDevisId(id);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Field helpers ────────────────────────────────────────────────────────────

  function toggleBesoin(b: TypeBesoin) {
    setForm((f) => ({
      ...f,
      typesBesoin: f.typesBesoin.includes(b)
        ? f.typesBesoin.filter((x) => x !== b)
        : [...f.typesBesoin, b],
    }));
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (submitted && devisId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h1>
          <p className="text-gray-600 mb-2">
            Votre demande de devis a été enregistrée avec succès.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Notre équipe la traitera dans les meilleurs délais. Vous serez notifié par email à{' '}
            <strong>{form.contactEmail}</strong> dès validation.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 mb-6 text-left">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            L'estimation IA fournie est indicative et non contractuelle. Seul le devis signé par un
            responsable habilité aura valeur d'engagement.
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate(`/devis-ia/${devisId}`)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Suivre mon devis
            </button>
            <button onClick={() => navigate('/')} className="text-gray-500 text-sm underline">
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Devis IA — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Obtenez une estimation tarifaire pour nos services institutionnels : analyse des prix, études territoriales, audits vie chère."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/devis-ia" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/devis-ia"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/devis-ia"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="px-4 pt-4">
          <HeroImage
            src={PAGE_HERO_IMAGES.devisIA}
            alt="Devis IA"
            gradient="from-slate-950 to-violet-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              📋 Devis IA
            </h1>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Obtenez un devis estimatif intelligent pour vos projets
            </p>
          </HeroImage>
        </div>

        {/* Progress stepper */}
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${idx < step ? 'bg-indigo-600 text-white' : idx === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {idx < step ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 ${idx === step ? 'text-indigo-700 font-semibold' : 'text-gray-400'}`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${idx < step ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-red-700 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Step 0: Legal identity ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                1. Identité légale de l'organisation
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Aucun devis ne peut être établi sans identité légale valide.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="devis-type-organisation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type d'organisation *
                  </label>
                  <select
                    id="devis-type-organisation"
                    value={form.clientType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientType: e.target.value as ClientType }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {CLIENT_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="devis-nom-organisation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom de l'organisation *
                  </label>
                  <input
                    id="devis-nom-organisation"
                    type="text"
                    value={form.organisation}
                    onChange={(e) => setForm((f) => ({ ...f, organisation: e.target.value }))}
                    placeholder="Ex : Mairie de Pointe-à-Pitre"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="devis-siret"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    SIRET / SIREN / TVA *
                  </label>
                  <input
                    id="devis-siret"
                    type="text"
                    value={form.siret}
                    onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                    placeholder="Ex : 123 456 789 00010"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="devis-nom-responsable"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom du responsable *
                    </label>
                    <input
                      id="devis-nom-responsable"
                      type="text"
                      value={form.contactNom}
                      onChange={(e) => setForm((f) => ({ ...f, contactNom: e.target.value }))}
                      placeholder="Prénom Nom"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="devis-telephone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Téléphone
                    </label>
                    <input
                      id="devis-telephone"
                      type="tel"
                      value={form.contactTel}
                      onChange={(e) => setForm((f) => ({ ...f, contactTel: e.target.value }))}
                      placeholder="+590 590 XX XX XX"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="devis-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email professionnel *
                  </label>
                  <input
                    id="devis-email"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="contact@organisation.fr"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Need & context ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Besoin & contexte</h2>

              <div className="mb-5">
                <label
                  htmlFor="devis-territoire"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Territoire concerné *
                </label>
                <select
                  id="devis-territoire"
                  value={form.territoire}
                  onChange={(e) => setForm((f) => ({ ...f, territoire: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {TERRITOIRES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Type(s) de besoin * (plusieurs choix possibles)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {BESOINS.map((b) => (
                    <label
                      key={b.value}
                      aria-label={b.label}
                      className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition
                        ${
                          form.typesBesoin.includes(b.value)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.typesBesoin.includes(b.value)}
                        onChange={() => toggleBesoin(b.value)}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{b.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label
                    htmlFor="devis-delai"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Délai souhaité
                  </label>
                  <select
                    id="devis-delai"
                    value={form.delai}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, delai: e.target.value as DelaiSouhaite }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {(Object.entries(DELAI_LABELS) as [DelaiSouhaite, string][]).map(
                      ([val, lbl]) => (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="devis-niveau-profondeur"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Niveau de profondeur
                  </label>
                  <select
                    id="devis-niveau-profondeur"
                    value={form.niveauProfondeur}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        niveauProfondeur: e.target.value as NiveauProfondeur,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {(Object.entries(PROFONDEUR_LABELS) as [NiveauProfondeur, string][]).map(
                      ([val, lbl]) => (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="devis-description-libre"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description libre de votre besoin
                </label>
                <textarea
                  id="devis-description-libre"
                  value={form.descriptionLibre}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionLibre: e.target.value }))}
                  placeholder="Décrivez librement votre contexte, vos attentes et contraintes spécifiques…"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: AI Estimation ──────────────────────────────────────────── */}
          {step === 2 && estimation && (
            <div className="space-y-4 mb-6">
              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{estimation.disclaimer}</p>
              </div>

              {/* Estimation card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  3. Estimation IA — indicative
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Calculée automatiquement selon les règles de tarification de la plateforme.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Charge estimée</p>
                    <p className="text-2xl font-bold text-gray-900">{estimation.joursCharge}</p>
                    <p className="text-xs text-gray-500">jours</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-indigo-600 mb-1">Montant HT</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {estimation.prixHT.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-indigo-400">hors TVA</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-600 mb-1">Montant TTC</p>
                    <p className="text-2xl font-bold text-green-700">
                      {estimation.prixTTC.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-green-400">
                      TVA DOM {(estimation.tvaRate * 100).toFixed(1)} %
                    </p>
                  </div>
                </div>

                {/* Justification (explainable AI) */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Détail des facteurs de calcul
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {estimation.justification.map((line, i) => (
                      <li key={i} className="text-sm text-gray-600 font-mono">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirmation ──────────────────────────────────────────── */}
          {step === 3 && estimation && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                4. Récapitulatif & confirmation
              </h2>

              <div className="space-y-3 text-sm">
                <Row label="Organisation" value={form.organisation} />
                <Row label="Type" value={CLIENT_TYPE_LABELS[form.clientType] ?? form.clientType} />
                <Row label="SIRET" value={form.siret} />
                <Row label="Contact" value={`${form.contactNom} — ${form.contactEmail}`} />
                <Row label="Territoire" value={form.territoire} />
                <Row
                  label="Besoins"
                  value={form.typesBesoin.map((b) => TYPE_BESOIN_LABELS[b]).join(', ')}
                />
                <Row label="Délai" value={DELAI_LABELS[form.delai]} />
                <Row label="Profondeur" value={PROFONDEUR_LABELS[form.niveauProfondeur]} />
                <div className="border-t pt-3 mt-3">
                  <Row
                    label="Estimation HT"
                    value={`${estimation.prixHT.toLocaleString('fr-FR')} €`}
                    highlight
                  />
                  <Row
                    label="Estimation TTC"
                    value={`${estimation.prixTTC.toLocaleString('fr-FR')} €`}
                    highlight
                  />
                </div>
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <Info className="w-4 h-4 inline mr-1" />
                En soumettant cette demande, vous acceptez que nos équipes étudient votre dossier.
                Aucun paiement n'est demandé à ce stade. Le devis définitif sera validé par un
                responsable humain habilité avant envoi.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pb-12">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Envoi en cours…' : 'Soumettre la demande'}
                {!submitting && <CheckCircle className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helper component ──────────────────────────────────────────────────────────

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-right ${highlight ? 'font-bold text-indigo-700' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
