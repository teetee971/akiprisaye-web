/**
 * Water Leak Service
 * Service de signalement et suivi des fuites d'eau
 * 
 * Plateforme collaborative pour signaler et suivre les fuites
 */

import type {
  WaterLeakReport,
  LeakType,
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
 * Report a new leak
 */
export async function reportLeak(
  leak: Omit<
    WaterLeakReport,
    'id' | 'reportedAt' | 'status' | 'verified'
  >
): Promise<WaterLeakReport> {
  // In a real implementation, this would POST to an API
  // For now, create a local report
  const newLeak: WaterLeakReport = {
    ...leak,
    id: `leak_${Date.now()}`,
    reportedAt: new Date().toISOString(),
    status: 'reported',
    verified: false,
  };

  console.log('Leak reported:', newLeak);
  return newLeak;
}

/**
 * Get leaks by location
 */
export async function getLeaksByLocation(
  commune: string,
  radius?: number
): Promise<WaterLeakReport[]> {
  const db = await loadDatabase();

  let leaks = db.leaks.filter(
    (leak) => leak.location.commune.toLowerCase() === commune.toLowerCase()
  );

  // If radius is specified, could filter by distance
  // (requires coordinate calculations - not implemented here)

  return leaks;
}

/**
 * Get all leaks
 */
export async function getAllLeaks(): Promise<WaterLeakReport[]> {
  const db = await loadDatabase();
  return db.leaks;
}

/**
 * Get leak by ID
 */
export async function getLeakById(
  id: string
): Promise<WaterLeakReport | null> {
  const db = await loadDatabase();
  return db.leaks.find((leak) => leak.id === id) || null;
}

/**
 * Update leak status
 */
export async function updateLeakStatus(
  leakId: string,
  status: WaterLeakReport['status']
): Promise<WaterLeakReport> {
  // In a real implementation, this would PATCH to an API
  const leak = await getLeakById(leakId);

  if (!leak) {
    throw new Error(`Leak with ID ${leakId} not found`);
  }

  const updatedLeak: WaterLeakReport = {
    ...leak,
    status,
    ...(status === 'repaired' && {
      repairedAt: new Date().toISOString(),
      repairDuration: leak.reportedAt
        ? Math.round(
            (Date.now() - new Date(leak.reportedAt).getTime()) /
              (1000 * 60 * 60)
          )
        : undefined,
    }),
  };

  console.log('Leak status updated:', updatedLeak);
  return updatedLeak;
}

/**
 * Calculate water loss from leaks
 */
export function calculateWaterLoss(
  leaks: WaterLeakReport[],
  pricePerM3: number = 5.0
): {
  totalLitersPerDay: number;
  totalM3PerYear: number;
  costPerYear: number;
} {
  // Only count active leaks (not repaired or rejected)
  const activeLeaks = leaks.filter(
    (leak) => leak.status !== 'repaired' && leak.status !== 'rejected'
  );

  const totalLitersPerHour = activeLeaks.reduce(
    (sum, leak) => sum + (leak.estimatedLossLitersPerHour || 0),
    0
  );

  const totalLitersPerDay = totalLitersPerHour * 24;
  const totalM3PerYear = (totalLitersPerDay * 365) / 1000;
  const costPerYear = totalM3PerYear * pricePerM3;

  return {
    totalLitersPerDay: Math.round(totalLitersPerDay),
    totalM3PerYear: Math.round(totalM3PerYear * 100) / 100,
    costPerYear: Math.round(costPerYear * 100) / 100,
  };
}

/**
 * Get leaks by status
 */
export async function getLeaksByStatus(
  status: WaterLeakReport['status']
): Promise<WaterLeakReport[]> {
  const db = await loadDatabase();
  return db.leaks.filter((leak) => leak.status === status);
}

/**
 * Get leaks by severity
 */
export async function getLeaksBySeverity(
  severity: WaterLeakReport['severity']
): Promise<WaterLeakReport[]> {
  const db = await loadDatabase();
  return db.leaks.filter((leak) => leak.severity === severity);
}

/**
 * Get leak statistics
 */
export async function getLeakStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  averageRepairTime: number;
}> {
  const db = await loadDatabase();

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};

  db.leaks.forEach((leak) => {
    byStatus[leak.status] = (byStatus[leak.status] || 0) + 1;
    bySeverity[leak.severity] = (bySeverity[leak.severity] || 0) + 1;
    byType[leak.type] = (byType[leak.type] || 0) + 1;
  });

  // Calculate average repair time for repaired leaks
  const repairedLeaks = db.leaks.filter(
    (leak) => leak.status === 'repaired' && leak.repairDuration
  );
  const averageRepairTime =
    repairedLeaks.length > 0
      ? repairedLeaks.reduce(
          (sum, leak) => sum + (leak.repairDuration || 0),
          0
        ) / repairedLeaks.length
      : 0;

  return {
    total: db.leaks.length,
    byStatus,
    bySeverity,
    byType,
    averageRepairTime: Math.round(averageRepairTime * 100) / 100,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  coords1: [number, number],
  coords2: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const lat1 = (coords1[1] * Math.PI) / 180;
  const lat2 = (coords2[1] * Math.PI) / 180;
  const deltaLat = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const deltaLon = ((coords2[0] - coords1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get leaks within radius of coordinates
 */
export async function getLeaksNearLocation(
  coordinates: [number, number],
  radiusKm: number
): Promise<WaterLeakReport[]> {
  const db = await loadDatabase();

  return db.leaks.filter((leak) => {
    const distance = calculateDistance(coordinates, leak.location.coordinates);
    return distance <= radiusKm;
  });
}
