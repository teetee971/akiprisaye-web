/**
 * Job Matching Service
 * Matches users with job opportunities and required trainings
 */

import type { Territory } from '../types/priceAlerts';
import type {
  JobMarket,
  UserProfile,
  JobMatch,
  TrainingProgram,
  TrainingDatabase,
} from '../types/trainingComparison';

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
 * Get jobs in demand for a territory
 */
export async function getJobsInDemand(territory: Territory): Promise<JobMarket[]> {
  const data = await loadTrainingData();
  return data.jobs_market
    .filter((job) => job.territory === territory)
    .filter((job) => job.demand.shortage || job.demand.openPositions > 0)
    .sort((a, b) => b.demand.openPositions - a.demand.openPositions);
}

/**
 * Match jobs to user profile
 */
export async function matchJobsToUser(profile: UserProfile): Promise<JobMatch[]> {
  const data = await loadTrainingData();
  const jobs = await getJobsInDemand(profile.territory);
  const matches: JobMatch[] = [];

  for (const job of jobs) {
    const matchScore = calculateMatchScore(job, profile);
    if (matchScore < 30) continue; // Skip low matches

    const requiredTrainings = data.programs.filter((p) => job.requiredTraining.includes(p.id));

    if (requiredTrainings.length === 0) continue;

    const totalCost = requiredTrainings.reduce((sum, t) => sum + t.pricing.catalogPrice, 0);
    const fundingAvailable = calculateAvailableFunding(requiredTrainings, profile);
    const remainingCost = Math.max(0, totalCost - fundingAvailable);
    const timeToJob = calculateTimeToJob(requiredTrainings);
    const roi = calculateROI(requiredTrainings[0], job.salary.average);

    matches.push({
      job,
      matchScore,
      requiredTrainings,
      timeToJob,
      totalCost,
      fundingAvailable,
      remainingCost,
      roi,
    });
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate match score between job and user profile
 */
function calculateMatchScore(job: JobMarket, profile: UserProfile): number {
  let score = 50; // Base score

  // Check experience in related domain
  const hasExperience = profile.experience.some((exp) =>
    job.jobTitle.toLowerCase().includes(exp.domain.toLowerCase())
  );
  if (hasExperience) score += 20;

  // Check if job is in high demand
  if (job.demand.shortage) score += 15;
  if (job.demand.trend === 'increasing') score += 10;
  if (job.demand.trend === 'decreasing') score -= 10;

  // Check mobility for better opportunities
  if (profile.mobility) score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate available funding for trainings
 */
function calculateAvailableFunding(trainings: TrainingProgram[], profile: UserProfile): number {
  let funding = 0;

  for (const training of trainings) {
    // CPF
    if (training.pricing.cpfEligible && profile.cpfBalance) {
      funding += Math.min(profile.cpfBalance, training.pricing.catalogPrice);
    }

    // Pôle Emploi (estimate)
    if (training.pricing.poleEmploiEligible && profile.currentStatus === 'unemployed') {
      funding += Math.min(3000, training.pricing.catalogPrice * 0.5);
    }

    // Region aid (estimate)
    if (training.pricing.regionAidAvailable) {
      funding += Math.min(2000, training.pricing.catalogPrice * 0.4);
    }
  }

  return funding;
}

/**
 * Calculate time to complete trainings and get job
 */
function calculateTimeToJob(trainings: TrainingProgram[]): number {
  const totalWeeks = trainings.reduce((sum, t) => sum + t.details.durationWeeks, 0);
  return Math.ceil(totalWeeks / 4); // Convert weeks to months
}

/**
 * Calculate ROI for a training
 */
export function calculateROI(
  training: TrainingProgram,
  expectedSalary: number
): {
  monthsToBreakEven: number;
  gain5Years: number;
} {
  const trainingCost = training.pricing.catalogPrice;
  const monthlySalary = expectedSalary;

  // Assume current income is 0 or minimum (for unemployed)
  const monthlyGain = monthlySalary;

  const monthsToBreakEven = monthlyGain > 0 ? Math.ceil(trainingCost / monthlyGain) : 999;
  const gain5Years = monthlyGain * 60 - trainingCost; // 5 years = 60 months

  return {
    monthsToBreakEven,
    gain5Years,
  };
}

/**
 * Get top job opportunities with the best ROI
 */
export async function getTopJobOpportunitiesWithROI(
  territory: Territory,
  limit: number = 10
): Promise<JobMatch[]> {
  const data = await loadTrainingData();
  const jobs = await getJobsInDemand(territory);
  const opportunities: JobMatch[] = [];

  for (const job of jobs) {
    const requiredTrainings = data.programs.filter((p) => job.requiredTraining.includes(p.id));

    if (requiredTrainings.length === 0) continue;

    const totalCost = requiredTrainings.reduce((sum, t) => sum + t.pricing.catalogPrice, 0);
    const timeToJob = calculateTimeToJob(requiredTrainings);
    const roi = calculateROI(requiredTrainings[0], job.salary.average);

    opportunities.push({
      job,
      matchScore: job.demand.shortage ? 80 : 60,
      requiredTrainings,
      timeToJob,
      totalCost,
      fundingAvailable: 0,
      remainingCost: totalCost,
      roi,
    });
  }

  return opportunities
    .sort((a, b) => {
      // Prioritize high salary and low training cost
      const roiA = a.roi.gain5Years / a.totalCost;
      const roiB = b.roi.gain5Years / b.totalCost;
      return roiB - roiA;
    })
    .slice(0, limit);
}
