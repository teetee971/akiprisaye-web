import { PriceRecord } from "../types/civic"

export function predictPrice(records: PriceRecord[]) {
  const last = records[records.length - 1]
  const trend = records.length >= 2
    ? ((last.price - records[records.length - 2].price) / last.price) * 100
    : 0

  return {
    trendPercent: Number(trend.toFixed(2)),
    disclaimer:
      "Projection basée sur données publiques historiques. Aucune certitude garantie."
  }
}
