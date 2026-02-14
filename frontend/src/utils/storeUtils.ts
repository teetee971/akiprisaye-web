import type { OpeningDay, Store } from '../types/store';

interface LatLon {
  lat: number;
  lon: number;
}

const DAY_KEYS: OpeningDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const DAY_LABELS: Record<OpeningDay, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mer',
  thu: 'Jeu',
  fri: 'Ven',
  sat: 'Sam',
  sun: 'Dim',
};

export function getDistanceKm(user: LatLon, store: LatLon): number {
  const R = 6371;
  const dLat = degToRad(store.lat - user.lat);
  const dLon = degToRad(store.lon - user.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(user.lat)) * Math.cos(degToRad(store.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function degToRad(value: number): number {
  return value * (Math.PI / 180);
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function getDayKey(date: Date, timezone: string): OpeningDay {
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone }).format(date).toLowerCase();
  const normalized = dayName.slice(0, 3);
  return DAY_KEYS.find((key) => key === normalized) ?? 'mon';
}

function getCurrentMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

export function isOpenNow(openingHours: Store['openingHours'], now: Date = new Date(), timezone = 'Europe/Paris') {
  if (!openingHours) {
    return { open: false, label: 'Horaires indisponibles' };
  }

  const day = getDayKey(now, timezone);
  const ranges = openingHours[day] ?? [];
  const currentMinutes = getCurrentMinutes(now, timezone);

  for (const range of ranges) {
    const [from, to] = range.split('-');
    const fromMinutes = toMinutes(from);
    const toMinutesValue = toMinutes(to);

    if (currentMinutes >= fromMinutes && currentMinutes <= toMinutesValue) {
      return { open: true, label: `Ouvert · jusqu'à ${to}` };
    }
  }

  const nextRange = ranges.find((range) => {
    const [from] = range.split('-');
    return currentMinutes < toMinutes(from);
  });

  if (nextRange) {
    return { open: false, label: `Fermé · ouvre à ${nextRange.split('-')[0]}` };
  }

  return { open: false, label: `Fermé · réouvre ${DAY_LABELS[day]}` };
}

export function formatDistance(distanceKm?: number): string {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) {
    return 'Distance inconnue';
  }

  return `${distanceKm.toFixed(1)} km`;
}
