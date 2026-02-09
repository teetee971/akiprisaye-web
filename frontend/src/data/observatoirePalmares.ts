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
    updatedAt: '2025-02-03',
    lowestPrices: [
      { name: 'Super U Baie-Mahault', score: 92, change: 'down', note: '-2.1% vs trim.' },
      { name: 'Ecomax Capesterre', score: 89, change: 'stable', note: 'Panier bas stable' },
      { name: 'Carrefour Destreland', score: 87, change: 'up', note: '+1.3 pts' },
    ],
    bestValue: [
      { name: 'Leader Price Jarry', score: 91, change: 'up', note: 'Qualité locale +++' },
      { name: 'Marché de Bergevin', score: 88, change: 'stable', note: 'Produits frais' },
      { name: 'Ecomax Gosier', score: 86, change: 'down', note: '-0.8 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Destreland', score: 95, change: 'stable', note: '4 800 refs' },
      { name: 'Super U Baie-Mahault', score: 93, change: 'up', note: '+120 refs' },
      { name: 'Hyper Casino Bas-du-Fort', score: 90, change: 'down', note: '-1.2 pt' },
    ],
  },
  {
    territory: 'mq',
    updatedAt: '2025-02-03',
    lowestPrices: [
      { name: 'Ecomax Lamentin', score: 90, change: 'up', note: '+1.7 pts' },
      { name: 'Super U Ducos', score: 88, change: 'stable', note: 'Panier bas' },
      { name: 'Carrefour Génipa', score: 86, change: 'down', note: '-1.0 pt' },
    ],
    bestValue: [
      { name: 'Marché de Fort-de-France', score: 92, change: 'up', note: 'Frais & locaux' },
      { name: 'Ecomax Trinité', score: 89, change: 'stable', note: 'Qualité régulière' },
      { name: 'Super U Ducos', score: 87, change: 'down', note: '-0.6 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Génipa', score: 94, change: 'stable', note: '5 100 refs' },
      { name: 'Super U Rivière-Salée', score: 91, change: 'up', note: '+90 refs' },
      { name: 'Ecomax Lamentin', score: 89, change: 'stable', note: '4 300 refs' },
    ],
  },
  {
    territory: 'gf',
    updatedAt: '2025-02-03',
    lowestPrices: [
      { name: 'Leader Price Cayenne', score: 88, change: 'stable', note: 'Panier bas stable' },
      { name: 'Super U Matoury', score: 86, change: 'down', note: '-1.4 pt' },
      { name: 'Carrefour Rémire', score: 85, change: 'up', note: '+0.9 pt' },
    ],
    bestValue: [
      { name: 'Marché de Cayenne', score: 90, change: 'up', note: 'Filières locales' },
      { name: 'Super U Matoury', score: 87, change: 'stable', note: 'Qualité régulière' },
      { name: 'Leader Price Cayenne', score: 86, change: 'down', note: '-0.4 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Rémire', score: 93, change: 'stable', note: '4 100 refs' },
      { name: 'Super U Matoury', score: 90, change: 'up', note: '+75 refs' },
      { name: 'Leader Price Cayenne', score: 88, change: 'down', note: '-0.5 pt' },
    ],
  },
  {
    territory: 're',
    updatedAt: '2025-02-03',
    lowestPrices: [
      { name: 'Leader Price Saint-Pierre', score: 91, change: 'up', note: '+2.0 pts' },
      { name: 'Super U Saint-Paul', score: 89, change: 'stable', note: 'Panier bas' },
      { name: 'Carrefour Sainte-Clotilde', score: 87, change: 'down', note: '-0.7 pt' },
    ],
    bestValue: [
      { name: 'Marché de Saint-Paul', score: 93, change: 'up', note: 'Frais locaux' },
      { name: 'Super U Saint-Joseph', score: 88, change: 'stable', note: 'Qualité +++' },
      { name: 'Leader Price Saint-Pierre', score: 86, change: 'down', note: '-0.5 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Sainte-Clotilde', score: 96, change: 'stable', note: '5 400 refs' },
      { name: 'Leclerc Portail', score: 92, change: 'up', note: '+140 refs' },
      { name: 'Super U Saint-Paul', score: 90, change: 'stable', note: '4 600 refs' },
    ],
  },
  {
    territory: 'yt',
    updatedAt: '2025-02-03',
    lowestPrices: [
      { name: 'Super U Mamoudzou', score: 87, change: 'down', note: '-1.1 pt' },
      { name: 'Jumbo Score Kawéni', score: 85, change: 'stable', note: 'Panier bas' },
      { name: 'Carrefour Mamoudzou', score: 84, change: 'up', note: '+0.6 pt' },
    ],
    bestValue: [
      { name: 'Marché de Mamoudzou', score: 89, change: 'up', note: 'Frais & locaux' },
      { name: 'Super U Mamoudzou', score: 86, change: 'stable', note: 'Qualité régulière' },
      { name: 'Jumbo Score Kawéni', score: 85, change: 'down', note: '-0.8 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour Mamoudzou', score: 92, change: 'stable', note: '3 700 refs' },
      { name: 'Super U Mamoudzou', score: 89, change: 'up', note: '+60 refs' },
      { name: 'Jumbo Score Kawéni', score: 88, change: 'stable', note: '3 200 refs' },
    ],
  },
  {
    territory: 'fr',
    updatedAt: '2025-02-03',
    lowestPrices: [
      { name: 'E.Leclerc', score: 94, change: 'up', note: '+0.8 pt' },
      { name: 'Lidl', score: 92, change: 'stable', note: 'Panier bas' },
      { name: 'Intermarché', score: 90, change: 'down', note: '-0.6 pt' },
    ],
    bestValue: [
      { name: 'U Express', score: 91, change: 'stable', note: 'Qualité régulière' },
      { name: 'E.Leclerc', score: 90, change: 'up', note: '+0.5 pt' },
      { name: 'Carrefour Market', score: 89, change: 'down', note: '-0.4 pt' },
    ],
    widestSelection: [
      { name: 'Carrefour', score: 97, change: 'stable', note: '9 100 refs' },
      { name: 'Auchan', score: 95, change: 'up', note: '+180 refs' },
      { name: 'E.Leclerc', score: 93, change: 'stable', note: '8 300 refs' },
    ],
  },
];

export const getPalmaresForTerritory = (territory: TerritoryCode) =>
  OBSERVATOIRE_PALMARES.find((entry) => entry.territory === territory) ??
  OBSERVATOIRE_PALMARES.find((entry) => entry.territory === 'fr') ??
  null;
