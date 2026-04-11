import { useEffect, useState } from 'react';
import { getProductImageUrl } from '../../services/alertProductImageService';

interface AlertProductImageProps {
  ean?: string;
  category?: string;
  alt: string;
  size?: number;
  className?: string;
}

export default function AlertProductImage({
  ean = '',
  category,
  alt,
  size = 56,
  className = '',
}: AlertProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setImageUrl(null);

    getProductImageUrl(ean, category)
      .then((result) => {
        if (isMounted) {
          setImageUrl(result.url ?? null);
        }
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
      {imageUrl && (
        <img
          key={`${ean || 'no-ean'}-${category || 'no-category'}`}
          src={imageUrl}
          alt={alt}
          loading="lazy"
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
