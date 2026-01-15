#!/usr/bin/env node

/**
 * Script d'extraction automatique des établissements commerciaux DROM-COM
 * depuis la base SIRENE de l'INSEE
 * 
 * Sources autorisées:
 * - API Sirene (https://api.insee.fr/entreprises/sirene/V3)
 * - Data.gouv.fr (https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/)
 * 
 * RÈGLE ABSOLUE: Aucune confirmation automatique
 * Tous les résultats sont marqués "a_confirmer"
 */

// const fs = require('fs'); // Unused for now
const path = require('path');

// Codes APE/NAF commerce de détail
const CODES_NAF_COMMERCE = [
  '4711A', '4711B', '4711C', '4711D', '4711E', '4711F', // Supermarchés et hypermarchés
  '4719A', '4719B', // Autres commerces de détail en magasin non spécialisé
  '4721Z', '4722Z', '4723Z', '4724Z', '4725Z', '4726Z', '4729Z', // Alimentaire spécialisé
  '4752A', '4752B', '4753Z', '4754Z', // Bricolage, quincaillerie
  '4741Z', '4742Z', '4743Z', '4751Z', // Électroménager, multimédia
  '4773Z', // Pharmacies
  '4730Z', // Commerce de détail de carburants
];

// Territoires DROM-COM
const TERRITOIRES = {
  '971': { nom: 'Guadeloupe', statut: 'DROM', sirene: true },
  '972': { nom: 'Martinique', statut: 'DROM', sirene: true },
  '973': { nom: 'Guyane', statut: 'DROM', sirene: true },
  '974': { nom: 'La Réunion', statut: 'DROM', sirene: true },
  '976': { nom: 'Mayotte', statut: 'DROM', sirene: true },
  '975': { nom: 'Saint-Pierre-et-Miquelon', statut: 'COM', sirene: false },
  '977': { nom: 'Saint-Barthélemy', statut: 'COM', sirene: true },
  '978': { nom: 'Saint-Martin', statut: 'COM', sirene: true },
  '986': { nom: 'Wallis-et-Futuna', statut: 'COM', sirene: false },
  '987': { nom: 'Polynésie française', statut: 'COM', sirene: false },
  '988': { nom: 'Nouvelle-Calédonie', statut: 'COM', sirene: false },
};

/**
 * Catégorise un établissement selon son code NAF
 */
function _categoriserEtablissement(codeNaf) {
  if (codeNaf.startsWith('4711')) return 'Grande distribution';
  if (codeNaf.startsWith('4719')) return 'Commerce de proximité';
  if (codeNaf.startsWith('472')) return 'Alimentation spécialisée';
  if (codeNaf.startsWith('475')) return 'Bricolage / Matériaux';
  if (codeNaf.startsWith('474')) return 'Électroménager / Multimédia';
  if (codeNaf === '4773Z') return 'Pharmacie / Parapharmacie';
  if (codeNaf === '4730Z') return 'Carburant / Énergie';
  return 'Commerce de proximité';
}

/**
 * Détermine le type de magasin selon le code NAF
 */
function _determinerTypeMagasin(codeNaf, denomination) {
  const denom = denomination.toLowerCase();
  
  if (codeNaf === '4711A' || codeNaf === '4711B') return 'Hypermarché';
  if (codeNaf === '4711C' || codeNaf === '4711D') return 'Supermarché';
  if (codeNaf === '4711E') return 'Hard discount';
  if (denom.includes('marché')) return 'Supermarché';
  if (denom.includes('hyper')) return 'Hypermarché';
  
  return 'Commerce de détail';
}

/**
 * FONCTION PRINCIPALE - À IMPLÉMENTER
 * 
 * Cette fonction devrait:
 * 1. Se connecter à l'API Sirene ou charger les données depuis data.gouv.fr
 * 2. Filtrer par code postal DROM-COM
 * 3. Filtrer par codes NAF commerce
 * 4. Générer des entrées magasins avec statut "a_confirmer"
 * 
 * IMPORTANT: Cette fonction nécessite:
 * - Clé API INSEE (à obtenir sur https://api.insee.fr)
 * - OU téléchargement manuel du fichier SIRENE complet
 */
