import React from 'react'
import { CivicSource } from "../../types/civic"

export function SourceFooter({ source }: { source: CivicSource }) {
  return (
    <div className="text-xs text-gray-400 mt-2">
      Source officielle :{" "}
      <a href={source.url} target="_blank" rel="noreferrer" className="underline">
        {source.name}
      </a>
    </div>
  )
}
