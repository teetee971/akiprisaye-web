export type TimeRange = 'hour' | 'day' | 'week' | 'month';

export function filterByRange<T extends { observedAt: string }>(data: T[], range: TimeRange): T[] {
  const now = Date.now();
  const limits: Record<TimeRange, number> = {
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
  };

  return data.filter((entry) => now - new Date(entry.observedAt).getTime() <= limits[range]);
}
