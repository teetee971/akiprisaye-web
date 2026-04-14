import React, { useRef, useEffect } from 'react';
import { Share2, Facebook, Twitter, Link2, Check, MessageCircle } from 'lucide-react';
import { trackEvent } from '../../utils/eventTracker';

interface ShareButtonProps {
  title: string;
  description: string;
  url?: string;
  /** Optional product/page identifier for analytics */
  productId?: string;
  /** Visual variant — defaults to 'default' */
  variant?: 'default' | 'compact' | 'inline';
}

/** Build a WhatsApp share URL from text + link */
function buildWhatsAppUrl(text: string, link: string): string {
  const message = `${text}\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  description,
  url,
  productId,
  variant = 'default',
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '/');

  /** Close menu on outside click */
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const track = (channel: string) => {
    trackEvent('share', { product: productId ?? shareUrl, channel });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail if clipboard is unavailable
    }
    setShowMenu(false);
  };

  type Platform = 'whatsapp' | 'twitter' | 'facebook' | 'native';

  const handleShare = async (platform: Platform) => {
    track(platform);

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title, text: description, url: shareUrl });
      } catch {
        // User cancelled or browser blocked
      }
    } else if (platform === 'whatsapp') {
      window.open(buildWhatsAppUrl(`${title} — ${description}`, shareUrl), '_blank', 'noopener,noreferrer');
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer',
      );
    } else if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }

    setShowMenu(false);
  };

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const triggerClasses =
    variant === 'compact'
      ? 'p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors'
      : variant === 'inline'
        ? 'flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors'
        : 'flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenu((v) => !v)}
        className={triggerClasses}
        aria-label="Partager"
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        <Share2 className="w-4 h-4" />
        {variant !== 'compact' && <span>Partager</span>}
      </button>

      {showMenu && (
        <>
          {/* Backdrop for mobile tap-outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            role="menu"
            aria-label="Options de partage"
            className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden"
          >
            {/* WhatsApp — first because it's the dominant channel in DOM-TOM */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleShare('whatsapp')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
            >
              {/* WhatsApp green icon (lucide doesn't have one; MessageCircle is close enough) */}
              <MessageCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-200">WhatsApp</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleShare('facebook')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
            >
              <Facebook className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-200">Facebook</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleShare('twitter')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span className="text-sm text-gray-200">X / Twitter</span>
            </button>

            {hasNativeShare && (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleShare('native')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-200">Partager via…</span>
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left border-t border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Lien copié !</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-200">Copier le lien</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
