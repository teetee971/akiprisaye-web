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
  };
  return stores[territory] || [];
};
