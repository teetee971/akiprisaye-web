/**
 * CivicButton - Civic Glass Design System
 * Button component with glassmorphism and civic design
 * Variants: primary, secondary, ghost, danger
 */
import React from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500',
  secondary: 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.22] hover:border-blue-500/40',
  ghost: 'hover:bg-white/[0.08] text-white border border-transparent hover:border-white/[0.22]',
  danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function CivicButton({ 
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props 
}) {
  return (
    <button
      className={cn(
        'civic-button',
        'inline-flex items-center justify-center',
        'font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default CivicButton;
