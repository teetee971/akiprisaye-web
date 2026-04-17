export type QuantityUnit = 'kg' | 'g' | 'l' | 'ml' | 'unit';
export type NormalizedUnit = 'kg' | 'l' | 'unit';

export type NormalizePriceInput = {
  price?: number;
  unit?: string;
  quantityValue?: number;
  quantityUnit?: QuantityUnit;
};

export type NormalizePriceOutput = {
  pricePerUnit?: number;
  normalizedLabel: string;
};

function toNumber(value?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function toTargetUnitQuantity(
  quantityValue?: number,
  quantityUnit?: QuantityUnit
): { normalizedUnit: NormalizedUnit; quantity: number } | null {
  const value = toNumber(quantityValue);
  if (!value || !quantityUnit) return null;

  if (quantityUnit === 'kg') return { normalizedUnit: 'kg', quantity: value };
  if (quantityUnit === 'g') return { normalizedUnit: 'kg', quantity: value / 1000 };
  if (quantityUnit === 'l') return { normalizedUnit: 'l', quantity: value };
  if (quantityUnit === 'ml') return { normalizedUnit: 'l', quantity: value / 1000 };
  return { normalizedUnit: 'unit', quantity: value };
}

export function normalizePrice(input: NormalizePriceInput): NormalizePriceOutput {
  const price = toNumber(input.price);
  if (!price) {
    return { normalizedLabel: 'Prix indisponible' };
  }

  const normalizedQuantity = toTargetUnitQuantity(input.quantityValue, input.quantityUnit);
  const normalizedUnit =
    input.unit === 'kg' || input.unit === 'l' || input.unit === 'unit'
      ? input.unit
      : normalizedQuantity?.normalizedUnit;

  if (!normalizedQuantity || !normalizedUnit || normalizedQuantity.quantity <= 0) {
    return {
      pricePerUnit: price,
      normalizedLabel: `${price.toFixed(2)} €/unité`,
    };
  }

  if (normalizedUnit !== normalizedQuantity.normalizedUnit) {
    return {
      pricePerUnit: price,
      normalizedLabel: `${price.toFixed(2)} €/unité`,
    };
  }

  const perUnit = price / normalizedQuantity.quantity;
  const unitLabel = normalizedUnit === 'kg' ? 'kg' : normalizedUnit === 'l' ? 'L' : 'unité';

  return {
    pricePerUnit: perUnit,
    normalizedLabel: `${perUnit.toFixed(2)} €/` + unitLabel,
  };
}
