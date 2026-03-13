/**
 * generate.js — Générateur automatique de la Lettre Hebdomadaire IA
 *
 * Flux :
 *  1. Collecte les articles de la semaine depuis les flux RSS des médias DOM/COM
 *  2. Envoie le tout à OpenAI GPT-4o-mini pour générer un éditorial structuré
 *  3. Sauvegarde le résultat dans Firestore (collection `lettre_hebdo_ia`)
 *
 * Usage :
 *   node generate.js              → Production (écrit dans Firestore)
 *   node generate.js --dry-run   → Simulation (affiche le résultat sans écrire)
 *
 * Variables d'environnement requises :
 *   OPENAI_API_KEY           — Clé API OpenAI (https://platform.openai.com/api-keys)
 *   FIREBASE_SERVICE_ACCOUNT — JSON des credentials Firebase Admin, en clair ou
 *                              encodé en base64 (Firebase Console > Paramètres du
 *                              projet > Comptes de service > Générer une nouvelle clé)
 */

import { XMLParser } from 'fast-xml-parser';
import OpenAI from 'openai';
import admin from 'firebase-admin';
import sanitizeHtml from 'sanitize-html';

const DRY_RUN = process.argv.includes('--dry-run');
const MODEL = 'gpt-4o-mini';

function stripHtmlToText(input) {
  if (typeof input !== 'string') {
    input = String(input ?? '');
  }
  // Remove all HTML tags and attributes to get safe plain text
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}

// ─── Sources RSS ────────────────────────────────────────────────────────────────
// Médias publics et indépendants couvrant les territoires ultramarins français.
// URLs vérifiées le 2026-03-13 via atlasflux.saynete.net (la1ere.franceinfo.fr)
// et https://www.franceinfo.fr/rss/ pour les flux thématiques nationaux.
// Ancien domaine la1ere.francetvinfo.fr → redirige vers la1ere.franceinfo.fr/rss.xml
// qui renvoie 404 : tous les flux sont désormais sur la1ere.franceinfo.fr avec
// les chemins /actu/rss, /economie/rss?r=<territoire>, /societe/rss, etc.
const RSS_FEEDS = [
  // ── France Info — Outre-Mer & thématiques nationales ──────────────────────
  // Spécifiquement Outre-Mer (sélection éditoriale France Télévisions)
  { url: 'https://www.franceinfo.fr/france/outre-mer.rss',           source: 'France Info Outre-Mer',  territory: 'Outre-Mer'  },
  // Économie nationale (prix, pouvoir d'achat, inflation, consommation)
  { url: 'https://www.franceinfo.fr/economie.rss',                   source: 'France Info Économie',   territory: 'Outre-Mer'  },
  // Société (conditions de vie, emploi, social)
  { url: 'https://www.franceinfo.fr/societe.rss',                    source: 'France Info Société',    territory: 'Outre-Mer'  },
  // ── La1ère — Actu générale & économie par territoire ──────────────────────
  // Actu générale DOM/COM (30 articles)
  { url: 'https://la1ere.franceinfo.fr/actu/rss',                    source: 'La1ère — Actu DOM',      territory: 'Outre-Mer'  },
  // Économie par territoire (prix, pouvoir d'achat, emploi)
  { url: 'https://la1ere.franceinfo.fr/economie/rss?r=guadeloupe',   source: 'La1ère Guadeloupe Éco',  territory: 'Guadeloupe' },
  { url: 'https://la1ere.franceinfo.fr/economie/rss?r=martinique',   source: 'La1ère Martinique Éco',  territory: 'Martinique' },
  { url: 'https://la1ere.franceinfo.fr/economie/rss?r=reunion',      source: 'La1ère Réunion Éco',     territory: 'La Réunion' },
  { url: 'https://la1ere.franceinfo.fr/economie/rss?r=guyane',       source: 'La1ère Guyane Éco',      territory: 'Guyane'     },
  { url: 'https://la1ere.franceinfo.fr/economie/rss?r=mayotte',      source: 'La1ère Mayotte Éco',     territory: 'Mayotte'    },
  // Société (conditions de vie, social, éducation)
  { url: 'https://la1ere.franceinfo.fr/societe/rss',                 source: 'La1ère — Société DOM',   territory: 'Outre-Mer'  },
  // Martinique actualités complètes
  { url: 'https://la1ere.franceinfo.fr/martinique/actu/rss',         source: 'La1ère Martinique',      territory: 'Martinique' },
  // ── Presse indépendante ───────────────────────────────────────────────────
  // ImazPress — presse indépendante La Réunion
  { url: 'https://imazpress.com/feed',                               source: 'ImazPress Réunion',      territory: 'La Réunion' },
];

