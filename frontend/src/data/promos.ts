import type { PromoSource } from '../types/market';

export const promosDataset: PromoSource[] = [
  {
    id: 'promo-gp-leclerc-bas-du-fort-jan',
    name: 'E.Leclerc Bas du Fort',
    territory: 'gp',
    storeId: 'leclerc-bas-du-fort',
    title: 'Catalogue hebdomadaire — produits du quotidien',
    periodStart: '2026-02-10',
    periodEnd: '2026-02-23',
    url: 'https://www.e.leclerc',
    tags: ['alimentaire', 'mvp'],
  },
  { id: 'promo-gp-u-baie-mahault', name: 'U Baie-Mahault', territory: 'gp', storeId: 'u-baie-mahault', title: 'Prospectus semaine budget famille', periodStart: '2026-02-08', periodEnd: '2026-02-20', url: 'https://www.magasins-u.com/', tags: ['famille', 'budget'] },
  { id: 'promo-mq-carrefour-dillon', name: 'Carrefour Dillon', territory: 'mq', storeId: 'carrefour-dillon', title: 'Catalogue maison & entretien', periodStart: '2026-02-12', periodEnd: '2026-02-24', url: 'https://www.carrefour.fr/', tags: ['entretien'] },
  { id: 'promo-mq-hyper-u-robert', name: 'Hyper U Le Robert', territory: 'mq', storeId: 'hyperu-robert', title: 'Offres anti-gaspi', periodStart: '2026-02-09', periodEnd: '2026-02-18', url: 'https://www.magasins-u.com/', tags: ['anti-gaspi'] },
  { id: 'promo-fr-carrefour-market', name: 'Carrefour Market', territory: 'fr', title: 'Sélection promos nationales', periodStart: '2026-02-05', periodEnd: '2026-02-28', url: 'https://www.carrefour.fr/' },
  { id: 'promo-fr-auchan-drive', name: 'Auchan Drive', territory: 'fr', title: 'Prix barrés - drive', periodStart: '2026-02-03', periodEnd: '2026-02-21', url: 'https://www.auchan.fr/', tags: ['drive'] },
  { id: 'promo-gp-super-u-sainte-anne', name: 'Super U Sainte-Anne', territory: 'gp', storeId: 'superu-sainte-anne', title: 'Cuisine locale et frais', periodStart: '2026-02-11', periodEnd: '2026-02-19', url: 'https://www.magasins-u.com/', tags: ['frais', 'local'] },
];
