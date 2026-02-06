export type ObservatoireLocalData = {
  titre: string;
  territoire: string;
  periode: string;
  devise: string;
  source: {
    nom: string;
    url: string;
  };
  panier: { produit: string; prix_moyen: number }[];
  note?: string;
};

export const observatoireLocalData: ObservatoireLocalData = {
  titre: 'Prix du panier alimentaire de base',
  territoire: 'Guadeloupe',
  periode: '2026-01',
  devise: 'EUR',
  source: {
    nom: 'Relevé terrain – janvier 2026',
    url: 'https://www.insee.fr',
  },
  panier: [
    { produit: 'Riz 1kg', prix_moyen: 2.1 },
    { produit: 'Lait 1L', prix_moyen: 1.45 },
    { produit: 'Poulet entier 1kg', prix_moyen: 5.9 },
    { produit: 'Oeufs (12)', prix_moyen: 3.2 },
  ],
  note: 'Donnée expérimentale – première publication observatoire',
};
