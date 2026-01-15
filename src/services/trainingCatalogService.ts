/**
 * Training Catalog Service
 * Manages professional training programs database
 */

import type { Territory } from '../types/priceAlerts';
import type {
  TrainingProgram,
  TrainingFilters,
  TrainingDatabase,
} from '../types/trainingComparison';

let trainingCache: TrainingDatabase | null = null;

/**
 * Load training database from JSON
 */
async function loadTrainingData(): Promise<TrainingDatabase> {
  if (trainingCache) {
    return trainingCache;
  }

  try {
    const response = await fetch('/data/training-programs.json');
    if (!response.ok) {
      throw new Error('Failed to load training data');
    }
    trainingCache = await response.json();
    return trainingCache as TrainingDatabase;
  } catch (error) {
    console.error('Error loading training data:', error);
    // Return empty structure if file doesn't exist yet
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'A KI PRI SA YÉ - Observatoire Formations Professionnelles',
        note: 'Données CARIF-OREF + Contributions citoyennes',
      },
      organismes: [],
      programs: [],
      jobs_market: [],
      feedbacks: [],
    };
  }
}

/**
 * Get all trainings for a territory with optional filters
 */
export async function getAllTrainings(
  territory: Territory,
  filters?: TrainingFilters
): Promise<TrainingProgram[]> {
  const data = await loadTrainingData();
  let programs = data.programs.filter((p) => p.territory === territory);

  if (filters) {
    if (filters.domain) {
      programs = programs.filter((p) => p.details.domain === filters.domain);
    }
    if (filters.level) {
      programs = programs.filter((p) => p.details.level === filters.level);
    }
    if (filters.type) {
      programs = programs.filter((p) => p.details.type === filters.type);
    }
    if (filters.mode) {
      programs = programs.filter((p) => p.details.mode === filters.mode);
    }
    if (filters.maxCost !== undefined) {
      programs = programs.filter((p) => p.pricing.catalogPrice <= filters.maxCost!);
    }
    if (filters.minDuration !== undefined) {
      programs = programs.filter((p) => p.details.durationWeeks >= filters.minDuration!);
    }
    if (filters.maxDuration !== undefined) {
      programs = programs.filter((p) => p.details.durationWeeks <= filters.maxDuration!);
    }
    if (filters.cpfEligible) {
      programs = programs.filter((p) => p.pricing.cpfEligible);
    }
    if (filters.poleEmploiEligible) {
      programs = programs.filter((p) => p.pricing.poleEmploiEligible);
    }
    if (filters.minInsertionRate !== undefined) {
      programs = programs.filter((p) => {
        const rate = p.outcomes.insertionRate6M || 0;
        return rate >= filters.minInsertionRate!;
      });
    }
  }

  return programs;
}

/**
 * Search trainings by keyword
 */
export async function searchTrainings(
  query: string,
  territory: Territory
): Promise<TrainingProgram[]> {
  const data = await loadTrainingData();
  const lowerQuery = query.toLowerCase();

  return data.programs.filter((p) => {
    if (p.territory !== territory) return false;

    return (
      p.name.toLowerCase().includes(lowerQuery) ||
      p.details.domain.toLowerCase().includes(lowerQuery) ||
      p.organisme.name.toLowerCase().includes(lowerQuery) ||
      p.outcomes.jobs.some((job) => job.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get training by ID
 */
export async function getTrainingById(id: string): Promise<TrainingProgram | null> {
  const data = await loadTrainingData();
  return data.programs.find((p) => p.id === id) || null;
}

/**
 * Compare multiple trainings
 */
export async function compareTrainings(trainingIds: string[]): Promise<TrainingProgram[]> {
  const data = await loadTrainingData();
  return data.programs.filter((p) => trainingIds.includes(p.id));
}

/**
 * Get all available domains
 */
export async function getAvailableDomains(territory: Territory): Promise<string[]> {
  const programs = await getAllTrainings(territory);
  const domains = new Set(programs.map((p) => p.details.domain));
  return Array.from(domains).sort();
}

/**
 * Get training statistics for a territory
 */
export async function getTrainingStatistics(territory: Territory) {
  const programs = await getAllTrainings(territory);

  return {
    totalPrograms: programs.length,
    byDomain: programs.reduce((acc, p) => {
      acc[p.details.domain] = (acc[p.details.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byLevel: programs.reduce((acc, p) => {
      acc[p.details.level] = (acc[p.details.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byMode: programs.reduce((acc, p) => {
      acc[p.details.mode] = (acc[p.details.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averagePrice: programs.reduce((sum, p) => sum + p.pricing.catalogPrice, 0) / programs.length,
    cpfEligibleCount: programs.filter((p) => p.pricing.cpfEligible).length,
    poleEmploiEligibleCount: programs.filter((p) => p.pricing.poleEmploiEligible).length,
  };
}
