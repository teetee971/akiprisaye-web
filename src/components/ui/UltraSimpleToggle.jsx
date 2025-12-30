/**
 * UltraSimpleToggle - Civic Glass Design System
 * Ultra-simple toggle for accessibility mode and other binary options
 * WCAG AA compliant with clear visual feedback
 */
import React from 'react';
import { cn } from '@/lib/utils';

export function UltraSimpleToggle({ 
  checked = false,
  onChange,
  label,
  disabled = false,
  className = '',
  ...props 
}) {
  return (
    <label
      className={cn(
        'ultra-simple-toggle',
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-14 h-8 rounded-full transition-all duration-200',
            'peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-900',
            checked 
              ? 'bg-blue-600 border-2 border-blue-500' 
              : 'bg-white/[0.08] border-2 border-white/[0.22]',
          )}
        >
          <div
            className={cn(
              'absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-200',
              'shadow-md',
              checked 
                ? 'translate-x-6 bg-white' 
                : 'translate-x-0 bg-gray-400',
            )}
          />
        </div>
      </div>
      {label && (
        <span className="text-white text-sm font-medium select-none">
          {label}
        </span>
      )}
    </label>
  );
}

export default UltraSimpleToggle;
