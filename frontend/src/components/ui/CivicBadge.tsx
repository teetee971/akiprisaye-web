interface CivicBadgeProps {
  category: 'PRIX' | 'POLITIQUE' | 'ALERTE' | 'INNOVATION';
  className?: string;
}

const CATEGORY_STYLES = {
  PRIX: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50',
  POLITIQUE: 'bg-violet-900/60 text-violet-200 border-violet-700/50',
  ALERTE: 'bg-rose-900/60 text-rose-200 border-rose-700/50',
  INNOVATION: 'bg-sky-900/60 text-sky-200 border-sky-700/50',
} as const;

export default function CivicBadge({ category, className }: CivicBadgeProps) {
  const styles = `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border backdrop-blur-sm ${CATEGORY_STYLES[category]} ${className || ''}`;

  return <span className={styles}>{category}</span>;
}