// ─── Utilitaires temporels ──────────────────────────────────────────────────────

/** Retourne l'identifiant ISO de la semaine : "2026-W10" */
function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Retourne la période lisible : "Semaine du 3 au 9 mars 2026" */
function getWeekPeriode(date = new Date()) {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `Semaine du ${fmt(monday)} au ${fmt(sunday)}`;
}

// ─── Collecte RSS ───────────────────────────────────────────────────────────────

/** Récupère et parse un flux RSS. Retourne une liste d'articles ou [] si échec. */
async function fetchFeed(feed, parser) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'AKiPriSaYe-Bot/1.0 (+https://akiprisaye.pf)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    return items.slice(0, 10).map((item) => ({
      title: stripHtmlToText(item.title ?? '').trim(),
      description: stripHtmlToText(item.description ?? '')
        .trim()
        .slice(0, 350),
      url: String(item.link ?? item.guid ?? ''),
      publishedAt: String(item.pubDate ?? ''),
      source: feed.source,
      territory: feed.territory,
    }));
  } catch (err) {
    console.warn(`⚠️  Flux ignoré (${feed.source}) : ${err.message}`);
    return [];
  }
}

// ─── Prompt IA ─────────────────────────────────────────────────────────────────

function buildPrompt(articles, periode) {
  const articlesText = articles
    .slice(0, 35)
    .map(
      (a, i) =>
        `${i + 1}. [${a.territory} — ${a.source}]\n` +
        `Titre : ${a.title}\n` +
        `Résumé : ${a.description}\n` +
        `Publié : ${a.publishedAt}\n` +
        `URL : ${a.url}`,
    )
    .join('\n\n');

  return `Tu es le rédacteur en chef de l'Observatoire citoyen A KI PRI SA YÉ, \
plateforme de transparence des prix dans les territoires ultramarins français \
(Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, Polynésie française, \
Nouvelle-Calédonie, Saint-Martin, Saint-Barthélemy, Wallis-et-Futuna, etc.).

Chaque semaine, tu rédiges une lettre éditoriale sur l'actualité économique, \
sociale et environnementale des DOM/COM. Ton ton est journalistique, neutre, \
accessible et engagé pour la transparence citoyenne.

PÉRIODE : ${periode}

ARTICLES COLLECTÉS CETTE SEMAINE :
${articlesText}

INSTRUCTIONS :
- Rédige une lettre hebdomadaire professionnelle, structurée et équilibrée.
- Privilégie les sujets liés aux prix, au pouvoir d'achat, à l'emploi, à \
  l'environnement et à la vie quotidienne dans les DOM/COM.
- Couvre plusieurs territoires différents pour donner une vue d'ensemble.
- Cite explicitement les articles sources (titre ou URL) dans les sections.
- Inclus des chiffres concrets tirés des articles (pas inventés).
- Génère 3 à 5 sections thématiques variées.
- Rédige 2 à 4 indicateurs chiffrés clés de la semaine.

RÉPONDS UNIQUEMENT avec un JSON valide (sans balises markdown), \
avec exactement cette structure :
{
  "titre": "Titre accrocheur de la lettre (max 90 caractères)",
  "chapeau": "Paragraphe d'introduction de 2-3 phrases résumant les enjeux principaux.",
  "sections": [
    {
      "titre": "Titre de la section",
      "territoire": "Territoire concerné ou 'Outre-Mer' si multi-territoire",
      "contenu": "Développement de 120-180 mots. Cite les faits et les acteurs.",
      "sources": ["Titre ou URL de l'article source utilisé"]
    }
  ],
  "indicateurs": [
    {
      "valeur": "Chiffre clé (ex: '+2,3 %', '12 000 emplois')",
      "label": "Ce que ça mesure",
      "territoire": "Territoire concerné"
    }
  ],
  "tags": ["Guadeloupe", "prix", "emploi", "..."]
}`;
}

