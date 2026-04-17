export type EvolutionPoint = {
  month: string;
  index: number;
};

export async function loadDomEvolution(
  territory: string,
  months: string[]
): Promise<EvolutionPoint[]> {
  const results: EvolutionPoint[] = [];

  for (const m of months) {
    try {
      const res = await fetch(`/data/observatoire/${territory}_${m}.json`, { cache: 'no-store' });
      if (!res.ok) continue;

      const json = await res.json();
      results.push({
        month: m,
        index: json.pressureIndex,
      });
    } catch {
      /* silencieux */
    }
  }

  return results;
}
