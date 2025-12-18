import React from 'react'

export function CivicBadge({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
      {label}
    </span>
  )
}
