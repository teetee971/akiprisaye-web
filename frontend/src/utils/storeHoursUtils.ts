// @ts-nocheck
/**
 * Store Hours Utilities
 * 
 * Utilities for handling store opening hours, timezones, and status calculation
 * Supports DOM-TOM timezones and special hours (holidays, exceptional closures)
 */

/**
 * Store opening hours for a single day
 */
export interface DayHours {
  open?: string;   // e.g., "08:00"
  close?: string;  // e.g., "20:00"
  closed?: boolean; // true if closed all day
}

/**
 * Special hours for exceptional dates
 */
export interface SpecialHours {
  date: string;     // ISO date string (YYYY-MM-DD)
  open?: string;    // Opening time, if open
  close?: string;   // Closing time, if open
  closed?: boolean; // true if closed all day
  reason?: string;  // e.g., "Noël", "Jour férié"
}

/**
 * Complete store hours definition
 */
export interface StoreHours {
  storeId: string;
  regularHours: {
    [day: string]: DayHours[]; // Multiple periods per day (e.g., morning + afternoon)
  };
  specialHours?: SpecialHours[];
  timezone: string; // IANA timezone (e.g., "America/Guadeloupe")
}

/**
 * Store open status
 */
export type StoreStatus = 'open' | 'closing_soon' | 'closed' | 'unknown';

/**
 * Store status with metadata
 */
export interface StoreStatusInfo {
  status: StoreStatus;
  message: string;          // Human-readable message
  nextChange?: Date;        // Time of next status change
  nextChangeMessage?: string; // Message about next change
}

/**
 * Day of week names (French)
 */
const DAYS_OF_WEEK = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/**
 * Get current date/time in store's timezone
 */
export function getStoreLocalTime(timezone: string): Date {
  // Create date in the specified timezone
  // Note: This is a simplified approach using Intl.DateTimeFormat
  // For production, consider using date-fns-tz for more robust timezone handling
  const now = new Date();
  
  // Get time components in the target timezone
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  // Construct local date
  const localDate = new Date(
    parseInt(getValue('year')),
    parseInt(getValue('month')) - 1,
    parseInt(getValue('day')),
    parseInt(getValue('hour')),
    parseInt(getValue('minute')),
    parseInt(getValue('second'))
  );
  
  return localDate;
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format time in minutes to HH:MM string
 * (Currently unused but kept for future use)
 */
 
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a store is open at a specific time
 */
export function isStoreOpen(
  hours: StoreHours,
  checkTime?: Date
): StoreStatusInfo {
  if (!hours || !hours.regularHours) {
    return {
      status: 'unknown',
      message: 'Horaires non disponibles',
    };
  }

  // Get current time in store's timezone
  const now = checkTime || getStoreLocalTime(hours.timezone);
  const dayOfWeek = DAYS_OF_WEEK[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Format date for special hours check (YYYY-MM-DD)
  const dateStr = now.toISOString().split('T')[0];
  
  // Check for special hours first
  if (hours.specialHours) {
    const specialHour = hours.specialHours.find(sh => sh.date === dateStr);
    if (specialHour) {
      if (specialHour.closed) {
        return {
          status: 'closed',
          message: `Fermé${specialHour.reason ? ` - ${specialHour.reason}` : ''}`,
        };
      }
      
      if (specialHour.open && specialHour.close) {
        const openMinutes = parseTimeToMinutes(specialHour.open);
        const closeMinutes = parseTimeToMinutes(specialHour.close);
        
        if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
          const minutesUntilClose = closeMinutes - currentMinutes;
          
          if (minutesUntilClose <= 60) {
            return {
              status: 'closing_soon',
              message: `Ferme dans ${minutesUntilClose} min`,
              nextChange: new Date(now.getTime() + minutesUntilClose * 60000),
              nextChangeMessage: `Ferme à ${specialHour.close}`,
            };
          }
          
          return {
            status: 'open',
            message: `Ouvert · Ferme à ${specialHour.close}`,
            nextChange: new Date(now.getTime() + minutesUntilClose * 60000),
            nextChangeMessage: `Ferme à ${specialHour.close}`,
          };
        }
      }
    }
  }
  
  // Check regular hours
  const todayHours = hours.regularHours[dayOfWeek];
  
  if (!todayHours || todayHours.length === 0) {
    // No hours defined for today
    return {
      status: 'closed',
      message: 'Fermé aujourd\'hui',
    };
  }
  
  // Check if closed all day
  if (todayHours[0]?.closed) {
    return {
      status: 'closed',
      message: 'Fermé aujourd\'hui',
    };
  }
  
  // Check each period (morning, afternoon, etc.)
  for (const period of todayHours) {
    if (period.closed) continue;
    
    const openMinutes = parseTimeToMinutes(period.open);
    const closeMinutes = parseTimeToMinutes(period.close);
    
    // Currently open in this period
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minutesUntilClose = closeMinutes - currentMinutes;
      
      if (minutesUntilClose <= 60) {
        return {
          status: 'closing_soon',
          message: `Ferme dans ${minutesUntilClose} min`,
          nextChange: new Date(now.getTime() + minutesUntilClose * 60000),
          nextChangeMessage: `Ferme à ${period.close}`,
        };
      }
      
      return {
        status: 'open',
        message: `Ouvert · Ferme à ${period.close}`,
        nextChange: new Date(now.getTime() + minutesUntilClose * 60000),
        nextChangeMessage: `Ferme à ${period.close}`,
      };
    }
    
    // Not yet open - check if opening later today
    if (currentMinutes < openMinutes) {
      const minutesUntilOpen = openMinutes - currentMinutes;
      return {
        status: 'closed',
        message: `Ouvre à ${period.open}`,
        nextChange: new Date(now.getTime() + minutesUntilOpen * 60000),
        nextChangeMessage: `Ouvre à ${period.open}`,
      };
    }
  }
  
  // Closed for the day (after last closing time)
  return {
    status: 'closed',
    message: 'Fermé',
  };
}