// ─── Firebase Admin ────────────────────────────────────────────────────────────

function initFirebase() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Variable FIREBASE_SERVICE_ACCOUNT manquante');

  let serviceAccount;
  try {
    // Accepte JSON brut ou encodé en base64
    const decoded = raw.trimStart().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT invalide (attendu : JSON ou base64 de JSON)');
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin.firestore();
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🤖 Démarrage du générateur de Lettre Hebdo IA…');
  if (DRY_RUN) console.log('ℹ️  Mode DRY RUN — aucune écriture Firestore');

  const weekId = getWeekId();
  const periode = getWeekPeriode();
  console.log(`📅 Semaine : ${weekId} — ${periode}`);

  // 1. Collecte RSS
  console.log('📡 Collecte des flux RSS…');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '_' });
  const nested = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f, parser)));
  const articles = nested.flat().filter((a) => a.title.length > 5);
  console.log(`✅ ${articles.length} articles collectés depuis ${RSS_FEEDS.length} sources`);

  if (articles.length < 3) {
    throw new Error(`Trop peu d'articles collectés (${articles.length}) — arrêt`);
  }

  // 2. Génération IA
  console.log(`🧠 Génération par IA (${MODEL})…`);
  if (!process.env.OPENAI_API_KEY) throw new Error('Variable OPENAI_API_KEY manquante');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt(articles, periode) }],
    temperature: 0.65,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  if (!raw) throw new Error('Réponse IA vide');

  let editorial;
  try {
    editorial = JSON.parse(raw);
  } catch {
    throw new Error(`JSON IA invalide : ${raw.slice(0, 300)}`);
  }
  console.log(`✅ Éditorial généré : "${editorial.titre}"`);

  // 3. Construction du document Firestore
  const doc = {
    weekId,
    periode,
    titre: String(editorial.titre ?? `Lettre Hebdo — ${periode}`).slice(0, 120),
    chapeau: String(editorial.chapeau ?? ''),
    sections: (Array.isArray(editorial.sections) ? editorial.sections : []).map((s) => ({
      titre: String(s.titre ?? ''),
      territoire: String(s.territoire ?? 'Outre-Mer'),
      contenu: String(s.contenu ?? ''),
      sources: Array.isArray(s.sources) ? s.sources.map(String) : [],
    })),
    indicateurs: (Array.isArray(editorial.indicateurs) ? editorial.indicateurs : []).map((i) => ({
      valeur: String(i.valeur ?? ''),
      label: String(i.label ?? ''),
      territoire: String(i.territoire ?? ''),
    })),
    tags: Array.isArray(editorial.tags) ? editorial.tags.map(String).slice(0, 15) : [],
    sourcesArticles: articles.slice(0, 25).map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source,
      territory: a.territory,
      publishedAt: a.publishedAt,
    })),
    model: MODEL,
    tokensUsed: completion.usage?.total_tokens ?? 0,
    generatedAt: new Date().toISOString(),
    status: 'published',
  };

  // 4. Dry run → afficher et quitter
  if (DRY_RUN) {
    console.log('\n🔍 Document généré (non sauvegardé) :');
    console.log(JSON.stringify(doc, null, 2));
    return;
  }

  // 5. Sauvegarde Firestore
  console.log('💾 Sauvegarde dans Firestore (lettre_hebdo_ia/' + weekId + ')…');
  const db = initFirebase();
  await db.collection('lettre_hebdo_ia').doc(weekId).set(doc, { merge: true });
  console.log(`\n🎉 Lettre "${doc.titre}" publiée pour la semaine ${weekId}`);
}

main().catch((err) => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
