/**
 * FlipStatCard
 *
 * A 3D flip card that shows a stat on the front and context on the back.
 * Flips on hover/focus (CSS) or on Enter/Space keypress (JS).
 * Pure CSS 3D — no JS required for the mouse interaction.
 */
import { useCallback, type ReactNode } from 'react';

interface FlipStatCardProps {
  value: string;
  label: string;
  backContent: ReactNode;
  /** Accepts either an emoji string or a Lucide icon element. */
  icon?: ReactNode;
  className?: string;
}

export default function FlipStatCard({
  value,
  label,
  backContent,
  icon,
  className = '',
}: FlipStatCardProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Toggle a CSS class that forces the flip (same as :focus-within)
      const inner = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('.flip-card-inner');
      if (inner) {
        inner.classList.toggle('flip-card-inner--flipped');
      }
    }
  }, []);

  return (
    <div
      className={`flip-card ${className}`}
      tabIndex={0}
      role="button"
      aria-label={`${label} : ${value}. Appuyez pour voir les détails.`}
      onKeyDown={handleKeyDown}
    >
      <div className="flip-card-inner">
        {/* Front */}
        <div className="flip-card-front">
          {icon && <span className="mb-1 flex justify-center" aria-hidden="true">{icon}</span>}
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
