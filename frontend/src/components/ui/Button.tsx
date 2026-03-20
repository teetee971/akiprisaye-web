import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

const VARIANTS = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-white font-semibold',
  secondary: 'border border-white/20 bg-white/[0.06] hover:bg-white/10 text-white',
  ghost: 'hover:bg-white/[0.06] text-zinc-300',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
