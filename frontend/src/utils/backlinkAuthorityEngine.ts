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

export type AuthorityActionType =
  | 'PROMOTE_PAGE'
  | 'OUTREACH_NOW'
  | 'STRENGTHEN_CONTENT'
  | 'BOOST_INTERNAL_LINKING';

export interface AuthorityAction {
  type: AuthorityActionType;
  url: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export function computeAuthorityScore(asset: Omit<LinkableAsset, 'authorityScore'>): number {
  const raw = asset.pageViews * 0.3 + asset.backlinksCount * 20 + asset.internalLinks * 5;
  return Math.min(Math.round(raw), 100);
}

export function analyzeAuthority(assets: LinkableAsset[]): AuthorityAction[] {
  const actions: AuthorityAction[] = [];

  for (const a of assets) {
    if (a.pageViews > 30 && a.backlinksCount < 2) {
      actions.push({
        type: 'OUTREACH_NOW',
        url: a.url,
        priority: 'high',
        reason: `${a.pageViews} vues mais seulement ${a.backlinksCount} backlinks — lancer l'outreach`,
      });
    } else if ((a.pageType === 'pillar' || a.pageType === 'comparison') && a.authorityScore > 60) {
      actions.push({
        type: 'PROMOTE_PAGE',
        url: a.url,
        priority: 'high',
        reason: `Page ${a.pageType} avec score autorité ${a.authorityScore} — promouvoir activement`,
      });
    } else if (a.internalLinks < 5 && a.authorityScore > 40) {
      actions.push({
        type: 'BOOST_INTERNAL_LINKING',
        url: a.url,
        priority: 'medium',
        reason: `Score autorité ${a.authorityScore} mais seulement ${a.internalLinks} liens internes`,
      });
    } else {
      actions.push({
        type: 'STRENGTHEN_CONTENT',
        url: a.url,
        priority: 'low',
        reason: `Score autorité ${a.authorityScore} — renforcer le contenu pour progresser`,
      });
    }
  }

  return actions;
}
