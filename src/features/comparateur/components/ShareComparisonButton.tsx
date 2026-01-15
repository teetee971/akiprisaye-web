import { useState } from 'react';
import { useShare, ComparisonData } from '../hooks/useShare';
import { toast } from '../utils/toast';

interface ShareComparisonButtonProps {
  comparisonData: ComparisonData;
  productName: string;
}

export function ShareComparisonButton({ comparisonData, productName }: ShareComparisonButtonProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const { generateShareUrl } = useShare();

  const handleShare = async () => {
    // Generate shareable URL with encoded comparison data
    const url = generateShareUrl(comparisonData);
    setShareUrl(url);
    setShowUrl(true);

    // Try native share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comparaison: ${productName}`,
          text: 'Découvrez cette comparaison de prix',
          url: url
        });
        setShowUrl(false);
        return;
      } catch (err) {
        // User cancelled or fallback to copy
        console.log('Native share cancelled or unavailable');
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier!');
      
      setTimeout(() => {
        setCopied(false);
        setShowUrl(false);
      }, 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  return (
    <div className="space-y-2">
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
      >
        {copied ? '✓ Copié!' : '🔗 Partager'}
      </button>
      
      {showUrl && shareUrl && (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <label className="text-xs text-gray-400 mb-1 block">
            Lien de partage:
          </label>
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full bg-slate-900 text-white text-sm px-3 py-2 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}
    </div>
  );
}
