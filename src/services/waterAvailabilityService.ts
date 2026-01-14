/**
 * Water Availability Service
 * Gestion disponibilité eau temps réel
 * 
 * Service de suivi de la disponibilité de l'eau potable
 * pour les territoires ultramarins (Mayotte, Guadeloupe, etc.)
 */

import type {
  WaterAvailability,
  WaterCutHistory,
  WaterStatus,
  Territory,
  WaterAvailabilityDatabase,
} from '../types/waterComparison';

/**
 * Load water availability database
 */
async function loadDatabase(): Promise<WaterAvailabilityDatabase> {
  try {
    const response = await fetch('/data/water-availability.json');
    if (!response.ok) {
      throw new Error('Failed to load water availability data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading water availability database:', error);
    // Return empty database on error
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'A KI PRI SA YÉ',
        note: 'Error loading data',
      },
      providers: [],
      current_status: [],
      cut_history: [],
      pricing: [],
      quality: [],
      leaks: [],
    };
  }
}

/**
 * Report water status from citizen contribution
 */
export async function reportWaterStatus(
  report: Omit<WaterAvailability, 'id' | 'createdAt' | 'verified'>
): Promise<WaterAvailability> {
  // In a real implementation, this would POST to an API
  // For now, create a local report
  const newReport: WaterAvailability = {
    ...report,
    id: `status_${Date.now()}`,
    createdAt: new Date().toISOString(),
    verified: false,
  };

  console.log('Water status reported:', newReport);
  return newReport;
}

/**
 * Get water status by location (commune)
 * Note: Territory parameter reserved for future filtering when data grows
 */
export async function getWaterStatusByLocation(
  commune: string,
  _territory: Territory
): Promise<WaterAvailability[]> {
  const db = await loadDatabase();

  return db.current_status.filter(
    (status) =>
      status.location.commune.toLowerCase() === commune.toLowerCase()
      // _territory parameter reserved for future territory-based filtering
  );
}

/**
 * Get water status map for entire territory
 * Returns a map of commune names to their current status
 */
export async function getWaterStatusMap(
  territory: Territory
): Promise<Map<string, WaterStatus>> {
  const db = await loadDatabase();

  const statusMap = new Map<string, WaterStatus>();

  // Group by commune and get the most recent/severe status
  db.current_status.forEach((status) => {
    const commune = status.location.commune;
    const currentStatus = statusMap.get(commune);

    // Priority: cut > low_pressure > scheduled_cut > available
    const priority = {
      cut: 4,
      low_pressure: 3,
      scheduled_cut: 2,
      available: 1,
    };

    if (
      !currentStatus ||
      priority[status.status] > priority[currentStatus]
    ) {
      statusMap.set(commune, status.status);
    }
  });

  return statusMap;
}

/**
 * Get cut history for a commune
 */
export async function getCutHistory(
  commune: string,
  startDate: string,
  endDate: string
): Promise<WaterCutHistory[]> {
  const db = await loadDatabase();

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return db.cut_history.filter((cut) => {
    const cutStart = new Date(cut.startDate).getTime();
    const cutEnd = cut.endDate ? new Date(cut.endDate).getTime() : Date.now();

    return (
      cut.location.commune.toLowerCase() === commune.toLowerCase() &&
      cutStart <= end &&
      cutEnd >= start
    );
  });
}

/**
 * Calculate statistics from cut history
 */
export function calculateCutStatistics(history: WaterCutHistory[]): {
  totalCuts: number;
  averageDuration: number;
  longestCut: number;
  frequencyPerWeek: number;
} {
  if (history.length === 0) {
    return {
      totalCuts: 0,
      averageDuration: 0,
      longestCut: 0,
      frequencyPerWeek: 0,
    };
  }

  const totalDuration = history.reduce((sum, cut) => sum + cut.duration, 0);
  const averageDuration = Math.round(totalDuration / history.length);
  const longestCut = Math.max(...history.map((cut) => cut.duration));

  // Calculate frequency per week
  const dates = history
    .map((cut) => new Date(cut.startDate).getTime())
    .sort((a, b) => a - b);

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const durationWeeks = (lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000);
  const frequencyPerWeek =
    durationWeeks > 0 ? history.length / durationWeeks : 0;

  return {
    totalCuts: history.length,
    averageDuration,
    longestCut,
    frequencyPerWeek: Math.round(frequencyPerWeek * 100) / 100,
  };
}

/**
 * Get all current water status entries
 */
export async function getAllWaterStatus(): Promise<WaterAvailability[]> {
  const db = await loadDatabase();
  return db.current_status;
}

/**
 * Get water status by ID
 */
export async function getWaterStatusById(
  id: string
): Promise<WaterAvailability | null> {
  const db = await loadDatabase();
  return db.current_status.find((status) => status.id === id) || null;
}
