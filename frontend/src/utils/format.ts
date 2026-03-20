export function formatPrice(price: number): string {
  return price.toFixed(2) + ' €';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
