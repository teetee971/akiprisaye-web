// NewsController.ts - Controller for news/actualités API
// Handles news articles related to price changes and consumer alerts

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content?: string;
  date: string;
  category: string;
  territory: string;
  author?: string;
  tags?: string[];
}

class NewsController {
  /**
   * GET /api/news
   * Fetch news articles
   */
  async index({ request, response }) {
    try {
      const { territory, category, limit = 10 } = request.qs();

      let news = this.getMockNews();

      // Filter by territory if specified
      if (territory && territory !== 'all') {
        news = news.filter(article => 
          article.territory === territory || 
          article.territory === 'Tous territoires' ||
          article.territory === 'DROM-COM'
        );
      }

      // Filter by category if specified
      if (category) {
        news = news.filter(article => 
          article.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Limit results
      news = news.slice(0, parseInt(limit));

      return response.ok({
        data: news,
        meta: {
          total: news.length,
          territory: territory || 'all',
          category: category || 'all'
        }
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error fetching news',
        message: error.message
      });
    }
  }

  /**
   * GET /api/news/:id
   * Fetch a single news article by ID
   */
  async show({ params, response }) {
    try {
      const { id } = params;
      const news = this.getMockNews();
      const article = news.find(n => n.id === parseInt(id));

      if (!article) {
        return response.notFound({
          error: 'Article not found'
        });
      }

      return response.ok({
        data: article
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error fetching article',
        message: error.message
      });
    }
  }

  /**
   * POST /api/news
   * Create a new news article (admin only in production)
   */
  async store({ request, response }) {
    try {
      const data = request.body();

      // Validate required fields
      const required = ['title', 'summary', 'category', 'territory'];
      for (const field of required) {
        if (!data[field]) {
          return response.badRequest({
            error: `Field ${field} is required`
          });
        }
      }

      const newArticle: NewsArticle = {
        id: Date.now(),
        title: data.title,
        summary: data.summary,
        content: data.content || '',
        date: new Date().toISOString(),
        category: data.category,
        territory: data.territory,
        author: data.author || 'A KI PRI SA YÉ',
        tags: data.tags || []
      };

      return response.created({
        data: newArticle,
        message: 'Article created successfully'
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error creating article',
        message: error.message
      });
    }
  }

  /**
   * Mock news data
   * Replace with database queries in production
   */
  private getMockNews(): NewsArticle[] {
    return [
      {
        id: 1,
        title: 'Nouvelle baisse des prix dans les grandes surfaces',
        summary: 'Plusieurs enseignes annoncent une réduction de 5% sur les produits de première nécessité suite aux accords bouclier qualité-prix.',
        content: 'Les principales enseignes de distribution en Guadeloupe ont annoncé une baisse significative des prix...',
        date: '2025-11-08T10:00:00Z',
        category: 'Prix',
        territory: 'Guadeloupe',
        author: 'Rédaction AKPSY',
        tags: ['prix', 'baisse', 'bouclier-qualité-prix']
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
        tags: ['innovation', 'comparateur', 'technologie']
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
        tags: ['politique', 'bouclier', 'gouvernement']
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
        tags: ['shrinkflation', 'alerte', 'produits-laitiers']
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
        tags: ['commerce', 'ouverture', 'discount']
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
        tags: ['mobile', 'pwa', 'application']
      }
    ];
  }
}

export default NewsController;
