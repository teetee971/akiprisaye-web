/**
 * GlassCard - Civic Glass Design System
 * Card component for data display with glassmorphism
 * Includes optional header and footer sections
 */
import React from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({ 
  children, 
  title,
  footer,
  className = '',
  ...props 
}) {
  return (
    <div
      className={cn(
        'glass-card',
        'bg-white/[0.08] backdrop-blur-[14px]',
        'border border-white/[0.22]',
        'rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
        'overflow-hidden',
        className,
      )}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-white/[0.22]">
          <h3 className="text-lg font-semibold text-white/90">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-white/[0.22] bg-white/[0.03]">
          {footer}
        </div>
      )}
    </div>
  );
}

export default GlassCard;
