import prisma from '../database/prisma.js';

export async function historyService({
  id,
  territory,
  range,
}: {
  id: string;
  territory: string;
  range: string;
}) {
  const days = range === '30d' ? 30 : 7;
  const since = new Date(Date.now() - days * 86_400_000);

  // Query real observations from the database
  const observations = await prisma.priceObservation.findMany({
    where: {
      productId: id,
      territory: territory.toLowerCase(),
      observedAt: { gte: since },
    },
    orderBy: { observedAt: 'asc' },
    select: { observedAt: true, price: true },
  });

  if (observations.length > 0) {
    return observations.map((obs) => ({
      date: obs.observedAt.toISOString(),
      price: obs.price,
    }));
  }

  // Fallback: monthly history when no recent observations exist
  const now = new Date();
  const monthlyHistory = await prisma.priceHistoryMonthly.findMany({
    where: {
      productId: id,
      territory: territory.toLowerCase(),
      OR: [
        { year: now.getFullYear(), month: { lte: now.getMonth() + 1 } },
        { year: now.getFullYear() - 1 },
      ],
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
    take: 12,
    select: { year: true, month: true, avgPrice: true },
  });

  if (monthlyHistory.length > 0) {
    return monthlyHistory.map((h) => ({
      date: new Date(h.year, h.month - 1, 1).toISOString(),
      price: h.avgPrice,
    }));
  }

  // No data available — return empty array
  return [];
}
