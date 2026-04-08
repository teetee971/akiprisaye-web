/**
 * AffiliateWidget — Widget d'affiliation compact
 *
 * Affiche un lien d'affiliation tracké pour les pages produits et comparateurs.
 * Supporte le tracking UTM et le cookie d'affiliation (30 jours).
 */
import { Link, ExternalLink, Tag } from 'lucide-react';

export interface AffiliateWidgetProps {
  storeName: string;
  price?: number;
  savings?: number;
  url: string;
  referralCode?: string;
  affiliateId?: string;
  compact?: boolean;
  label?: string;
}

function buildAffiliateUrl(url: string, referralCode?: string, affiliateId?: string): string {
  try {
    const parsed = new URL(url);
    if (referralCode) {
      parsed.searchParams.set('ref', referralCode);
    }
    if (affiliateId) {
      parsed.searchParams.set('aff', affiliateId);
    }
    parsed.searchParams.set('utm_source', 'akiprisaye');
    parsed.searchParams.set('utm_medium', 'affiliate');
    return parsed.toString();
  } catch {
    return url;
  }
}

export function AffiliateWidget({
  storeName,
  price,
  savings,
  url,
  referralCode,
  affiliateId,
  compact = false,
  label = 'Voir l\'offre',
}: AffiliateWidgetProps) {
  const trackedUrl = buildAffiliateUrl(url, referralCode, affiliateId);

  if (compact) {
    return (
      <a
        href={trackedUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Tag className="w-3.5 h-3.5" />
        {storeName}
        {price !== undefined && <span className="font-bold">— {price.toFixed(2)}€</span>}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-white">Lien Partenaire</span>
        <span className="ml-auto text-xs text-gray-500">Suivi technique actif</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-base font-bold text-white">{storeName}</div>
          {price !== undefined && (
            <div className="text-xl font-bold text-emerald-400">{price.toFixed(2)}€</div>
          )}
          {savings !== undefined && savings > 0 && (
            <div className="text-sm text-emerald-300">Économie : {savings.toFixed(2)}€</div>
          )}
        </div>
      </div>
      <a
        href={trackedUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="block w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
      >
        {label}
        <ExternalLink className="w-3.5 h-3.5 inline ml-1.5" />
      </a>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Lien partenaire — peut générer une commission
      </p>
    </div>
  );
}
