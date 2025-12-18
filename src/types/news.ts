/**
 * NewsItem interface for civic news display
 * All news items must have verified official sources
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'PRIX' | 'POLITIQUE' | 'ALERTE' | 'INNOVATION';
  territory: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
    logo?: string;
  };
}

/**
 * Category configuration for visual display
 */
export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const categoryConfigs: Record<NewsItem['category'], CategoryConfig> = {
  PRIX: {
    label: 'PRIX',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: ''
  },
  POLITIQUE: {
    label: 'POLITIQUE',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: ''
  },
  ALERTE: {
    label: 'ALERTE',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: ''
  },
  INNOVATION: {
    label: 'INNOVATION',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: ''
  }
};
