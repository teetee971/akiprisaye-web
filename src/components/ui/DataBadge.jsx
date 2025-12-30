/**
 * DataBadge - Civic Glass Design System
 * Display badge for data source and date
 * MANDATORY: Show source and date for all data
 */
import React from 'react';
import { cn } from '@/lib/utils';

export function DataBadge({ 
  source,
  date,
  className = '',
  ...props 
}) {
  return (
    <div
      className={cn(
        'data-badge',
        'inline-flex items-center gap-2 px-3 py-1.5',
        'bg-blue-600/10 border border-blue-500/30',
        'rounded-lg text-xs font-mono',
        'text-blue-200',
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-1">
        <span className="text-blue-400 font-semibold">Source:</span>
        <span>{source}</span>
      </span>
      {date && (
        <>
          <span className="text-blue-500/50">•</span>
          <span className="flex items-center gap-1">
            <span className="text-blue-400 font-semibold">Date:</span>
            <span>{date}</span>
          </span>
        </>
      )}
    </div>
  );
}

export default DataBadge;
