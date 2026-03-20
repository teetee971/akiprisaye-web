export async function historyService({ range }: { id: string; territory: string; range: string }) {
  const days = range === '30d' ? 30 : 7;
  let basePrice = 2.89;
  return Array.from({ length: days }).map((_, i) => {
    basePrice = Math.max(1.5, basePrice + (Math.random() - 0.5) * 0.12);
    return {
      date: new Date(Date.now() - (days - i) * 86_400_000).toISOString(),
      price: parseFloat(basePrice.toFixed(2)),
    };
  });
}
