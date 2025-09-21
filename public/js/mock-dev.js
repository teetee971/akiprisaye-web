// Simple mock server for local development
// Mock news data
const mockNews = {
  "guadeloupe": [
    {
      title: "Nouvelle hausse des prix alimentaires en Guadeloupe",
      link: "https://example.com/news1",
      date: new Date().toISOString(),
      summary: "Les produits de première nécessité subissent une nouvelle augmentation de prix...",
      source: "Guadeloupe 1ère",
      territory: "guadeloupe",
      category: "vie-chere"
    },
    {
      title: "Comparatif des prix dans les grandes surfaces",
      link: "https://example.com/news2",
      date: new Date(Date.now() - 3600000).toISOString(),
      summary: "Étude comparative des tarifs pratiqués dans les enseignes de distribution...",
      source: "France-Antilles",
      territory: "guadeloupe",
      category: "comparatif-prix"
    },
    {
      title: "Mesures gouvernementales pour les DOM-TOM",
      link: "https://example.com/news3",
      date: new Date(Date.now() - 7200000).toISOString(),
      summary: "Le gouvernement annonce de nouvelles aides pour les territoires d'outre-mer...",
      source: "Outre-mer 1ère",
      territory: "guadeloupe",
      category: "dom-tom"
    },
    {
      title: "Augmentation du SMIC dans les DOM-TOM",
      link: "https://example.com/news5",
      date: new Date(Date.now() - 10800000).toISOString(),
      summary: "Le salaire minimum fait l'objet d'une revalorisation dans les territoires ultramarins...",
      source: "Outre-mer 1ère",
      territory: "guadeloupe",
      category: "dom-tom"
    },
    {
      title: "Étude sur le pouvoir d'achat en outre-mer",
      link: "https://example.com/news6",
      date: new Date(Date.now() - 14400000).toISOString(),
      summary: "Une nouvelle étude révèle l'évolution du pouvoir d'achat dans les DOM-TOM...",
      source: "INSEE",
      territory: "guadeloupe",
      category: "vie-chere"
    }
  ],
  "martinique": [
    {
      title: "Inflation record en Martinique",
      link: "https://example.com/news4",
      date: new Date().toISOString(),
      summary: "L'inflation atteint des niveaux historiques dans les DOM-TOM...",
      source: "Martinique 1ère",
      territory: "martinique",
      category: "vie-chere"
    },
    {
      title: "Comparaison des prix avec la métropole",
      link: "https://example.com/news7",
      date: new Date(Date.now() - 5400000).toISOString(),
      summary: "Une analyse détaillée des écarts de prix entre la Martinique et la France métropolitaine...",
      source: "France-Antilles",
      territory: "martinique",
      category: "comparatif-prix"
    }
  ]
};

function getMockNews(territory = 'guadeloupe', category = 'all') {
  const territoryNews = mockNews[territory] || mockNews['guadeloupe'];
  
  let filtered = territoryNews;
  if (category !== 'all') {
    filtered = territoryNews.filter(item => item.category === category);
  }
  
  return {
    ok: true,
    territory,
    category,
    fetchedAt: new Date().toISOString(),
    items: filtered
  };
}

// Mock the news endpoint during development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Intercept fetch requests to /news
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('/news')) {
      const urlObj = new URL(url, window.location.origin);
      const territory = urlObj.searchParams.get('territory') || 'guadeloupe';
      const category = urlObj.searchParams.get('category') || 'all';
      
      const mockData = getMockNews(territory, category);
      
      return Promise.resolve(new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return originalFetch.apply(this, arguments);
  };
}