export interface LinkableAsset {
  url: string;
  title: string;
  pageType: 'inflation' | 'comparison' | 'pillar' | 'category' | 'product';
  internalLinks: number;
  pageViews: number;
  backlinksCount: number;
  outreachStatus?: 'new' | 'contacted' | 'won' | 'lost';
  authorityScore: number;
}

export type AuthorityActionType = 'PROMOTE_PAGE' | 'OUTREACH_NOW' | 'STRENGTHEN_CONTENT' | 'BOOST_INTERNAL_LINKING';

export interface AuthorityAction {
  type: AuthorityActionType;
  url: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}
