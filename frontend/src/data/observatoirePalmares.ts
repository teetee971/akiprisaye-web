import type { TerritoryCode } from '../constants/territories';

export type EnseigneRankingEntry = {
  name: string;
  score: number;
  change: 'up' | 'down' | 'stable';
  note: string;
};

export type ObservatoirePalmares = {
  territory: TerritoryCode;
  updatedAt: string;
  lowestPrices: EnseigneRankingEntry[];
  bestValue: EnseigneRankingEntry[];
  widestSelection: EnseigneRankingEntry[];
};

export const OBSERVATOIRE_PALMARES: ObservatoirePalmares[] = [
  {
    territory: 'gp',
    updatedAt: '2026-04-15',
    lowestPrices: [
      { name: 'Ecomax Capesterre', score: 93, change: 'up', note: '+1.8 pts vs trim.' },
      { name: 'Super U Baie-Mahault', score: 90, change: 'stable', note: 'Panier bas stable' },
      { name: 'Carrefour Destreland', score: 88, change: 'up', note: '+0.9 pt' },
    ],
    bestValue: [
      { name: 'Leader Price Jarry', score: 92, change: 'up', note: 'Qualité locale +++' },
      { name: 'Marché de Bergevin', score: 89, change: 'stable', note: 'Produits frais' },
      { name: 'Ecomax Gosier', score: 87, change: 'up', note: '+0.5 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Destreland', score: 95, change: 'stable', note: '4 950 refs' },
      { name: 'Super U Baie-Mahault', score: 93, change: 'up', note: '+200 refs' },
      { name: 'Hyper Casino Bas-du-Fort', score: 89, change: 'down', note: '-0.8 pt' },
    ],
  },
  {
    territory: 'mq',
    updatedAt: '2026-04-15',
    lowestPrices: [
      { name: 'Ecomax Lamentin', score: 92, change: 'up', note: '+2.1 pts' },
      { name: 'Super U Ducos', score: 89, change: 'stable', note: 'Panier bas' },
      { name: 'Carrefour Génipa', score: 87, change: 'up', note: '+0.7 pt' },
    ],
    bestValue: [
      { name: 'Marché de Fort-de-France', score: 93, change: 'up', note: 'Frais & locaux' },
      { name: 'Ecomax Trinité', score: 90, change: 'stable', note: 'Qualité régulière' },
      { name: 'Super U Ducos', score: 88, change: 'up', note: '+0.4 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Génipa', score: 94, change: 'stable', note: '5 250 refs' },
      { name: 'Super U Rivière-Salée', score: 92, change: 'up', note: '+150 refs' },
      { name: 'Ecomax Lamentin', score: 90, change: 'up', note: '+80 refs' },
    ],
  },
  {
    territory: 'gf',
    updatedAt: '2026-04-15',
    lowestPrices: [
      { name: 'Leader Price Cayenne', score: 90, change: 'up', note: '+1.2 pts' },
      { name: 'Super U Matoury', score: 87, change: 'stable', note: 'Panier bas stable' },
      { name: 'Carrefour Rémire', score: 86, change: 'up', note: '+0.6 pt' },
    ],
    bestValue: [
      { name: 'Marché de Cayenne', score: 91, change: 'up', note: 'Filières locales' },
      { name: 'Super U Matoury', score: 88, change: 'stable', note: 'Qualité régulière' },
      { name: 'Leader Price Cayenne', score: 86, change: 'up', note: '+0.3 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Rémire', score: 93, change: 'stable', note: '4 300 refs' },
      { name: 'Super U Matoury', score: 91, change: 'up', note: '+110 refs' },
      { name: 'Leader Price Cayenne', score: 88, change: 'stable', note: '3 900 refs' },
    ],
  },
  {
    territory: 're',
    updatedAt: '2026-04-15',
    lowestPrices: [
      { name: 'Leader Price Saint-Pierre', score: 93, change: 'up', note: '+1.5 pts' },
      { name: 'Super U Saint-Paul', score: 90, change: 'stable', note: 'Panier bas' },
      { name: 'Carrefour Sainte-Clotilde', score: 88, change: 'up', note: '+0.5 pt' },
    ],
    bestValue: [
      { name: 'Marché de Saint-Paul', score: 94, change: 'up', note: 'Frais locaux' },
      { name: 'Super U Saint-Joseph', score: 89, change: 'stable', note: 'Qualité +++' },
      { name: 'Leader Price Saint-Pierre', score: 87, change: 'up', note: '+0.8 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Sainte-Clotilde', score: 96, change: 'stable', note: '5 550 refs' },
      { name: 'Leclerc Portail', score: 93, change: 'up', note: '+200 refs' },
      { name: 'Super U Saint-Paul', score: 91, change: 'up', note: '+80 refs' },
    ],
  },
  {
    territory: 'yt',
    updatedAt: '2026-04-15',
    lowestPrices: [
      { name: 'Jumbo Score Kawéni', score: 88, change: 'up', note: '+1.0 pt' },
      { name: 'Super U Mamoudzou', score: 87, change: 'stable', note: 'Panier bas' },
      { name: 'Carrefour Mamoudzou', score: 85, change: 'up', note: '+0.8 pt' },
    ],
    bestValue: [
      { name: 'Marché de Mamoudzou', score: 90, change: 'up', note: 'Frais & locaux' },
      { name: 'Super U Mamoudzou', score: 87, change: 'stable', note: 'Qualité régulière' },
      { name: 'Jumbo Score Kawéni', score: 86, change: 'up', note: '+0.5 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Mamoudzou', score: 92, change: 'stable', note: '3 850 refs' },
      { name: 'Super U Mamoudzou', score: 90, change: 'up', note: '+100 refs' },
      { name: 'Jumbo Score Kawéni', score: 88, change: 'stable', note: '3 400 refs' },
    ],
  },
  {
    territory: 'fr',
    updatedAt: '2026-04-15',
    lowestPrices: [
      { name: 'E.Leclerc', score: 95, change: 'up', note: '+0.6 pt' },
      { name: 'Lidl', score: 93, change: 'stable', note: 'Panier bas' },
      { name: 'Intermarché', score: 91, change: 'up', note: '+0.4 pt' },
    ],
    bestValue: [
      { name: 'E.Leclerc', score: 92, change: 'up', note: '+0.7 pt' },
      { name: 'U Express', score: 91, change: 'stable', note: 'Qualité régulière' },
      { name: 'Carrefour Market', score: 89, change: 'stable', note: 'Stable' },
    ],
    widestSelection: [
      { name: 'Carrefour', score: 97, change: 'stable', note: '9 400 refs' },
      { name: 'Auchan', score: 95, change: 'up', note: '+250 refs' },
      { name: 'E.Leclerc', score: 94, change: 'up', note: '+180 refs' },
    ],
  },
];

export const getPalmaresForTerritory = (territory: TerritoryCode) =>
  OBSERVATOIRE_PALMARES.find((entry) => entry.territory === territory) ??
  OBSERVATOIRE_PALMARES.find((entry) => entry.territory === 'fr') ??
  null;
