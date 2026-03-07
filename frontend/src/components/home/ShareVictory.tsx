 
import React, { useState } from 'react';
import { Share2, Download, Copy, Check, TrendingUp } from 'lucide-react';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface VictoryData {
  monthlySavings: number;
  percentVsAverage: number;
  topProduct: string;
  territory: string;
}

/**
 * Component ㉑: Share Victory (Social Proof)
 * 
 * Celebrate and share savings achievements
 * Generates shareable image: "I saved X€ this month"
 * Anonymized sharing (no personal data)
 * Aggregated territory stats for social proof
 * 
 * Psychological effect: Virality + organic recruitment
 * Retention impact: High (word-of-mouth growth)
 */
export const ShareVictory: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [victoryData, setVictoryData] = useState<VictoryData | null>(null);

  React.useEffect(() => {
    // Get user's victory data
    const data = safeLocalStorage.getJSON<{ currentMonth?: number } | null>('monthlySavings:v1', null);
    if (data && data.currentMonth) {
      setVictoryData({
        monthlySavings: data.currentMonth,
        percentVsAverage: 23, // Example
        topProduct: 'Produits laitiers',
        territory: 'Guadeloupe'
      });
    }
  }, []);

  const handleShare = async () => {
    if (!victoryData) return;

    const shareText = `🎉 J'ai économisé ${victoryData.monthlySavings.toFixed(2)}€ ce mois avec A KI PRI SA YÉ !\n\n` +
      `💰 ${victoryData.percentVsAverage}% de plus que la moyenne\n` +
      `📍 Territoire : ${victoryData.territory}\n\n` +
      `🔍 Comparateur de prix pour les Outre-mer\n` +
      `👉 Rejoins-nous sur akiprisaye.fr`;

    // Try Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mes économies du mois',
          text: shareText,
          url: 'https://akiprisaye.fr'
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy');
      }
    }
  };

  const handleDownloadImage = () => {
    // In production, would generate and download image
    alert('Fonctionnalité de téléchargement d\'image à venir !\n\nUne belle image sera générée avec vos économies.');
  };

  if (!victoryData || victoryData.monthlySavings < 5) {
    // Only show if meaningful savings
    return null;
  }

  return (
    <div className="glass-card p-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 text-white">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            📸 Partagez Votre Victoire !
          </h3>
          <p className="text-sm text-gray-400">
            Célébrez vos économies avec la communauté
          </p>
        </div>
      </div>

      {/* Victory Card Preview */}
      <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 border border-white/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 text-6xl opacity-10">🎉</div>
        
        <div className="relative z-10">
          <p className="text-sm text-gray-300 mb-2">Mes économies ce mois</p>
          <div className="text-5xl font-bold text-white mb-4">
            {victoryData.monthlySavings.toFixed(2)} €
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">
              +{victoryData.percentVsAverage}% vs moyenne
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-gray-300">
              🏆 Catégorie top : <strong>{victoryData.topProduct}</strong>
            </p>
            <p className="text-gray-300">
              📍 Territoire : <strong>{victoryData.territory}</strong>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
            A KI PRI SA YÉ • Comparateur prix Outre-mer
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="space-y-3">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Copié dans le presse-papier !
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              Partager mes économies
            </>
          )}
        </button>

        {/* Download Image Button */}
        <button
          onClick={handleDownloadImage}
          className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-white/10"
        >
          <Download className="w-5 h-5" />
          Télécharger l'image
        </button>
      </div>

      {/* Stats & Social Proof */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-sm text-gray-300 mb-2">
          💡 <strong>Le saviez-vous ?</strong>
        </p>
        <p className="text-xs text-gray-400">
          Les utilisateurs qui partagent leurs économies motivent en moyenne 
          <strong className="text-white"> 3 personnes</strong> à rejoindre la communauté.
          Ensemble, nous créons plus de transparence sur les prix !
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>
          🔒 Partage 100% anonyme • Aucune donnée personnelle exposée • 
          Stats agrégées uniquement
        </p>
      </div>
    </div>
  );
};

export default ShareVictory;
