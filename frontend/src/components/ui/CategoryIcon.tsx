/**
 * CategoryIcon
 * Small square with a real Unsplash product photo and gradient fallback.
 */

import { useState } from 'react';
import { getCategoryAsset } from '../../config/imageAssets';

interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };

export function CategoryIcon({ category, size = 'md', className = '' }: CategoryIconProps) {
  const asset = getCategoryAsset(category);
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClass = SIZE_MAP[size];

  return (
    <div className={`relative overflow-hidden rounded-lg flex-shrink-0 ${sizeClass} ${className}`}>
      {!imgFailed ? (
        <img
          src={asset.url}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${asset.gradient}`} />
      )}
      {/* Always apply a subtle overlay for text legibility */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
