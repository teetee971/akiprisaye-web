import React from 'react'
import { CivicNewsItem } from "../types/civic"
import { GlassCard } from "../components/ui/GlassCard"
import { CivicBadge } from "../components/ui/CivicBadge"
import { SourceFooter } from "../components/ui/SourceFooter"

export function News({ items }: { items: CivicNewsItem[] }) {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <GlassCard key={item.id}>
          <CivicBadge label={item.category} />
          <h3 className="text-lg font-semibold mt-2 text-white">{item.title}</h3>
          <p className="text-sm text-gray-300">{item.summary}</p>
          <SourceFooter source={item.source} />
        </GlassCard>
      ))}
    </div>
  )
}

export default News
