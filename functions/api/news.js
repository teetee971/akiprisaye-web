/**
 * Cloudflare Pages Function: /api/news
 * Returns news articles about prices and consumer information
 */

// Mock news data (in production, fetch from Firestore)
const MOCK_NEWS = [
  {
    id: 1,
    title: 'Nouvelle baisse des prix dans les grandes surfaces',
    summary: 'Plusieurs enseignes annoncent une réduction de 5% sur les produits de première nécessité suite aux accords bouclier qualité-prix.',
    content: 'Les principales enseignes de distribution en Guadeloupe ont annoncé une baisse significative des prix...',
    date: '2025-11-08T10:00:00Z',
    category: 'Prix',
    territory: 'Guadeloupe',
    author: 'Rédaction AKPSY',
    tags: ['prix', 'baisse', 'bouclier-qualité-prix'],
    published: true,
  },
  {
    id: 2,
    title: 'Ouverture du comparateur de prix A KI PRI SA YÉ',
    summary: 'A KI PRI SA YÉ lance son comparateur intelligent pour les consommateurs ultra-marins avec plus de 10 000 produits référencés.',
    content: 'La plateforme A KI PRI SA YÉ inaugure aujourd\'hui son comparateur de prix en ligne...',
    date: '2025-11-07T14:30:00Z',
    category: 'Innovation',
    territory: 'Tous territoires',
    author: 'Équipe AKPSY',
    tags: ['innovation', 'comparateur', 'technologie'],
    published: true,
  },
  {
    id: 3,
    title: 'Bouclier qualité-prix étendu à 1000 produits',
    summary: 'Le gouvernement étend le dispositif anti-vie-chère à de nouveaux produits essentiels dans tous les DROM-COM.',
    content: 'Le ministre des Outre-mer a annoncé l\'extension du bouclier qualité-prix...',
    date: '2025-11-06T09:15:00Z',
    category: 'Politique',
    territory: 'DROM-COM',
    author: 'AFP',
    tags: ['politique', 'bouclier', 'gouvernement'],
    published: true,
  },
  {
    id: 4,
    title: 'Alerte shrinkflation sur les produits laitiers',
    summary: 'Les consommateurs signalent une réduction des quantités sans baisse des prix sur plusieurs marques de yaourts.',
    content: 'Une enquête citoyenne révèle que plusieurs marques de yaourts ont réduit...',
    date: '2025-11-05T16:45:00Z',
    category: 'Alerte',
    territory: 'Martinique',
    author: 'Association consommateurs',
    tags: ['shrinkflation', 'alerte', 'produits-laitiers'],
    published: true,
  },
  {
    id: 5,
    title: 'Nouveau magasin discount à Saint-Denis',
    summary: 'Ouverture d\'un nouveau Leader Price avec des prix 15% plus bas que la moyenne locale.',
    content: 'La Réunion accueille un nouveau magasin discount dans la zone commerciale...',
    date: '2025-11-04T11:20:00Z',
    category: 'Commerce',
    territory: 'La Réunion',
    author: 'Rédaction locale',
    tags: ['commerce', 'ouverture', 'discount'],
    published: true,
  },
  {
    id: 6,
    title: 'Application mobile A KI PRI SA YÉ disponible',
    summary: 'Téléchargez l\'application PWA pour scanner vos produits et comparer les prix en temps réel.',
    content: 'L\'application mobile progressive A KI PRI SA YÉ est maintenant disponible...',
    date: '2025-11-03T08:00:00Z',
    category: 'Innovation',
    territory: 'Tous territoires',
    author: 'Équipe AKPSY',
    tags: ['mobile', 'pwa', 'application'],
    published: true,
  },
];

/**
 * GET /api/news
 * Query params:
 * - territory: Filter by territory (optional)
 * - category: Filter by category (optional)
 * - limit: Number of articles to return (default: 10, max: 50)
 */
export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Extract parameters
    const territory = params.get('territory');
    const category = params.get('category');
    const limit = Math.min(parseInt(params.get('limit') || '10'), 50);
    
    // Filter news
    let filteredNews = MOCK_NEWS.filter(article => article.published);
    
    // Filter by territory if specified
    if (territory && territory !== 'all') {
      filteredNews = filteredNews.filter(article =>
        article.territory === territory ||
        article.territory === 'Tous territoires' ||
        article.territory === 'DROM-COM',
      );
    }
    
    // Filter by category if specified
    if (category) {
      filteredNews = filteredNews.filter(article =>
        article.category.toLowerCase() === category.toLowerCase(),
      );
    }
    
    // Limit results
    filteredNews = filteredNews.slice(0, limit);
    
    return new Response(JSON.stringify({
      data: filteredNews,
      meta: {
        total: filteredNews.length,
        territory: territory || 'all',
        category: category || 'all',
        limit,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
      },
    });
  } catch (error) {
    console.error('Error in /api/news:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/news
 * Create a new news article (admin only in production)
 */
export async function onRequestPost(context) {
  try {
    const { request } = context;
    const data = await request.json();
    
    // Validate required fields
    const required = ['title', 'summary', 'category', 'territory'];
    for (const field of required) {
      if (!data[field]) {
        return new Response(JSON.stringify({
          error: `Field ${field} is required`,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // In production: Verify admin authentication here
    // In production: Save to Firestore
    
    const newArticle = {
      id: Date.now(),
      title: data.title,
      summary: data.summary,
      content: data.content || '',
      date: new Date().toISOString(),
      category: data.category,
      territory: data.territory,
      author: data.author || 'A KI PRI SA YÉ',
      tags: data.tags || [],
      published: true,
    };
    
    return new Response(JSON.stringify({
      data: newArticle,
      message: 'Article created successfully (mock - not persisted)',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating article:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
