import React from 'react'

export function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/10 p-4 shadow-lg">
      {children}
    </div>
  )
}
