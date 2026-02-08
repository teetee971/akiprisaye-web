/**
 * TrustBadge Component
 * 
 * Visual confidence display with color coding based on confidence score
 */

import React from 'react';

interface TrustBadgeProps {
  confidenceScore: number; // 0-100
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({
  confidenceScore,
  grade,
  size = 'md',
  showLabel = true,
}) => {
  // Determine color based on score
  const getColorClasses = (): string => {
    if (confidenceScore >= 85) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (confidenceScore >= 70) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (confidenceScore >= 55) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if (confidenceScore >= 40) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    } else {
      return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  // Get trust level text
  const getTrustLevel = (): string => {
    if (confidenceScore >= 85) return 'Excellent';
    if (confidenceScore >= 70) return 'Bon';
    if (confidenceScore >= 55) return 'Acceptable';
    if (confidenceScore >= 40) return 'Faible';
    return 'Non fiable';
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  // Grade display if provided
  const displayGrade = grade || getGradeFromScore(confidenceScore);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${getColorClasses()} ${
        sizeClasses[size]
      } font-medium`}
      role="status"
      aria-label={`Niveau de confiance: ${getTrustLevel()}`}
    >
      <span className="font-bold">{displayGrade}</span>
      <span className="opacity-75">|</span>
      <span>{Math.round(confidenceScore)}%</span>
      {showLabel && size !== 'sm' && (
        <>
          <span className="opacity-75">-</span>
          <span>{getTrustLevel()}</span>
        </>
      )}
    </div>
  );
};

/**
 * Helper function to get grade from score
 */
function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export default TrustBadge;
