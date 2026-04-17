/**
 * LimitNote - Civic Glass Design System
 * Display note for data limitations
 * MANDATORY: Explain data limits for transparency
 */
import { cn } from '@/lib/utils';

export function LimitNote({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'limit-note',
        'p-4 rounded-lg',
        'bg-yellow-600/10 border border-yellow-500/30',
        'text-yellow-200 text-sm',
        className
      )}
      role="note"
      aria-label="Limitation des données"
      {...props}
    >
      <div className="flex items-start gap-2">
        <span className="text-yellow-400 font-bold flex-shrink-0" aria-hidden="true">
          ⚠
        </span>
        <div className="flex-1">
          <strong className="text-yellow-300">Limite : </strong>
          {children}
        </div>
      </div>
    </div>
  );
}

export default LimitNote;
