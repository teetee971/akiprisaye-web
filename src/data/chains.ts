/**
 * Référentiel des enseignes de distribution dans les DOM-TOM
 * 
 * Ce fichier centralise les informations sur toutes les chaînes de magasins
 * présentes dans les territoires d'Outre-Mer français.
 */

export interface ChainInfo {
  name: string;
  group: string;
  type: 'hypermarket' | 'supermarket' | 'proximity' | 'drive' | 'frozen' | 'discount';
}

export const CHAINS: Record<string, ChainInfo> = {
  // Groupe Casino
  GEANT_CASINO: { name: 'Géant Casino', group: 'Casino', type: 'hypermarket' },
  CASINO_SUPERMARCHE: { name: 'Casino Supermarché', group: 'Casino', type: 'supermarket' },
  PETIT_CASINO: { name: 'Petit Casino', group: 'Casino', type: 'proximity' },
  CASINO_SHOP: { name: 'Casino Shop', group: 'Casino', type: 'proximity' },
  SPAR: { name: 'Spar', group: 'Casino', type: 'proximity' },
  VIVAL: { name: 'Vival', group: 'Casino', type: 'proximity' },
  FRANPRIX: { name: 'Franprix', group: 'Casino', type: 'proximity' },
  MONOPRIX: { name: 'Monoprix', group: 'Casino', type: 'supermarket' },
  LEADER_PRICE: { name: 'Leader Price', group: 'Casino', type: 'discount' },
  SCORE: { name: 'Score', group: 'Casino', type: 'supermarket' },
  JUMBO_SCORE: { name: 'Jumbo Score', group: 'Casino', type: 'hypermarket' },
  
  // Groupe Carrefour
  CARREFOUR: { name: 'Carrefour', group: 'Carrefour', type: 'hypermarket' },
  CARREFOUR_MARKET: { name: 'Carrefour Market', group: 'Carrefour', type: 'supermarket' },
  CARREFOUR_EXPRESS: { name: 'Carrefour Express', group: 'Carrefour', type: 'proximity' },
  CARREFOUR_CITY: { name: 'Carrefour City', group: 'Carrefour', type: 'proximity' },
  
  // Groupe Système U
  HYPER_U: { name: 'Hyper U', group: 'Système U', type: 'hypermarket' },
  SUPER_U: { name: 'Super U', group: 'Système U', type: 'supermarket' },
  U_EXPRESS: { name: 'U Express', group: 'Système U', type: 'proximity' },
  
  // Groupe E.Leclerc
  LECLERC: { name: 'E.Leclerc', group: 'E.Leclerc', type: 'hypermarket' },
  LECLERC_EXPRESS: { name: 'Leclerc Express', group: 'E.Leclerc', type: 'proximity' },
  LECLERC_DRIVE: { name: 'Leclerc Drive', group: 'E.Leclerc', type: 'drive' },
  
  // Groupe Intermarché
  INTERMARCHE: { name: 'Intermarché', group: 'Intermarché', type: 'supermarket' },
  INTERMARCHE_CONTACT: { name: 'Intermarché Contact', group: 'Intermarché', type: 'proximity' },
  NETTO: { name: 'Netto', group: 'Intermarché', type: 'discount' },
  
  // Autres grandes enseignes
  LIDL: { name: 'Lidl', group: 'Lidl', type: 'discount' },
  AUCHAN: { name: 'Auchan', group: 'Auchan', type: 'hypermarket' },
  
  // Surgelés
  PICARD: { name: 'Picard', group: 'Picard', type: 'frozen' },
  THIRIET: { name: 'Thiriet', group: 'Thiriet', type: 'frozen' },
  
  // Enseignes locales DOM-TOM
  ECOMAX: { name: 'Ecomax', group: 'Local', type: 'discount' },
  MATCH: { name: 'Match', group: 'Local', type: 'supermarket' },
  PRIMANTILLES: { name: 'Primantilles', group: 'Local', type: 'supermarket' },
  BERACA: { name: 'Beraca', group: 'Local', type: 'supermarket' },
};

/**
 * Obtenir les informations d'une enseigne par son nom
 * @param chainName - Nom de l'enseigne
 * @returns Informations de l'enseigne ou undefined
 */
export function getChainInfo(chainName: string): ChainInfo | undefined {
  const chainKey = Object.keys(CHAINS).find(
    key => CHAINS[key].name.toLowerCase() === chainName.toLowerCase()
  );
  return chainKey ? CHAINS[chainKey] : undefined;
}

/**
 * Obtenir toutes les enseignes d'un groupe
 * @param groupName - Nom du groupe
 * @returns Liste des enseignes du groupe
 */
export function getChainsByGroup(groupName: string): ChainInfo[] {
  return Object.values(CHAINS).filter(
    chain => chain.group.toLowerCase() === groupName.toLowerCase()
  );
}

/**
 * Obtenir toutes les enseignes par type
 * @param type - Type d'enseigne
 * @returns Liste des enseignes du type spécifié
 */
export function getChainsByType(type: ChainInfo['type']): ChainInfo[] {
  return Object.values(CHAINS).filter(chain => chain.type === type);
}

/**
 * Obtenir tous les groupes uniques
 * @returns Liste des groupes
 */
export function getAllGroups(): string[] {
  const groups = new Set(Object.values(CHAINS).map(chain => chain.group));
  return Array.from(groups).sort();
}

/**
 * Obtenir toutes les enseignes
 * @returns Liste de toutes les enseignes
 */
export function getAllChains(): ChainInfo[] {
  return Object.values(CHAINS);
}
