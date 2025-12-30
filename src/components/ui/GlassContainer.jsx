/**
 * GlassContainer - Civic Glass Design System
 * Glassmorphism container with ≤12% opacity
 * Dark mode default, institutional look
 */
import React from 'react';
import { cn } from '@/lib/utils';

export function GlassContainer({ 
  children, 
  className = '',
  as: Component = 'div',
  ...props 
}) {
  return (
    <Component
      className={cn(
        'glass-container',
        'bg-white/[0.08] backdrop-blur-[14px]',
        'border border-white/[0.22]',
        'rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
        'transition-all duration-300',
        'hover:bg-white/[0.12] hover:border-blue-500/40',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default GlassContainer;
