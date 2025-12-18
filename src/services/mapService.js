export const getStoresByTerritory = (territory) => {
  const stores = {
    'Guadeloupe': [
      { name: 'Carrefour Destrellan', lat: 16.262, lon: -61.583, category: 'Supermarché' },
      { name: 'Super U Baie-Mahault', lat: 16.271, lon: -61.588, category: 'Supermarché' },
      { name: 'Leader Price Gosier', lat: 16.224, lon: -61.493, category: 'Discount' },
    ],
    'Martinique': [
      { name: 'Hyper U Le Lamentin', lat: 14.613, lon: -60.996, category: 'Supermarché' },
      { name: 'Carrefour Dillon', lat: 14.610, lon: -61.058, category: 'Supermarché' },
    ],
    'Guyane': [
      { name: 'Carrefour Matoury', lat: 4.853, lon: -52.328, category: 'Supermarché' },
    ],
    'La Réunion': [
      { name: 'Hyper U Saint-Denis', lat: -20.884, lon: 55.450, category: 'Supermarché' },
      { name: 'Carrefour Sainte-Marie', lat: -20.897, lon: 55.550, category: 'Supermarché' },
      { name: 'Super U Saint-Pierre', lat: -21.338, lon: 55.478, category: 'Supermarché' },
    ],
    'Mayotte': [
      { name: 'Carrefour Mamoudzou', lat: -12.780, lon: 45.227, category: 'Supermarché' },
      { name: 'Leader Price Kawéni', lat: -12.765, lon: 45.234, category: 'Discount' },
    ],
    'Saint-Pierre-et-Miquelon': [
      { name: 'Super Marché Saint-Pierre', lat: 46.780, lon: -56.177, category: 'Supermarché' },
    ],
    'Saint-Barthélemy': [
      { name: 'AMC Gustavia', lat: 17.896, lon: -62.849, category: 'Supermarché' },
    ],
    'Saint-Martin': [
      { name: 'Super U Marigot', lat: 18.067, lon: -63.083, category: 'Supermarché' },
    ],
    'Wallis-et-Futuna': [
      { name: 'Magasin Mata-Utu', lat: -13.282, lon: -176.174, category: 'Supermarché' },
    ],
    'Polynésie française': [
      { name: 'Carrefour Arue', lat: -17.536, lon: -149.525, category: 'Supermarché' },
      { name: 'Super U Punaauia', lat: -17.626, lon: -149.603, category: 'Supermarché' },
    ],
    'Nouvelle-Calédonie': [
      { name: 'Carrefour Nouméa', lat: -22.276, lon: 166.458, category: 'Supermarché' },
      { name: 'Super U Dumbéa', lat: -22.151, lon: 166.448, category: 'Supermarché' },
    ],
    'Terres australes françaises': [
      // Mostly uninhabited or scientific bases, so no regular stores
    ],
  };
  return stores[territory] || [];
};
