/**
 * Index central des données officielles
 * 
 * Ce fichier exporte toutes les sources de données utilisées par A KI PRI SA YÉ.
 * Toutes les données DOIVENT provenir de sources officielles.
 */

// Métadonnées des sources
export { default as sourcesMetadata } from './metadata/sources.json';

// Données INSEE
export { default as inseeIPC } from './insee/ipc_dom.json';
export { default as revenusReference } from './insee/revenus_reference.json';

// Données OPMR par territoire
export { default as opmrGuadeloupe } from './opmr/guadeloupe.json';
// Note: Autres territoires à ajouter lors de l'intégration des données officielles
// export { default as opmrMartinique } from './opmr/martinique.json';
// export { default as opmrGuyane } from './opmr/guyane.json';
// export { default as opmrReunion } from './opmr/reunion.json';
// export { default as opmrMayotte } from './opmr/mayotte.json';

// Données DGCCRF
// export { default as dgccrfRapports } from './dgccrf/rapports.json';

// Import for internal use
import sourcesMetadataImport from './metadata/sources.json';
import inseeIPCImport from './insee/ipc_dom.json';
import revenusReferenceImport from './insee/revenus_reference.json';
import opmrGuadeloupeImport from './opmr/guadeloupe.json';

/**
 * Fonction utilitaire pour vérifier le statut des données
 */
export function verifierStatutDonnees(source) {
  if (!source || !source.statut) {
    return {
      valide: false,
      message: 'Source invalide ou statut manquant',
    };
  }

  if (source.statut === 'DONNEES_NON_DISPONIBLES') {
    return {
      valide: false,
      message: source.message || 'Données non disponibles',
      actionRequise: source.action_requise,
    };
  }

  if (source.statut === 'OFFICIEL') {
    return {
      valide: true,
      message: 'Données officielles validées',
    };
  }

  return {
    valide: false,
    message: 'Statut inconnu',
  };
}

/**
 * Fonction pour obtenir les métadonnées complètes d'une source
 */
export function obtenirMetadonneesSource(nomSource) {
  if (!sourcesMetadataImport || !sourcesMetadataImport.sources) {
    return null;
  }

  return sourcesMetadataImport.sources[nomSource] || null;
}

export default {
  sourcesMetadata: sourcesMetadataImport,
  inseeIPC: inseeIPCImport,
  revenusReference: revenusReferenceImport,
  opmrGuadeloupe: opmrGuadeloupeImport,
  verifierStatutDonnees,
  obtenirMetadonneesSource,
};
