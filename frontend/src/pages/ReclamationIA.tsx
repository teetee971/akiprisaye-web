/**
 * ReclamationIA — Rédacteur IA de lettres de réclamation consommateur
 *
 * Génère une lettre de réclamation formelle prête à envoyer à une enseigne
 * ou à la DGCCRF, basée sur un prix jugé abusif.
 *
 * Pas d'appel API externe — la lettre est générée côté client à partir d'un
 * template structuré. Export texte + impression navigateur.
 *
 * Sources / destinataires officiels :
 *   DGCCRF : https://signal.conso.gouv.fr
 *   OPMR Guadeloupe : https://www.guadeloupe.gouv.fr/...OPMR...
 *   Service-public.fr : https://www.service-public.fr/particuliers/vosdroits/F24687
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Types ──────────────────────────────────────────────────────────────────────

type TypePlainte = 'prix_abusif' | 'promo_mensongere' | 'bqp' | 'pratique_deloyale';

interface FormData {
  nom: string;
  adresse: string;
  territoire: string;
  enseigne: string;
  produit: string;
  prixConstate: string;
  prixReference: string;
  dateConstat: string;
  typePlainte: TypePlainte;
  details: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────────

const TERRITOIRES = [
  { code: 'gp', label: 'Guadeloupe',            opmr: 'Préfecture de Guadeloupe — OPMR', opmrUrl: 'https://www.guadeloupe.gouv.fr/Politiques-publiques/Economie-emploi-et-entreprises/Observatoire-des-Prix-des-Marges-et-des-Revenus' },
  { code: 'mq', label: 'Martinique',             opmr: 'Préfecture de Martinique — OPMR', opmrUrl: 'https://www.martinique.gouv.fr/' },
  { code: 'gf', label: 'Guyane',                 opmr: 'Préfecture de Guyane — OPMR',     opmrUrl: 'https://www.guyane.gouv.fr/' },
  { code: 're', label: 'La Réunion',              opmr: 'Préfecture de La Réunion — OPMR', opmrUrl: 'https://www.reunion.gouv.fr/' },
  { code: 'yt', label: 'Mayotte',                 opmr: 'Préfecture de Mayotte — OPMR',    opmrUrl: 'https://www.mayotte.gouv.fr/' },
];

const PLAINTE_TYPES: { id: TypePlainte; label: string; emoji: string }[] = [
  { id: 'prix_abusif',        label: 'Prix abusif / excessif',          emoji: '💸' },
  { id: 'promo_mensongere',   label: 'Promotion mensongère / prix barré trompeur', emoji: '🏷️' },
  { id: 'bqp',                label: 'Non-respect du Bouclier Qualité Prix', emoji: '🛡️' },
  { id: 'pratique_deloyale',  label: 'Pratique commerciale déloyale',   emoji: '⚖️' },
];

// ─── Letter generator ──────────────────────────────────────────────────────────

function generateLetter(f: FormData): string {
  const terr = TERRITOIRES.find(t => t.code === f.territoire);
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const ecart = f.prixConstate && f.prixReference
    ? Math.round(((parseFloat(f.prixConstate) - parseFloat(f.prixReference)) / parseFloat(f.prixReference)) * 100)
    : null;

  const objet: Record<TypePlainte, string> = {
    prix_abusif: 'Réclamation pour prix abusif — ' + f.produit,
    promo_mensongere: 'Réclamation pour publicité mensongère sur promotion — ' + f.produit,
    bqp: 'Signalement de non-respect du Bouclier Qualité Prix — ' + f.produit,
    pratique_deloyale: 'Réclamation pour pratique commerciale déloyale — ' + f.produit,
  };

  const corps: Record<TypePlainte, string> = {
    prix_abusif: `J'ai constaté le ${f.dateConstat || 'date du constat'} dans votre établissement ${f.enseigne} en ${terr?.label ?? f.territoire} que le produit "${f.produit}" était vendu au prix de ${f.prixConstate} €${f.prixReference ? `, alors que le prix de référence pour ce produit est de ${f.prixReference} €` : ''}${ecart && ecart > 0 ? `, soit un surcoût de ${ecart} %` : ''}.

Ce prix me semble manifestement abusif au sens de l'article L. 410-2 du Code de Commerce et des dispositions de l'ordonnance n° 86-1243 du 1er décembre 1986 relative à la liberté des prix et de la concurrence.`,

    promo_mensongere: `J'ai constaté le ${f.dateConstat || 'date du constat'} dans votre établissement ${f.enseigne} en ${terr?.label ?? f.territoire} que le produit "${f.produit}" faisait l'objet d'une promotion affichant un prix barré de ${f.prixReference || '[prix barré affiché]'} €, mais que son prix de vente réel est de ${f.prixConstate} €.

Cette pratique constitue une publicité mensongère au sens des articles L. 121-1 et suivants du Code de la Consommation. Le prix de référence affiché n'est pas le prix habituel de vente du produit.`,

    bqp: `J'ai constaté le ${f.dateConstat || 'date du constat'} dans votre établissement ${f.enseigne} en ${terr?.label ?? f.territoire} que le produit "${f.produit}" était vendu au prix de ${f.prixConstate} €, alors que ce produit figure sur la liste du Bouclier Qualité Prix 2024 et devrait être vendu à ${f.prixReference || '[prix BQP]'} €.

L'accord BQP engage les distributeurs à respecter des prix plafonds sur une liste de produits de première nécessité, conformément aux arrêtés préfectoraux en vigueur dans les DROM.`,

    pratique_deloyale: `J'ai constaté le ${f.dateConstat || 'date du constat'} dans votre établissement ${f.enseigne} en ${terr?.label ?? f.territoire} une pratique commerciale déloyale concernant le produit "${f.produit}", vendu à ${f.prixConstate} €.

${f.details || '[Décrire la pratique déloyale observée]'}

Cette pratique est contraire aux dispositions des articles L. 120-1 et suivants du Code de la Consommation relatifs aux pratiques commerciales déloyales.`,
  };

  return `${f.nom || 'Prénom Nom'}
${f.adresse || 'Adresse complète'}
${terr?.label ?? f.territoire}

À l'attention du Service Consommateurs
${f.enseigne}
${terr?.label ?? f.territoire}

${today}

**Objet : ${objet[f.typePlainte]}**

Madame, Monsieur,

${corps[f.typePlainte]}

${f.details ? `Informations complémentaires : ${f.details}

` : ''}Je vous demande, en application des dispositions du Code de la Consommation et de la réglementation spécifique aux DROM :
  1. De corriger immédiatement ce prix / cette pratique ;
  2. De me confirmer par écrit les mesures correctives prises dans un délai de 15 jours ouvrés ;
  3. De procéder, le cas échéant, au remboursement de la différence de prix constatée.

À défaut de réponse satisfaisante dans ce délai, je me réserve le droit de :
  – Saisir la DGCCRF via le portail SignalConso (signal.conso.gouv.fr) ;
  – Contacter l'Observatoire des Prix, Marges et Revenus (OPMR) de ${terr?.label ?? f.territoire} ;
  – Porter ce litige devant le tribunal compétent.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${f.nom || 'Prénom Nom'}

---
Copie : DGCCRF — signal.conso.gouv.fr
Copie : ${terr?.opmr ?? 'OPMR local'}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ReclamationIA() {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [form, setForm] = useState<FormData>({
    nom: '',
    adresse: '',
    territoire: 'gp',
    enseigne: '',
    produit: '',
    prixConstate: '',
    prixReference: '',
    dateConstat: new Date().toISOString().split('T')[0],
    typePlainte: 'prix_abusif',
    details: '',
  });

  const letter = generateLetter(form);

  function handlePrint() {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lettre de réclamation</title>
      <style>body{font-family:serif;font-size:13pt;max-width:700px;margin:40px auto;line-height:1.7;color:#111;}
      pre{white-space:pre-wrap;font-family:serif;}@media print{body{margin:20mm;}}</style></head>
      <body><pre>${letter.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</pre></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  function handleCopy() {
    navigator.clipboard.writeText(letter).catch(() => {});
  }

  const terr = TERRITOIRES.find(t => t.code === form.territoire);
  const isFormValid = form.enseigne.trim() && form.produit.trim() && form.prixConstate.trim();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ marginBottom: '1rem' }}>
          <Link to="/innovation-lab" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>← Innovation Lab</Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.reclamationIA}
          alt="Réclamation IA"
          gradient="from-slate-950 to-violet-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            ✍️ Réclamation IA
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Générez une lettre de réclamation officielle en 2 minutes
          </p>
        </HeroImage>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[{ id: 'form', label: '📝 Remplir le formulaire' }, { id: 'preview', label: '📄 Lettre générée' }].map(t => (
            <button key={t.id} onClick={() => setStep(t.id as 'form' | 'preview')}
              disabled={t.id === 'preview' && !isFormValid}
              style={{ padding: '0.45rem 1rem', borderRadius: 8, border: `1px solid ${step === t.id ? 'rgba(99,102,241,0.55)' : 'rgba(148,163,184,0.2)'}`,
                background: step === t.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: step === t.id ? '#a5b4fc' : '#64748b',
                fontSize: '0.82rem', fontWeight: step === t.id ? 700 : 400, cursor: t.id === 'preview' && !isFormValid ? 'not-allowed' : 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {step === 'form' && (
          <div style={{ padding: '1.25rem 1.4rem', borderRadius: 16, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)' }}>

            {/* Type de plainte */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Type de réclamation *</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {PLAINTE_TYPES.map(p => (
                  <button key={p.id} onClick={() => setForm(f => ({ ...f, typePlainte: p.id }))}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: `1px solid ${form.typePlainte === p.id ? 'rgba(99,102,241,0.55)' : 'rgba(148,163,184,0.2)'}`,
                      background: form.typePlainte === p.id ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.5)',
                      color: form.typePlainte === p.id ? '#a5b4fc' : '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}>
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {[
                { key: 'nom', label: 'Votre nom complet', placeholder: 'Marie Dupont', required: false },
                { key: 'adresse', label: 'Votre adresse', placeholder: '12 rue de la Paix, Pointe-à-Pitre', required: false },
                { key: 'enseigne', label: 'Enseigne concernée *', placeholder: 'Carrefour, Leader Price…', required: true },
                { key: 'produit', label: 'Produit concerné *', placeholder: 'Huile de tournesol 1L', required: true },
                { key: 'prixConstate', label: 'Prix constaté (€) *', placeholder: '4,50', required: true },
                { key: 'prixReference', label: 'Prix de référence (€)', placeholder: '3,20 (prix métro, BQP…)', required: false },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>{field.label}</label>
                  <input value={(form as unknown as Record<string, string>)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder} required={field.required}
                    style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Territoire *</label>
                <select value={form.territoire} onChange={e => setForm(f => ({ ...f, territoire: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.85rem', boxSizing: 'border-box' }}>
                  {TERRITOIRES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Date du constat</label>
                <input type="date" value={form.dateConstat} onChange={e => setForm(f => ({ ...f, dateConstat: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Détails supplémentaires (optionnel)</label>
              <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={3}
                placeholder="Photos, témoins, circonstances particulières…"
                style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.35)', color: '#f1f5f9', fontSize: '0.82rem', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <button onClick={() => setStep('preview')} disabled={!isFormValid}
              style={{ padding: '0.6rem 1.5rem', borderRadius: 8, background: isFormValid ? 'rgba(99,102,241,0.85)' : 'rgba(99,102,241,0.3)', color: '#fff', fontSize: '0.88rem', fontWeight: 700, border: 'none', cursor: isFormValid ? 'pointer' : 'not-allowed' }}>
              ⚖️ Générer la lettre →
            </button>

            {/* Official links */}
            <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Liens officiels utiles</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'SignalConso DGCCRF', url: 'https://signal.conso.gouv.fr' },
                  { label: 'Service-Public — Droits conso.', url: 'https://www.service-public.fr/particuliers/vosdroits/F24687' },
                  { label: `OPMR ${terr?.label ?? ''}`, url: terr?.opmrUrl ?? '#' },
                  { label: 'BQP — Bouclier Qualité Prix', url: 'https://www.economie.gouv.fr/outre-mer/bouclier-qualite-prix' },
                ].map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.65rem', color: '#a5b4fc', textDecoration: 'none', padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    🔗 {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button onClick={handlePrint}
                style={{ padding: '0.5rem 1.1rem', borderRadius: 8, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#86efac', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                🖨️ Imprimer / Télécharger PDF
              </button>
              <button onClick={handleCopy}
                style={{ padding: '0.5rem 1.1rem', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                📋 Copier le texte
              </button>
              <a href={`mailto:?subject=${encodeURIComponent('Réclamation — ' + form.produit)}&body=${encodeURIComponent(letter)}`}
                style={{ padding: '0.5rem 1.1rem', borderRadius: 8, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', color: '#7dd3fc', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                ✉️ Envoyer par email
              </a>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.15)', fontFamily: 'Georgia, serif' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
                {letter.replace(/\*\*(.*?)\*\*/g, (_, m) => m.toUpperCase())}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
