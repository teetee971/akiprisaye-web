/**
 * SponsoredSearchResult — Résultat de recherche sponsorisé
 *
 * Affiché dans les résultats de recherche de produits.
 * Badge "Sponsorisé" visible, lien affilié ou partenaire.
 */
import { ExternalLink, Star } from 'lucide-react';

export interface SponsoredSearchResultProps {
  sponsor: string;
  productName: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  discount?: string;
  imageUrl?: string;
  targetUrl: string;
  store?: string;
  rating?: number;
  slotId?: string;
  onClickTracked?: (slotId: string) => void;
}

export function SponsoredSearchResult({
  sponsor,
  productName,
  description,
  price,
  originalPrice,
  discount,
  imageUrl,
  targetUrl,
  store,
  rating,
  slotId = 'unknown',
  onClickTracked,
}: SponsoredSearchResultProps) {
  const handleClick = () => {
    // Track click (in production: POST /api/sponsorship/track/click)
    onClickTracked?.(slotId);
  };

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={productName}
          className="w-14 h-14 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            Sponsorisé
          </span>
          {store && <span className="text-xs text-gray-500">{store}</span>}
        </div>
        <div className="text-sm font-medium text-white truncate">{productName}</div>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {price !== undefined && (
            <span className="text-sm font-bold text-white">{price.toFixed(2)}€</span>
          )}
          {originalPrice !== undefined && originalPrice > (price ?? 0) && (
            <span className="text-xs text-gray-500 line-through">{originalPrice.toFixed(2)}€</span>
          )}
          {discount && (
            <span className="text-xs text-emerald-400 font-medium">{discount}</span>
          )}
          {rating !== undefined && (
            <span className="text-xs text-amber-400 flex items-center gap-0.5 ml-auto">
              <Star className="w-3 h-3 fill-current" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleClick}
        className="shrink-0 self-center p-1.5 text-amber-400 hover:text-amber-300 transition-colors"
        aria-label={`Voir ${productName} chez ${sponsor}`}
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
