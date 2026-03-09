/**
 * Cloudflare Pages Function — Proxy INSEE Sirene API
 * Route : /api/insee-pros-batiment
 *
 * Interroge l'API Sirene v3 de l'INSEE pour récupérer les professionnels
 * du bâtiment actifs dans les départements DOM-TOM.
 *
 * Documentation API :
 *   https://api.insee.fr/entreprises/sirene/V3/
 *
 * Auth : OAuth2 Bearer (clé API INSEE stockée en secret Cloudflare Pages).
 *
 * Paramètres GET :
 *   - territory : code territoire (GP|MQ|RE|GF|YT)  — défaut: GP
 *   - naf       : code(s) NAF séparés par virgule    — défaut: tous les codes bâtiment
 *   - page      : numéro de page (défaut: 1)
 *   - perPage   : résultats par page (défaut: 20, max: 100)
 *
 * Réponse :
 *   {
 *     total:    number,
 *     page:     number,
 *     perPage:  number,
 *     results:  InseeEtablissement[],
 *     source:   'insee_sirene_v3',
 *   }
 *
 * Erreurs :
 *   401 — Clé API INSEE manquante ou invalide
 *   503 — INSEE API indisponible
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface Env {
  /** Clé OAuth2 Bearer INSEE — à configurer dans Cloudflare Pages > Settings > Variables */
  INSEE_API_TOKEN: string;
}

/** Établissement retourné par l'API Sirene */
interface InseeEtablissement {
  siret: string;
  siren: string;
  raisonSociale: string;
  denomination: string | null;
  nomUsuel: string | null;
  nafCode: string;           // ex: "43.99C"
  nafLibelle: string;
  formeJuridique: string;
  codeFormeJuridique: string;
  adresse: string;
  codePostal: string;
  ville: string;
  departement: string;      // "971", "972", etc.
  dateCreation: string;     // "AAAA-MM-JJ"
  etatAdministratif: 'A' | 'F';  // A = Actif, F = Fermé
  trancheEffectifs: string | null;
  telephone: string | null;  // Rarement fourni par INSEE
  siège: boolean;
}

interface InseeApiResponse {
  header: {
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: InseeRaw[];
}

interface InseeRaw {
  siret?: string;
  uniteLegale?: {
    siren?: string;
    denominationUniteLegale?: string;
    nomUsuel1UniteLegale?: string;
    categorieJuridiqueUniteLegale?: string;
    activitePrincipaleUniteLegale?: string;
    nomenclatureActivitePrincipaleUniteLegale?: string;
  };
  adresseEtablissement?: {
    numeroVoieEtablissement?: string;
    typeVoieEtablissement?: string;
    libelleVoieEtablissement?: string;
    codePostalEtablissement?: string;
    libelleCommuneEtablissement?: string;
    codeDepartementEtablissement?: string;
  };
  periodesEtablissement?: Array<{
    etatAdministratifEtablissement?: string;
    activitePrincipaleEtablissement?: string;
    nomenclatureActivitePrincipaleEtablissement?: string;
    enseigne1Etablissement?: string;
    denominationUsuelleEtablissement?: string;
    changementEtatAdministratifEtablissement?: boolean;
  }>;
  dateCreationEtablissement?: string;
  trancheEffectifsEtablissement?: string;
  etablissementSiege?: boolean;
}

// ── Codes NAF — corps de métiers du bâtiment (nomenclature NAF rév.2) ─────────

/**
 * Tous les codes NAF correspondant aux corps de métiers du bâtiment
 * listés dans notre MetierBatiment.
 *
 * Source : https://www.insee.fr/fr/information/2406147
 */
export const NAF_CODES_BATIMENT: string[] = [
  // Construction — gros œuvre
  '41.10A', '41.20A', '41.20B',
  // Travaux de construction spécialisés — démolition
  '43.11Z',
  // Terrassement
  '43.12A', '43.12B', '43.13Z',
  // Électricité
  '43.21A', '43.21B',
  // Plomberie / Chauffage / Climatisation
  '43.22A', '43.22B',
  // Isolation
  '43.29A', '43.29B',
  // Plâtrerie
  '43.31Z',
  // Menuiserie bois/PVC
  '43.32A',
  // Menuiserie métallique / Serrurerie
  '43.32B',
  // Agencement
  '43.32C',
  // Revêtement sols et murs (carrelage, parquet, peinture, vitrerie)
  '43.33Z',
  // Peinture & Vitrerie
  '43.34Z',
  // Autres finitions
  '43.39Z',
  // Charpente
  '43.91A', '43.91B',
  // Étanchéité
  '43.99A',
  // Structures métalliques
  '43.99B',
  // Maçonnerie & gros œuvre
  '43.99C',
  // Travaux spécialisés divers
  '43.99D', '43.99E',
  // Aménagement paysager
  '81.30Z',
  // Entretien espaces verts
  '81.10Z',
];

/** Label lisible pour chaque code NAF bâtiment */
export const NAF_LIBELLES: Record<string, string> = {
  '41.10A': 'Promotion immobilière de logements',
  '41.20A': 'Construction maisons individuelles',
  '41.20B': 'Construction autres bâtiments résidentiels',
  '43.11Z': 'Travaux de démolition',
  '43.12A': 'Travaux de terrassement courants',
  '43.12B': 'Travaux de terrassement spécialisés',
  '43.13Z': 'Forages et sondages',
  '43.21A': 'Travaux d\'installation électrique (logements)',
  '43.21B': 'Travaux d\'installation électrique (autres)',
  '43.22A': 'Travaux d\'installation eau et gaz',
  '43.22B': 'Travaux d\'installation thermique et climatisation',
  '43.29A': 'Autres travaux d\'isolation',
  '43.29B': 'Autres travaux d\'installation n.c.a.',
  '43.31Z': 'Travaux de plâtrerie',
  '43.32A': 'Travaux de menuiserie bois et PVC',
  '43.32B': 'Travaux de menuiserie métallique et serrurerie',
  '43.32C': 'Agencement de lieux de vente',
  '43.33Z': 'Travaux de revêtement des sols et des murs',
  '43.34Z': 'Travaux de peinture et vitrerie',
  '43.39Z': 'Autres travaux de finition',
  '43.91A': 'Travaux de charpente',
  '43.91B': 'Travaux de couverture par éléments',
  '43.99A': 'Travaux d\'étanchéité',
  '43.99B': 'Travaux de montage de structures métalliques',
  '43.99C': 'Travaux de maçonnerie générale et gros œuvre',
  '43.99D': 'Autres travaux spécialisés de construction',
  '43.99E': 'Location avec opérateur de matériel de construction',
  '81.30Z': 'Services d\'aménagement paysager',
  '81.10Z': 'Services combinés de soutien aux bâtiments',
};

/** Correspondance territoire → code département INSEE */
const TERRITOIRE_DEPT: Record<string, string> = {
  GP: '971',   // Guadeloupe
  MQ: '972',   // Martinique
  GF: '973',   // Guyane
  RE: '974',   // La Réunion
  YT: '976',   // Mayotte
};

// ── CORS ──────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'content-type': 'application/json; charset=utf-8',
};

