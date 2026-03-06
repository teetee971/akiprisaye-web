/**
 * HeroImage
 * Full-width hero banner with a real Unsplash photo and a dark gradient overlay.
 * Falls back gracefully to a CSS gradient if the image fails to load.
 * Shows a shimmer skeleton while the image is loading.
 */

import { useState } from 'react';

interface HeroImageProps {
  src: string;
  alt: string;
  gradient?: string; // tailwind gradient classes e.g. "from-blue-900 to-slate-900"
  height?: string;   // tailwind height class e.g. "h-56"
  children?: React.ReactNode;
  className?: string;
}

export function HeroImage({
  src,
  alt,
  gradient = 'from-slate-900 to-slate-800',
  height = 'h-56 sm:h-72',
  children,
  className = '',
}: HeroImageProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ${height} ${className}`}>
      {/* Shimmer skeleton while image loads */}
      {!imgLoaded && !imgFailed && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} shimmer-bg`} />
      )}

      {/* Background image */}
      {!imgFailed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Gradient overlay — always shown, darker when image fails */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
          imgFailed ? 'opacity-100' : 'opacity-70'
        }`}
      />

      {/* Content */}
      {children && (
        <div className="relative z-10 flex h-full flex-col justify-end p-6">
          {children}
        </div>
      )}
    </div>
  );
}
