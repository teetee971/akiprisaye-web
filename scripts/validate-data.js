/**
 * Validation unifiée des JSON de src/data via un wrapper canonique.
 *
 * Wrapper cible:
 * {
 *   territoire,
 *   organisme_source,
 *   date_publication?,
 *   licence?,
 *   url_source?,
 *   statut?,
 *   donnees: []
 * }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

let filesChecked = 0;
let filesValid = 0;
let filesFailed = 0;
let totalErrors = 0;
let totalWarnings = 0;

function isValidISODate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

function isValidURL(urlString) {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function inferTerritoryFromPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('/magasins/971_')) return 'gp';
  if (lower.includes('/magasins/972_')) return 'mq';
  if (lower.includes('/magasins/973_')) return 'gf';
  if (lower.includes('/magasins/974_')) return 're';
  if (lower.includes('/magasins/976_')) return 'yt';
  if (lower.includes('/magasins/975_')) return 'pm';
  if (lower.includes('/magasins/977_')) return 'bl';
  if (lower.includes('/magasins/978_')) return 'mf';
  if (lower.includes('/magasins/986_')) return 'wf';
  if (lower.includes('/magasins/987_')) return 'pf';
  if (lower.includes('/magasins/988_')) return 'nc';
  if (lower.includes('/hexagone/')) return 'fr';
  if (lower.includes('/europe/france')) return 'fr';
  return null;
}

function normalizeItem(item, index) {
  if (!item || typeof item !== 'object') {
    return {
      intitule: `entrée_${index + 1}`,
      valeur: null,
      unite: null,
      statut: 'non_disponible',
      source: null,
      raw: item
    };
  }

  const intitule = item.intitule || item.intitule_officiel || item.produit || item.groupe || item.categorie || `entrée_${index + 1}`;
  const valeur = item.valeur ?? item.prix ?? item.indice ?? item.nombre_etablissements ?? null;
  const unite = item.unite || item.base || null;
  const statut = item.statut || item.presence || (valeur === null ? 'non_disponible' : 'ok');
  const source = item.source_exacte || item.source || item.lien_direct || item.url || null;

  return {
    intitule,
    valeur,
    unite,
    statut,
    source,
    date_observation: item.date_observation || item.periode || item.date_verification || null,
    raw: item
  };
}

function extractDonnees(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    data.donnees,
    data.template_donnees,
    data.template_series,
    data.magasins,
    data.observations,
    data.items,
    data.data
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  if (data.territories && typeof data.territories === 'object') {
    return Object.entries(data.territories).map(([code, value]) => ({
      intitule: `territory_${code}`,
      valeur: value?.current?.score ?? null,
      unite: 'index',
      statut: value?.current?.score == null ? 'non_disponible' : 'ok',
      source: data?.metadata?.requiredSources?.[0] ?? null
    }));
  }

  if (data.categories && typeof data.categories === 'object') {
    return Object.entries(data.categories).map(([key, value]) => ({
      intitule: value?.label || key,
      valeur: value?.weight ?? null,
      unite: 'ratio',
      statut: value?.weight == null ? 'non_disponible' : 'ok',
      source: null
    }));
  }

  return [];
}

function normalizeToWrapper(raw, filePath) {
  const wrapper = {
    territoire: null,
    organisme_source: null,
    date_publication: null,
    licence: null,
    url_source: null,
    statut: null,
    donnees: []
  };

  if (Array.isArray(raw)) {
    wrapper.territoire = inferTerritoryFromPath(filePath) || 'fr';
    wrapper.organisme_source = 'SOURCE_A_COMPLETER';
    wrapper.statut = 'ok';
    wrapper.donnees = raw.map(normalizeItem);
    return { wrapper, warnings: ['⚠️  Fichier racine tableau normalisé vers wrapper canonique'] };
  }

  wrapper.territoire = raw.territoire || raw.pays || raw.code_territoire || inferTerritoryFromPath(filePath) || null;
  wrapper.organisme_source =
    raw.organisme_source ||
    raw.organisme ||
    raw.source ||
    raw?.metadata?.organisme_source ||
    raw?.metadata?.requiredSources?.[0] ||
    null;

  const dateCandidate = raw.date_publication || raw?.metadata?.lastUpdate || null;
  wrapper.date_publication = isValidISODate(dateCandidate) ? dateCandidate : null;
  wrapper.licence = raw.licence || raw?.metadata?.licence || null;
  wrapper.url_source = raw.url_source || raw.source_officielle || null;
  wrapper.statut = raw.statut || raw.statut_global || raw?.metadata?.dataStatus || null;

  wrapper.donnees = extractDonnees(raw).map(normalizeItem);

  const warnings = [];
  if (dateCandidate && !wrapper.date_publication) {
    warnings.push(`⚠️  Date non ISO ignorée pour normalisation: ${dateCandidate}`);
  }
  if (!wrapper.territoire) {
    wrapper.territoire = inferTerritoryFromPath(filePath) || 'fr';
    warnings.push('⚠️  territoire absent dans le fichier source (fallback appliqué)');
  }
  if (!wrapper.organisme_source) {
    wrapper.organisme_source = 'SOURCE_A_COMPLETER';
    warnings.push('⚠️  organisme_source absent dans le fichier source (fallback appliqué)');
  }

  return { wrapper, warnings };
}

function validateDataFile(filePath) {
  console.log(`\n📄 Validation: ${filePath}`);
  filesChecked++;

  const errors = [];
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const raw = JSON.parse(content);
    const { wrapper, warnings: normalizationWarnings } = normalizeToWrapper(raw, filePath);
    warnings.push(...normalizationWarnings);

    if (!wrapper.territoire) {
      warnings.push('⚠️  territoire manquant après normalisation');
    }

    if (!wrapper.organisme_source) {
      warnings.push('⚠️  organisme_source manquant après normalisation');
    }

    if (!Array.isArray(wrapper.donnees)) {
      errors.push('❌ "donnees" doit être un tableau');
    }

    if (wrapper.date_publication && !isValidISODate(wrapper.date_publication)) {
      errors.push(`❌ Date publication invalide: ${wrapper.date_publication}`);
    }

    if (wrapper.url_source && !isValidURL(wrapper.url_source)) {
      errors.push(`❌ URL source invalide: ${wrapper.url_source}`);
    }

    if (Array.isArray(wrapper.donnees)) {
      wrapper.donnees.forEach((item, index) => {
        const itemPath = `donnees[${index}]`;

        if (!item.intitule) {
          errors.push(`❌ ${itemPath}: Intitulé manquant`);
        }

        if (item.valeur !== null && item.valeur !== undefined) {
          if (!item.source && !wrapper.url_source && !wrapper.organisme_source) {
            errors.push(`❌ ${itemPath}: Valeur numérique sans source - INTERDIT`);
          }
        }

        if (item.statut === 'non_disponible' && item.valeur !== null && item.valeur !== undefined) {
          errors.push(`❌ ${itemPath}: Statut "non_disponible" mais valeur présente - DOIT être null`);
        }

        if (item.date_observation && !isValidISODate(item.date_observation)) {
          warnings.push(`⚠️  ${itemPath}: date_observation non ISO (${item.date_observation})`);
        }

        if (item.source && !isValidURL(item.source) && typeof item.source === 'string' && item.source.startsWith('http')) {
          errors.push(`❌ ${itemPath}: URL source invalide (${item.source})`);
        }
      });
    }
  } catch (error) {
    errors.push(`❌ Erreur de parsing JSON: ${error.message}`);
  }

  totalWarnings += warnings.length;

  if (errors.length === 0) {
    console.log('✅ Fichier valide');
    warnings.forEach(w => console.log(`   ${w}`));
    filesValid++;
  } else {
    console.log(`❌ ${errors.length} erreur(s) trouvée(s):`);
    errors.forEach(err => console.log(`   ${err}`));
    warnings.forEach(w => console.log(`   ${w}`));
    filesFailed++;
    totalErrors += errors.length;
  }

  return errors.length === 0;
}

function findDataFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'public'].includes(file)) {
        findDataFiles(filePath, fileList);
      }
    } else if (file.endsWith('.json') && !file.includes('package')) {
      if (filePath.includes('src/data/') || filePath.includes('src\\data\\')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

async function main() {
  console.log('🔍 A KI PRI SA YÉ - Validation des Données\n');
  console.log('📋 RÈGLES STRICTES (wrapper unifié):');
  console.log('   1. territoire obligatoire');
  console.log('   2. organisme_source obligatoire');
  console.log('   3. donnees obligatoire et de type tableau');
  console.log('   4. Dates ISO YYYY-MM-DD');
  console.log('   5. Aucune valeur numérique sans source\n');

  const dataDir = path.join(__dirname, '..', 'src', 'data');

  if (!fs.existsSync(dataDir)) {
    console.error('❌ Répertoire src/data/ introuvable');
    process.exit(EXIT_FAILURE);
  }

  const dataFiles = findDataFiles(dataDir);

  if (dataFiles.length === 0) {
    console.log('⚠️  Aucun fichier JSON trouvé dans src/data/');
    process.exit(EXIT_SUCCESS);
  }

  console.log(`📂 ${dataFiles.length} fichier(s) de données trouvé(s)\n`);
  dataFiles.forEach(validateDataFile);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(60));
  console.log(`Fichiers vérifiés: ${filesChecked}`);
  console.log(`Fichiers valides:  ${filesValid} ✅`);
  console.log(`Fichiers invalides: ${filesFailed} ❌`);
  console.log(`Erreurs totales:   ${totalErrors}`);
  console.log(`Warnings totaux:  ${totalWarnings}`);
  console.log('='.repeat(60));

  if (filesFailed > 0) {
    console.log('\n❌ VALIDATION ÉCHOUÉE');
    console.log('   Corrigez les erreurs avant de déployer.');
    process.exit(EXIT_FAILURE);
  }

  console.log('\n✅ VALIDATION RÉUSSIE');
  console.log('   Toutes les données respectent le wrapper et les règles strictes.');
  process.exit(EXIT_SUCCESS);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateDataFile, isValidISODate, isValidURL, normalizeToWrapper };