function jsonResp(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: CORS_HEADERS,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCurrentPeriode(raw: InseeRaw) {
  const periodes = raw.periodesEtablissement ?? [];
  // La première période (index 0) est la plus récente
  return periodes[0] ?? {};
}

function buildAdresse(addr: InseeRaw['adresseEtablissement']): string {
  if (!addr) return '';
  const parts = [
    addr.numeroVoieEtablissement,
    addr.typeVoieEtablissement,
    addr.libelleVoieEtablissement,
  ].filter(Boolean);
  return parts.join(' ');
}

function mapRawToEtablissement(raw: InseeRaw): InseeEtablissement {
  const ul = raw.uniteLegale ?? {};
  const addr = raw.adresseEtablissement ?? {};
  const periode = extractCurrentPeriode(raw);

  const nafCode = (periode.activitePrincipaleEtablissement ?? ul.activitePrincipaleUniteLegale ?? '').replace(/(\d{2})(\d{2})(\w)/, '$1.$2$3');
  const raisonSociale =
    periode.denominationUsuelleEtablissement ||
    periode.enseigne1Etablissement ||
    ul.denominationUniteLegale ||
    ul.nomUsuel1UniteLegale ||
    '';

  return {
    siret: raw.siret ?? '',
    siren: ul.siren ?? (raw.siret ?? '').slice(0, 9),
    raisonSociale,
    denomination: ul.denominationUniteLegale ?? null,
    nomUsuel: ul.nomUsuel1UniteLegale ?? null,
    nafCode,
    nafLibelle: NAF_LIBELLES[nafCode] ?? nafCode,
    formeJuridique: ul.categorieJuridiqueUniteLegale ?? '',
    codeFormeJuridique: ul.categorieJuridiqueUniteLegale ?? '',
    adresse: buildAdresse(addr),
    codePostal: addr.codePostalEtablissement ?? '',
    ville: addr.libelleCommuneEtablissement ?? '',
    departement: addr.codeDepartementEtablissement ?? '',
    dateCreation: raw.dateCreationEtablissement ?? '',
    etatAdministratif: (periode.etatAdministratifEtablissement as 'A' | 'F') ?? 'A',
    trancheEffectifs: raw.trancheEffectifsEtablissement ?? null,
    telephone: null,    // INSEE ne fournit pas les téléphones
    siège: raw.etablissementSiege ?? false,
  };
}

// ── Get INSEE Bearer token (cached in memory for function lifetime) ────────────

let _cachedToken: { value: string; expiresAt: number } | null = null;

async function getInseeToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 60_000) {
    return _cachedToken.value;
  }

  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  const resp = await fetch('https://api.insee.fr/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!resp.ok) {
    throw new Error(`INSEE OAuth2 error: ${resp.status}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  _cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return _cachedToken.value;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Auth check
  const consumerKey    = env.INSEE_API_TOKEN;         // format: "key:secret" or just Bearer
  const consumerSecret = (env as Record<string, string>)['INSEE_API_SECRET'] ?? '';

  if (!consumerKey) {
    return jsonResp({ error: 'INSEE_API_TOKEN non configuré. Ajoutez le secret dans Cloudflare Pages > Settings > Variables.' }, 401);
  }

  // Parse query params
  const url       = new URL(request.url);
  const territory = (url.searchParams.get('territory') ?? 'GP').toUpperCase();
  const nafFilter = url.searchParams.get('naf');                   // ex: "43.99C,43.33Z"
  const page      = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const perPage   = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') ?? '20', 10)));

  const deptCode = TERRITOIRE_DEPT[territory];
  if (!deptCode) {
    return jsonResp({ error: `Territoire inconnu: ${territory}. Valeurs valides: GP, MQ, RE, GF, YT` }, 400);
  }

  // Build NAF filter
  const nafCodes = nafFilter
    ? nafFilter.split(',').map((c) => c.trim()).filter(Boolean)
    : NAF_CODES_BATIMENT;

  // Build Sirene v3 query
  // Lucene syntax: field:value AND field2:value2
  const nafQuery = nafCodes
    .map((c) => `activitePrincipaleEtablissement:${c.replace('.', '')}`)
    .join(' OR ');

  const q = `(${nafQuery}) AND codeDepartementEtablissement:${deptCode} AND etatAdministratifEtablissement:A`;
  const debut = (page - 1) * perPage;

  const apiUrl = new URL('https://api.insee.fr/entreprises/sirene/V3/siret');
  apiUrl.searchParams.set('q', q);
  apiUrl.searchParams.set('nombre', String(perPage));
  apiUrl.searchParams.set('debut', String(debut));
  apiUrl.searchParams.set('champs', [
    'siret',
    'uniteLegale.siren',
    'uniteLegale.denominationUniteLegale',
    'uniteLegale.nomUsuel1UniteLegale',
    'uniteLegale.categorieJuridiqueUniteLegale',
    'uniteLegale.activitePrincipaleUniteLegale',
    'adresseEtablissement.numeroVoieEtablissement',
    'adresseEtablissement.typeVoieEtablissement',
    'adresseEtablissement.libelleVoieEtablissement',
    'adresseEtablissement.codePostalEtablissement',
    'adresseEtablissement.libelleCommuneEtablissement',
    'adresseEtablissement.codeDepartementEtablissement',
    'periodesEtablissement.etatAdministratifEtablissement',
    'periodesEtablissement.activitePrincipaleEtablissement',
    'periodesEtablissement.denominationUsuelleEtablissement',
    'periodesEtablissement.enseigne1Etablissement',
    'dateCreationEtablissement',
    'trancheEffectifsEtablissement',
    'etablissementSiege',
  ].join(','));

  try {
    // Get token (consumer key may be stored as "key:secret" or just a Bearer token)
    let bearer: string;
    if (consumerKey.includes(':') || consumerSecret) {
      const [key, secret] = consumerKey.includes(':')
        ? consumerKey.split(':', 2)
        : [consumerKey, consumerSecret];
      bearer = await getInseeToken(key, secret);
    } else {
      // Direct Bearer token
      bearer = consumerKey;
    }

    const inseeResp = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (inseeResp.status === 401) {
      return jsonResp({ error: 'Token INSEE invalide ou expiré. Vérifiez INSEE_API_TOKEN.' }, 401);
    }
    if (inseeResp.status === 404) {
      // 404 = aucun résultat dans Sirene
      return jsonResp({ total: 0, page, perPage, results: [], source: 'insee_sirene_v3', territory, deptCode, nafCodes });
    }
    if (!inseeResp.ok) {
      const errText = await inseeResp.text().catch(() => '');
      return jsonResp({ error: `INSEE API error ${inseeResp.status}: ${errText}` }, 502);
    }

    const data = await inseeResp.json() as InseeApiResponse;
    const results: InseeEtablissement[] = (data.etablissements ?? []).map(mapRawToEtablissement);

    return jsonResp({
      total:    data.header?.total    ?? results.length,
      page,
      perPage,
      results,
      source:   'insee_sirene_v3',
      territory,
      deptCode,
      nafCodes,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeout') || msg.includes('abort')) {
      return jsonResp({ error: 'INSEE API timeout (>15s). Réessayez dans quelques instants.' }, 503);
    }
    return jsonResp({ error: `Erreur interne: ${msg}` }, 500);
  }
};
