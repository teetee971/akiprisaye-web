import React, { useEffect, useState } from 'react';
import { getProductImageUrl } from '../../services/alertProductImageService';

interface AlertProductImageProps {
  ean?: string;
  category?: string;
  alt: string;
  size?: number;
  className?: string;
}

const DEFAULT_PLACEHOLDER = '/assets/placeholders/placeholder-default.svg';

export default function AlertProductImage({
  ean = '',
  category,
  alt,
  size = 56,
  className = '',
}: AlertProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_PLACEHOLDER);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setImageUrl(DEFAULT_PLACEHOLDER);
    setIsUnavailable(false);
    setIsLoading(true);

    getProductImageUrl(ean, category)
      .then((result) => {
        if (!isMounted) return;

        if (typeof result.url === 'string' && /^https?:\/\//i.test(result.url)) {
          setImageUrl(result.url);
          setIsUnavailable(false);
        } else {
          setImageUrl(DEFAULT_PLACEHOLDER);
          setIsUnavailable(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setImageUrl(DEFAULT_PLACEHOLDER);
        setIsUnavailable(true);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ean, category]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-800 border border-slate-700 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {isLoading && <div className="absolute inset-0 animate-pulse bg-slate-700/70" />}
      <img
        key={ean || 'no-ean'}
        src={imageUrl}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={(event) => {
          if (event.currentTarget.src.includes('/assets/placeholders/placeholder-default.svg')) {
            return;
          }

          console.warn('[AlertProductImage] fallback to placeholder', { ean, attemptedSrc: event.currentTarget.src });
          setImageUrl(DEFAULT_PLACEHOLDER);
          setIsUnavailable(true);
        }}
      />
      {isUnavailable && (
        <span className="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-[10px] text-slate-200 text-center py-0.5">
          indisponible
        </span>
      )}
    </div>
  );
}
