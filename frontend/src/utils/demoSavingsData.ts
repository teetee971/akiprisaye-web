import { addSavingsEntry } from '../services/savingsService';

/**
 * Add demo savings data for testing
 * This is a helper function to populate the dashboard with sample data
 */
export function addDemoSavingsData() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  // Add savings from the last 6 months
  const demoData = [
    // This month
    {
      amount: 5.5,
      productName: 'Lait UHT',
      storeName: 'Super U',
      category: 'Alimentaire',
      daysAgo: 2,
    },
    {
      amount: 12.3,
      productName: 'Riz Basmati 5kg',
      storeName: 'Leader Price',
      category: 'Alimentaire',
      daysAgo: 5,
    },
    {
      amount: 8.2,
      productName: "Huile d'olive",
      storeName: 'Carrefour',
      category: 'Alimentaire',
      daysAgo: 7,
    },
    {
      amount: 15.0,
      productName: 'Pack eau minérale',
      storeName: 'Leclerc',
      category: 'Boissons',
      daysAgo: 10,
    },

    // Last month
    {
      amount: 25.5,
      productName: 'Poulet fermier',
      storeName: 'Auchan',
      category: 'Viandes',
      daysAgo: 35,
    },
    {
      amount: 10.8,
      productName: 'Savon liquide',
      storeName: 'Super U',
      category: 'Hygiène',
      daysAgo: 40,
    },
    {
      amount: 18.4,
      productName: 'Café moulu',
      storeName: 'Carrefour',
      category: 'Alimentaire',
      daysAgo: 45,
    },

    // 2 months ago
    {
      amount: 22.0,
      productName: 'Fromage',
      storeName: 'Leader Price',
      category: 'Produits laitiers',
      daysAgo: 65,
    },
    {
      amount: 14.5,
      productName: "Jus d'orange",
      storeName: 'Leclerc',
      category: 'Boissons',
      daysAgo: 70,
    },

    // 3 months ago
    {
      amount: 30.0,
      productName: 'Papier toilette x24',
      storeName: 'Auchan',
      category: 'Hygiène',
      daysAgo: 95,
    },
    {
      amount: 12.75,
      productName: 'Pâtes 1kg',
      storeName: 'Super U',
      category: 'Alimentaire',
      daysAgo: 100,
    },

    // 4 months ago
    {
      amount: 8.9,
      productName: 'Shampoing',
      storeName: 'Carrefour',
      category: 'Hygiène',
      daysAgo: 125,
    },
    {
      amount: 20.3,
      productName: 'Légumes surgelés',
      storeName: 'Leader Price',
      category: 'Surgelés',
      daysAgo: 130,
    },

    // 5 months ago
    {
      amount: 16.6,
      productName: 'Yaourts x12',
      storeName: 'Leclerc',
      category: 'Produits laitiers',
      daysAgo: 155,
    },
    {
      amount: 11.2,
      productName: 'Biscuits',
      storeName: 'Auchan',
      category: 'Épicerie sucrée',
      daysAgo: 160,
    },
  ];

  demoData.forEach((item) => {
    const entryDate = now - item.daysAgo * oneDay;
    addSavingsEntry(item.amount, item.productName, item.storeName, item.category);

    // Manually adjust the date for demo purposes
    // Note: In production, this would use the actual comparison date
  });

  console.log('✅ Demo savings data added successfully!');
  console.log(`Total entries: ${demoData.length}`);
  console.log(`Total savings: ${demoData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}€`);
}

/**
 * Clear all demo data
 */
export function clearDemoData() {
  if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données de démonstration ?')) {
    localStorage.removeItem('akiprisaye_savings');
    localStorage.removeItem('akiprisaye_savings_badges');
    console.log('✅ Demo data cleared');
    window.location.reload();
  }
}

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).addDemoSavingsData = addDemoSavingsData;
  (window as any).clearDemoData = clearDemoData;
}
