import React from 'react';

export function BentoGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`grid gap-5 lg:grid-cols-12 lg:grid-rows-[minmax(220px,1fr)_minmax(220px,1fr)] lg:gap-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function BentoCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 sm:p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}
