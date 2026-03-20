export function formatEur(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toFixed(2) + ' €';
}

export function formatSavings(savings: number | null | undefined): string {
  if (!savings) return '0,00 €';
  return `${savings.toFixed(2)} €`;
}
