import React from 'react'

export function GlassContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-xl">
      {children}
    </div>
  )
}