async function extraireSirene(codeTerritoire) {
  console.log(`⚠️  EXTRACTION SIRENE POUR ${codeTerritoire} - NON IMPLÉMENTÉE`);
  console.log(`
📋 ÉTAPES MANUELLES REQUISES:

1. Obtenir une clé API INSEE:
   https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee

2. OU télécharger le fichier SIRENE complet:
   https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/

3. Filtrer les établissements par:
   - Code postal commençant par ${codeTerritoire}
   - Codes NAF: ${CODES_NAF_COMMERCE.join(', ')}
   - État: Actif

4. Pour chaque établissement, créer une entrée JSON avec:
   - enseigne (denominationUsuelleEtablissement)
   - categorie (selon NAF)
   - type_magasin (selon NAF et dénomination)
   - presence: "a_confirmer"
   - source: INSEE SIRENE + date

⚠️  RÈGLE ABSOLUE: Aucune confirmation automatique
   Tout reste "a_confirmer" jusqu'à vérification manuelle
  `);
  
  return [];
}

/**
 * Génère un fichier JSON territoire avec les établissements extraits
 */
async function genererFichierTerritoire(codeTerritoire) {
  const territoire = TERRITOIRES[codeTerritoire];
  
  if (!territoire) {
    console.error(`❌ Code territoire invalide: ${codeTerritoire}`);
    return;
  }
  
  if (!territoire.sirene) {
    console.log(`⚠️  ${territoire.nom} - Pas de couverture SIRENE`);
    console.log('   Utiliser sources locales: ISEE, ISPF, STSEE');
    return;
  }
  
  console.log(`🔍 Extraction pour ${territoire.nom} (${codeTerritoire})...`);
  
  const etablissements = await extraireSirene(codeTerritoire);
  
  const fichier = {
    territoire: territoire.nom,
    code_territoire: codeTerritoire,
    statut_territorial: territoire.statut,
    magasins: etablissements,
    metadata: {
      derniere_maj: new Date().toISOString().split('T')[0],
      statut_fichier: etablissements.length > 0 ? 'extraction_sirene' : 'template_vide',
      avertissement: 'ATTENTION: Toutes les données sont à statut "a_confirmer". Vérification manuelle requise.',
      source: 'INSEE SIRENE via extraction automatique',
    },
  };
  
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'magasins', `${codeTerritoire}_${territoire.nom.toLowerCase().replace(/[- ]/g, '_')}.json`);
  
  console.log(`📝 Génération: ${outputPath}`);
  console.log(`   Établissements trouvés: ${etablissements.length}`);
  
  // Décommenter pour sauvegarder:
  // fs.writeFileSync(outputPath, JSON.stringify(fichier, null, 2));
  
  return fichier;
}

/**
 * Point d'entrée du script
 */
async function main() {
  console.log('🏪 EXTRACTION SIRENE - MAGASINS DROM-COM\n');
  console.log('📋 RÈGLES ABSOLUES:');
  console.log('   ❌ Aucune donnée inventée');
  console.log('   ❌ Aucune confirmation automatique');
  console.log('   ✅ Source INSEE SIRENE uniquement');
  console.log('   ✅ Statut "a_confirmer" obligatoire\n');
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/extract-sirene.js [code_territoire]');
    console.log('\nExemples:');
    console.log('  node scripts/extract-sirene.js 971  # Guadeloupe');
    console.log('  node scripts/extract-sirene.js all  # Tous les territoires SIRENE');
    console.log('\nTerritoires disponibles:');
    Object.entries(TERRITOIRES).forEach(([code, info]) => {
      const sirene = info.sirene ? '✅' : '❌';
      console.log(`  ${code} - ${info.nom.padEnd(25)} (${info.statut}) ${sirene} SIRENE`);
    });
    return;
  }
  
  const codeTerritoire = args[0];
  
  if (codeTerritoire === 'all') {
    console.log('🌍 Extraction pour tous les territoires SIRENE...\n');
    for (const [code, info] of Object.entries(TERRITOIRES)) {
      if (info.sirene) {
        await genererFichierTerritoire(code);
        console.log('');
      }
    }
  } else {
    await genererFichierTerritoire(codeTerritoire);
  }
  
  console.log('\n✅ Script terminé');
  console.log('\n⚠️  PROCHAINES ÉTAPES:');
  console.log('1. Implémenter la connexion API SIRENE');
  console.log('2. Vérifier manuellement chaque établissement extrait');
  console.log('3. Confirmer les présences avec sources complémentaires');
  console.log('4. Mettre à jour les statuts de "a_confirmer" à "confirmee"');
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extraireSirene, genererFichierTerritoire, CODES_NAF_COMMERCE, TERRITOIRES };
