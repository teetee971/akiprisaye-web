/**
 * Statistical utility functions for price comparison
 */

/**
 * Calculate average of an array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate variance of an array of numbers
 */
export function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => Math.pow(n - avg, 2));

  return average(squaredDiffs);
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function calculateStdDev(numbers: number[]): number {
  return Math.sqrt(calculateVariance(numbers));
}
