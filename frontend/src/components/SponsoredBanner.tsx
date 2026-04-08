/**
 * SponsoredBanner — Bannière sponsorisée (Hero / Sidebar)
 *
 * Affiche une bannière sponsorisée avec tracking des impressions et clics.
 * Badge "Sponsorisé" visible et click tracking automatique.
 */
import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

export type BannerType = 'hero' | 'sidebar';

export interface SponsoredBannerProps {
  sponsor: string;
  imageUrl?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  targetUrl: string;
  type: BannerType;
  slotId?: string;
  /** Called when the banner is clicked (for external tracking) */
  onClickTracked?: (slotId: string) => void;
}

export function SponsoredBanner({
  sponsor,
  imageUrl,
  title,
  description,
  ctaLabel = 'En savoir plus',
  targetUrl,
  type,
  slotId = 'unknown',
  onClickTracked,
}: SponsoredBannerProps) {
  const lastTrackedSlotId = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedSlotId.current !== slotId) {
      // Track impression (in production: POST /api/sponsorship/track/impression)
      lastTrackedSlotId.current = slotId;
    }
  }, [slotId]);

  const handleClick = () => {
    // Track click (in production: POST /api/sponsorship/track/click)
    onClickTracked?.(slotId);
  };

  if (type === 'hero') {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700 border border-white/10">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Sponsorisé par ${sponsor}`}
            className="w-full h-40 md:h-56 object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs bg-black/50 text-white/70 px-2 py-0.5 rounded-full border border-white/10">
              Sponsorisé · {sponsor}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            {description && <p className="text-sm text-white/80 mb-3">{description}</p>}
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 bg-white text-slate-900 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              {ctaLabel}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-gray-500 mb-2">Sponsorisé</div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Sponsorisé par ${sponsor}`}
          className="w-full h-20 object-cover rounded mb-2 opacity-80"
        />
      )}
      <div className="text-sm font-medium text-white mb-1">{title}</div>
      {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
      <div className="text-xs text-gray-500 mb-2">{sponsor}</div>
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleClick}
        className="block text-center text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded py-1.5 hover:bg-emerald-500/30 transition-colors"
      >
        {ctaLabel} →
      </a>
    </div>
  );
}
