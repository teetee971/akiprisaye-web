import type { Ingester, NewsItem } from '../types/news';

type RssIngesterConfig = {
  id: string;
  feedUrl: string;
  sourceName: string;
  territory?: NewsItem['territory'];
};

const decodeXml = (raw: string) => raw
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .trim();

const getTag = (block: string, tag: string): string => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
};

const parseRssItems = (xml: string): Array<{ title: string; link: string; description: string; published: string }> => {
  const entries = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  if (entries.length === 0) {
    return [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]).map((entry) => {
      const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i);
      return {
        title: getTag(entry, 'title'),
        link: decodeXml(linkMatch?.[1] ?? ''),
        description: getTag(entry, 'summary') || getTag(entry, 'content'),
        published: getTag(entry, 'updated') || getTag(entry, 'published'),
      };
    });
  }

  return entries.map((item) => ({
    title: getTag(item, 'title'),
    link: getTag(item, 'link'),
    description: getTag(item, 'description'),
    published: getTag(item, 'pubDate') || getTag(item, 'dc:date'),
  }));
};

export class RssIngester implements Ingester {
  id: string;
  confidence = 'press' as const;
  private config: RssIngesterConfig;

  constructor(config: RssIngesterConfig) {
    this.id = config.id;
    this.config = config;
  }

  async fetch(): Promise<NewsItem[]> {
    const response = await fetch(this.config.feedUrl, { headers: { Accept: 'application/rss+xml, application/atom+xml, text/xml' } });
    if (!response.ok) throw new Error(`rss_upstream_${response.status}`);

    const xml = await response.text();
    const nowIso = new Date().toISOString();

    return parseRssItems(xml)
      .filter((item) => item.title && item.link)
      .slice(0, 20)
      .map((item, index) => ({
        id: `${this.id}-${index}-${item.link}`,
        type: 'press',
        territory: this.config.territory ?? 'fr',
        title: item.title,
        summary: item.description || 'Article de veille consommation.',
        source_name: this.config.sourceName,
        source_url: this.config.feedUrl,
        canonical_url: item.link,
        published_at: Number.isNaN(Date.parse(item.published)) ? nowIso : new Date(item.published).toISOString(),
        impact: 'info',
        isSponsored: false,
        confidence: 'press',
        verified: false,
        tags: ['rss', 'veille'],
      }));
  }
}
