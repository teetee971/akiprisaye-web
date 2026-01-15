import React from 'react';
import { Share2, Facebook, Twitter, Link2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  description: string;
  url?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ title, description, url }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const shareUrl = url || window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'native') => {
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
    setShowMenu(false);
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        aria-label="Partager la comparaison"
      >
        <Share2 className="w-4 h-4" />
        Partager
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          ></div>

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {hasNativeShare && (
              <button
                onClick={() => handleShare('native')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-200">Partager...</span>
              </button>
            )}

            <button
              onClick={() => handleShare('twitter')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
            >
              <Twitter className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-200">Twitter</span>
            </button>

            <button
              onClick={() => handleShare('facebook')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
            >
              <Facebook className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-200">Facebook</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Lien copié!</span>
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
