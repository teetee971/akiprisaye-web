/**
 * Shimmer Component
 * 
 * Provides a shimmer loading effect for skeleton screens
 * Supports dark mode with appropriate color gradients
 */

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className = '' }: ShimmerProps) {
  return (
    <div 
      className={`animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 ${className}`}
      aria-hidden="true"
    />
  );
}
