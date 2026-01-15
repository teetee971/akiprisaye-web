/**
 * TikTok Share Component
 * Share price differential between DOM and Hexagone to social media
 */

import { useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';

interface PriceDifferential {
  productName: string;
  priceDom: number;
  priceMetropole: number;
  territory: string;
  percentageDiff: number;
}

interface ShareTikTokProps {
  differential: PriceDifferential;
}

export function ShareTikTok({ differential }: ShareTikTokProps) {
  const [copied, setCopied] = useState(false);

  const generateShareText = (): string => {
    const emoji = differential.percentageDiff > 30 ? '😱' : differential.percentageDiff > 20 ? '😮' : '😐';
    return `${emoji} Prix ${differential.productName} en ${differential.territory}:
${differential.priceDom.toFixed(2)}€ 
vs Métropole: ${differential.priceMetropole.toFixed(2)}€
Soit +${differential.percentageDiff.toFixed(1)}% plus cher!
#VieChère #Outremer #${differential.territory} #AkiPriSaYe`;
  };

  const generateShareImage = (): string => {
    // Create a canvas to generate the image
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Product name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(differential.productName, canvas.width / 2, 200);

    // DOM Price
    ctx.font = 'bold 48px Arial';
    ctx.fillText(differential.territory, canvas.width / 2, 400);
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${differential.priceDom.toFixed(2)}€`, canvas.width / 2, 550);

    // VS
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('VS', canvas.width / 2, 700);

    // Métropole Price
    ctx.font = 'bold 48px Arial';
    ctx.fillText('Métropole', canvas.width / 2, 850);
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${differential.priceMetropole.toFixed(2)}€`, canvas.width / 2, 1000);

    // Differential
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = differential.percentageDiff > 30 ? '#ef4444' : '#f59e0b';
    ctx.fillText(`+${differential.percentageDiff.toFixed(1)}%`, canvas.width / 2, 1200);
    ctx.font = '48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PLUS CHER', canvas.width / 2, 1280);

    // Footer
    ctx.font = 'bold 40px Arial';
    ctx.fillText('A KI PRI SA YÉ', canvas.width / 2, 1600);
    ctx.font = '32px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Comparateur de prix Outre-mer', canvas.width / 2, 1670);

    return canvas.toDataURL('image/png');
  };

  const handleDownloadImage = () => {
    const imageUrl = generateShareImage();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `akiprisaye-${differential.productName.replace(/\s/g, '-')}.png`;
    link.click();
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleShareNative = async () => {
    const text = generateShareText();
    const imageUrl = generateShareImage();

    try {
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'akiprisaye-share.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'Prix comparés DOM-Métropole',
          text: text,
          files: [file]
        });
      } else {
        // Fallback: just copy text
        await handleCopyText();
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
        <Share2 className="w-6 h-6" />
        Partager sur TikTok / Réseaux Sociaux
      </h3>

      {/* Preview */}
      <div className="mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-6 text-white text-center">
        <div className="text-lg font-semibold mb-2">{differential.productName}</div>
        <div className="grid grid-cols-2 gap-4 my-4">
          <div>
            <div className="text-sm opacity-80">{differential.territory}</div>
            <div className="text-3xl font-bold text-yellow-300">
              {differential.priceDom.toFixed(2)}€
            </div>
          </div>
          <div>
            <div className="text-sm opacity-80">Métropole</div>
            <div className="text-3xl font-bold text-green-300">
              {differential.priceMetropole.toFixed(2)}€
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold text-red-300">
          +{differential.percentageDiff.toFixed(1)}% PLUS CHER
        </div>
      </div>

      {/* Text to Share */}
      <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Texte à partager:
        </div>
        <div className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
          {generateShareText()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleShareNative}
          className="flex flex-col items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-xs">Partager</span>
        </button>
        
        <button
          onClick={handleDownloadImage}
          className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs">Image</span>
        </button>
        
        <button
          onClick={handleCopyText}
          className="flex flex-col items-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          <span className="text-xs">{copied ? 'Copié!' : 'Copier'}</span>
        </button>
      </div>

      <p className="mt-4 text-xs text-center text-slate-600 dark:text-slate-400">
        Partagez pour sensibiliser sur le différentiel de prix Outre-mer
      </p>
    </div>
  );
}