/**
 * Get the status color class for UI
 */
export function getStatusColor(status: StoreStatus): string {
  switch (status) {
    case 'open':
      return 'green';
    case 'closing_soon':
      return 'orange';
    case 'closed':
      return 'red';
    case 'unknown':
    default:
      return 'gray';
  }
}

/**
 * Get the status emoji icon
 */
export function getStatusIcon(status: StoreStatus): string {
  switch (status) {
    case 'open':
      return '🟢';
    case 'closing_soon':
      return '🟠';
    case 'closed':
      return '🔴';
    case 'unknown':
    default:
      return '⚪';
  }
}

/**
 * Format hours for display (e.g., "08:00 - 12:30, 14:30 - 20:00")
 */
export function formatDayHours(dayHours: DayHours[]): string {
  if (!dayHours || dayHours.length === 0) {
    return 'Fermé';
  }
  
  if (dayHours[0]?.closed) {
    return 'Fermé';
  }
  
  return dayHours
    .filter(period => !period.closed)
    .map(period => `${period.open} - ${period.close}`)
    .join(', ');
}

/**
 * Get today's hours for a store
 */
export function getTodayHours(hours: StoreHours, checkTime?: Date): DayHours[] | null {
  if (!hours || !hours.regularHours) {
    return null;
  }
  
  const now = checkTime || getStoreLocalTime(hours.timezone);
  const dayOfWeek = DAYS_OF_WEEK[now.getDay()];
  
  return hours.regularHours[dayOfWeek] || null;
}

/**
 * Create sample store hours for demo/testing
 */
export function createSampleStoreHours(storeId: string, timezone: string): StoreHours {
  return {
    storeId,
    timezone,
    regularHours: {
      'lundi': [
        { open: '08:00', close: '12:30' },
        { open: '14:30', close: '20:00' },
      ],
      'mardi': [
        { open: '08:00', close: '12:30' },
        { open: '14:30', close: '20:00' },
      ],
      'mercredi': [
        { open: '08:00', close: '12:30' },
        { open: '14:30', close: '20:00' },
      ],
      'jeudi': [
        { open: '08:00', close: '12:30' },
        { open: '14:30', close: '20:00' },
      ],
      'vendredi': [
        { open: '08:00', close: '12:30' },
        { open: '14:30', close: '20:00' },
      ],
      'samedi': [
        { open: '08:00', close: '20:00' },
      ],
      'dimanche': [
        { closed: true },
      ],
    },
    specialHours: [
      // Example: Christmas Day
      {
        date: '2026-12-25',
        closed: true,
        reason: 'Noël',
      },
      // Example: New Year's Day
      {
        date: '2026-01-01',
        closed: true,
        reason: 'Jour de l\'an',
      },
    ],
  };
}
