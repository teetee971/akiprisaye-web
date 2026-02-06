// src/components/Sparkline.tsx
import React from 'react'

type SparklineProps = {
  data: number[]
  width?: number
  height?: number
  stroke?: string
}

export default function Sparkline({ data, width = 120, height = 30, stroke = '#0b5' }: SparklineProps) {
  if (!data || data.length === 0) return <svg width={width} height={height} />
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / Math.max(1, data.length - 1)
  const points = data
    .map((v, i) => {
      const x = +(i * step).toFixed(2)
      const y = +((height - ((v - min) / range) * height)).toFixed(2)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={stroke} strokeWidth={1.5} points={points} />
    </svg>
  )
}
