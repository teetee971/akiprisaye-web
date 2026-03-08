import type { Ingester, NewsItem } from '../types/news';
import { RssIngester } from './rssIngester';

const FEED_URL = 'https://rappel.conso.gouv.fr/rss';

export class RappelConsoIngester implements Ingester {
  id = 'rappel-conso';
  confidence = 'official' as const;
  private rss: RssIngester;

  constructor() {
    this.rss = new RssIngester({
      id: this.id,
      feedUrl: FEED_URL,
      sourceName: 'RappelConso',
      territory: 'fr',
    });
  }

  async fetch(): Promise<NewsItem[]> {
    const items = await this.rss.fetch();
    return items.map((item) => ({
      ...item,
      type: 'rappels' as const,
      impact: 'fort' as const,
      confidence: 'official' as const,
      verified: true,
      tags: [...(item.tags ?? []), 'rappel', 'sécurité', 'consommateur'],
    }));
  }
}
