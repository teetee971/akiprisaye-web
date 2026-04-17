/**
 * TerritoryCard
 * A card with a real territory photo background, flag, label, and slot for stats.
 */

import { useState } from 'react';
import { getTerritoryAsset, getTerritoryGradient } from '../../config/imageAssets';

interface TerritoryCardProps {
  code: string;
  label: string;
  flag: string;
  children?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function TerritoryCard({
  code,
  label,
  flag,
  children,
  onClick,
  selected = false,
  className = '',
}: TerritoryCardProps) {
  const asset = getTerritoryAsset(code);
  const gradient = getTerritoryGradient(code);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-200
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'}
        ${className}`}
    >
      {/* Background image */}
      {!imgFailed && (
        <img
          src={asset.url}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} ${imgFailed ? 'opacity-100' : 'opacity-75'}`}
      />

      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl drop-shadow">{flag}</span>
          <span className="font-semibold text-white drop-shadow text-sm">{label}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
