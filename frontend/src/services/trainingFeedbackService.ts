/**
 * Training Feedback Service
 * Manages citizen contributions on real insertion rates
 */

import type { TrainingFeedback, TrainingDatabase } from '../types/trainingComparison';

/**
 * Load training database
 */
async function loadTrainingData(): Promise<TrainingDatabase> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/training-programs.json`);
    if (!response.ok) {
      throw new Error('Failed to load training data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading training data:', error);
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'A KI PRI SA YÉ',
        note: 'Données en développement',
      },
      organismes: [],
      programs: [],
      jobs_market: [],
      feedbacks: [],
    };
  }
}

/**
 * Submit training feedback
 */
export async function submitFeedback(
  feedback: Omit<TrainingFeedback, 'id' | 'createdAt' | 'verified'>
): Promise<TrainingFeedback> {
  // In production, this would POST to an API
  const newFeedback: TrainingFeedback = {
    ...feedback,
    id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: new Date().toISOString(),
    verified: false, // Would require admin verification
  };

  if (import.meta.env.DEV) console.log('Submitting feedback:', newFeedback);

  // For now, just return the created feedback
  // In production, save to database
  return newFeedback;
}

/**
 * Get all feedbacks for a training
 */
export async function getFeedbackByTraining(trainingId: string): Promise<TrainingFeedback[]> {
  const data = await loadTrainingData();
  return data.feedbacks.filter((f) => f.trainingId === trainingId);
}

/**
 * Calculate insertion rates from feedbacks
 */
export function calculateInsertionRate(feedbacks: TrainingFeedback[]): {
  rate3M: number;
  rate6M: number;
  rate12M: number;
  averageSalary: number;
} {
  if (feedbacks.length === 0) {
    return {
      rate3M: 0,
      rate6M: 0,
      rate12M: 0,
      averageSalary: 0,
    };
  }

  const completedFeedbacks = feedbacks.filter((f) => f.completed);
  const totalCompleted = completedFeedbacks.length;

  if (totalCompleted === 0) {
    return {
      rate3M: 0,
      rate6M: 0,
      rate12M: 0,
      averageSalary: 0,
    };
  }

  // Calculate insertion rates
  const foundJobWithin3M = completedFeedbacks.filter(
    (f) => f.jobFound && f.jobFoundDelay !== undefined && f.jobFoundDelay <= 3
  ).length;

  const foundJobWithin6M = completedFeedbacks.filter(
    (f) => f.jobFound && f.jobFoundDelay !== undefined && f.jobFoundDelay <= 6
  ).length;

  const foundJobWithin12M = completedFeedbacks.filter(
    (f) => f.jobFound && f.jobFoundDelay !== undefined && f.jobFoundDelay <= 12
  ).length;

  const rate3M = (foundJobWithin3M / totalCompleted) * 100;
  const rate6M = (foundJobWithin6M / totalCompleted) * 100;
  const rate12M = (foundJobWithin12M / totalCompleted) * 100;

  // Calculate average salary
  const salaries = completedFeedbacks.filter((f) => f.jobFound && f.salary).map((f) => f.salary!);

  const averageSalary =
    salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0;

  return {
    rate3M: Math.round(rate3M * 10) / 10,
    rate6M: Math.round(rate6M * 10) / 10,
    rate12M: Math.round(rate12M * 10) / 10,
    averageSalary: Math.round(averageSalary),
  };
}

/**
 * Get aggregate statistics for an organisme
 */
export async function getOrganismeStatistics(organismeId: string): Promise<{
  totalFeedbacks: number;
  averageRating: number;
  insertionRates: {
    rate3M: number;
    rate6M: number;
    rate12M: number;
  };
  verifiedFeedbacksCount: number;
}> {
  const data = await loadTrainingData();

  // Get all programs from this organisme
  const programIds = data.programs.filter((p) => p.organisme.id === organismeId).map((p) => p.id);

  // Get all feedbacks for these programs
  const feedbacks = data.feedbacks.filter((f) => programIds.includes(f.trainingId));

  if (feedbacks.length === 0) {
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      insertionRates: {
        rate3M: 0,
        rate6M: 0,
        rate12M: 0,
      },
      verifiedFeedbacksCount: 0,
    };
  }

  const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

  const insertionRates = calculateInsertionRate(feedbacks);

  return {
    totalFeedbacks: feedbacks.length,
    averageRating: Math.round(averageRating * 10) / 10,
    insertionRates: {
      rate3M: insertionRates.rate3M,
      rate6M: insertionRates.rate6M,
      rate12M: insertionRates.rate12M,
    },
    verifiedFeedbacksCount: feedbacks.filter((f) => f.verified).length,
  };
}

/**
 * Get success stories (highly rated with job found)
 */
export async function getSuccessStories(limit: number = 10): Promise<TrainingFeedback[]> {
  const data = await loadTrainingData();

  return data.feedbacks
    .filter((f) => f.jobFound && f.rating >= 4 && f.comment)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
