import type { Ingester, NewsItem } from '../types/news';

/**
 * MVP intentionally stubbed.
 * TODO: branch to official JSON/RSS endpoint when long-term stable endpoint is validated.
 * No brittle HTML scraping here.
 */
export class RappelConsoIngester implements Ingester {
  id = 'rappel-conso';
  confidence = 'official' as const;

  async fetch(): Promise<NewsItem[]> {
    return [];
  }
}
