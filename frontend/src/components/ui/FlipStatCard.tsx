/**
 * FlipStatCard
 *
 * A 3D flip card that shows a stat on the front and context on the back.
 * Flips on hover/focus. Pure CSS 3D — no JS required.
 */
import type { ReactNode } from 'react';

interface FlipStatCardProps {
  value: string;
  label: string;
  backContent: ReactNode;
  icon?: string;
  className?: string;
}

export default function FlipStatCard({
  value,
  label,
  backContent,
  icon,
  className = '',
}: FlipStatCardProps) {
  return (
    <div className={`flip-card ${className}`} tabIndex={0} aria-label={`${label} : ${value}`}>
      <div className="flip-card-inner">
        {/* Front */}
        <div className="flip-card-front">
          {icon && <span className="text-2xl mb-1" aria-hidden="true">{icon}</span>}
          <div className="flip-card-value">{value}</div>
          <div className="flip-card-label">{label}</div>
        </div>
        {/* Back */}
        <div className="flip-card-back" aria-hidden="true">
          <div className="flip-card-back-text">{backContent}</div>
        </div>
      </div>
    </div>
  );
}
