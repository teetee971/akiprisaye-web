import { selectKnownEans } from '../db';

const FALLBACK_EANS = ['3560070894222', '3017620422003', '3270190202002'];

export async function selectEansToRefresh(db: D1Database, limit = 50): Promise<string[]> {
  const known = await selectKnownEans(db, limit);
  if (known.length > 0) {
    return known;
  }

  return FALLBACK_EANS.slice(0, Math.max(1, Math.min(limit, FALLBACK_EANS.length)));
}
