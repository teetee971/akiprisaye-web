export type DomIndex = {
  territory: string;
  index: number;
};

export async function loadDomIndexesForMonth(month: string): Promise<DomIndex[]> {
  const territories = ['guadeloupe', 'martinique', 'guyane', 'la_réunion', 'mayotte'];

  const results: DomIndex[] = [];

  for (const t of territories) {
    try {
      const res = await fetch(`/data/observatoire/${t}_${month}.json`, { cache: 'no-store' });
      if (!res.ok) continue;

      const json = await res.json();
      results.push({
        territory: t,
        index: json.pressureIndex,
      });
    } catch {
      /* silencieux */
    }
  }

  return results;
}
