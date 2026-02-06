/**
 * Camera Quality Analyzer - v1.0.0
 * 
 * Analyse en temps réel de la qualité de la caméra
 * Fournit des conseils pour améliorer les scans
 */

import React from 'react';

export interface CameraQuality {
  distance: 'too_close' | 'too_far' | 'perfect';
  lighting: 'too_dark' | 'too_bright' | 'perfect';
  sharpness: 'blurry' | 'sharp';
  overall: 'poor' | 'good' | 'excellent';
  score: number; // 0-100
}

export interface QualityTip {
  type: 'distance' | 'lighting' | 'sharpness' | 'stability';
  message: string;
  priority: 'critical' | 'helpful' | 'info';
  icon: string;
}

/**
 * Analyse la luminosité d'une image
 * @param imageData - ImageData du canvas
 * @returns Score de luminosité (0-255)
 */
export function analyzeBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  let count = 0;

  // Échantillonnage: analyse 1 pixel sur 10 pour performance
  for (let i = 0; i < data.length; i += 40) {
    // Luminosité = 0.299*R + 0.587*G + 0.114*B
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += brightness;
    count++;
  }

  return sum / count;
}

/**
 * Détecte le flou d'une image via variance laplacienne
 * @param imageData - ImageData du canvas
 * @returns Score de netteté (plus haut = plus net)
 */
export function analyzeSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let variance = 0;
  let count = 0;

  // Convertir en niveaux de gris et appliquer Laplacian
  for (let y = 1; y < height - 1; y += 5) {
    for (let x = 1; x < width - 1; x += 5) {
      const idx = (y * width + x) * 4;
      
      // Niveaux de gris
      const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Voisins (simplified Laplacian: détection de bords)
      const left = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
      const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const top = 0.299 * data[idx - width * 4] + 0.587 * data[idx - width * 4 + 1] + 0.114 * data[idx - width * 4 + 2];
      const bottom = 0.299 * data[idx + width * 4] + 0.587 * data[idx + width * 4 + 1] + 0.114 * data[idx + width * 4 + 2];
      
      const laplacian = Math.abs(4 * center - left - right - top - bottom);
      variance += laplacian * laplacian;
      count++;
    }
  }

  return Math.sqrt(variance / count);
}

/**
 * Analyse complète de la qualité caméra
 * @param videoElement - Élément vidéo de la caméra
 * @returns Objet CameraQuality avec analyse complète
 */
export function analyzeCameraQuality(videoElement: HTMLVideoElement): CameraQuality {
  // Créer canvas pour analyse
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      distance: 'too_far',
      lighting: 'too_dark',
      sharpness: 'blurry',
      overall: 'poor',
      score: 0,
    };
  }

  // Capturer frame actuel
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Analyses
  const brightness = analyzeBrightness(imageData);
  const sharpness = analyzeSharpness(imageData);

  // Évaluation luminosité
  let lighting: CameraQuality['lighting'] = 'perfect';
  if (brightness < 50) lighting = 'too_dark';
  else if (brightness > 200) lighting = 'too_bright';

  // Évaluation netteté (seuils empiriques)
  const sharpnessLevel: CameraQuality['sharpness'] = sharpness > 100 ? 'sharp' : 'blurry';

  // Évaluation distance (heuristique basée sur luminosité et netteté)
  let distance: CameraQuality['distance'] = 'perfect';
  if (brightness > 220 && sharpness < 80) distance = 'too_close';
  else if (brightness < 80 && sharpness < 60) distance = 'too_far';

  // Score global (0-100)
  let score = 0;
  
  // Luminosité contribue 40%
  if (lighting === 'perfect') score += 40;
  else if (brightness >= 70 && brightness <= 180) score += 30;
  else score += 10;
  
  // Netteté contribue 40%
  if (sharpness > 150) score += 40;
  else if (sharpness > 100) score += 30;
  else if (sharpness > 50) score += 15;
  
  // Distance contribue 20%
  if (distance === 'perfect') score += 20;
  else score += 10;

  // Évaluation globale
  let overall: CameraQuality['overall'] = 'poor';
  if (score >= 80) overall = 'excellent';
  else if (score >= 60) overall = 'good';

  return {
    distance,
    lighting,
    sharpness: sharpnessLevel,
    overall,
    score,
  };
}

/**
 * Génère des conseils basés sur l'analyse qualité
 * @param quality - Résultat de l'analyse qualité
 * @returns Liste de conseils priorisés
 */
export function generateQualityTips(quality: CameraQuality): QualityTip[] {
  const tips: QualityTip[] = [];

  // Conseils de luminosité (priorité haute)
  if (quality.lighting === 'too_dark') {
    tips.push({
      type: 'lighting',
      message: 'Plus de lumière nécessaire. Activez la torche ou déplacez-vous.',
      priority: 'critical',
      icon: '💡',
    });
  } else if (quality.lighting === 'too_bright') {
    tips.push({
      type: 'lighting',
      message: 'Trop de lumière. Évitez les reflets ou ajustez l\'angle.',
      priority: 'helpful',
      icon: '☀️',
    });
  }

  // Conseils de distance
  if (quality.distance === 'too_close') {
    tips.push({
      type: 'distance',
      message: 'Éloignez-vous de 10-15 cm pour un scan optimal.',
      priority: 'helpful',
      icon: '↔️',
    });
  } else if (quality.distance === 'too_far') {
    tips.push({
      type: 'distance',
      message: 'Rapprochez-vous de 10-15 cm du code-barres.',
      priority: 'critical',
      icon: '🔍',
    });
  }

  // Conseils de netteté
  if (quality.sharpness === 'blurry') {
    tips.push({
      type: 'sharpness',
      message: 'Stabilisez votre appareil ou utilisez un support.',
      priority: 'critical',
      icon: '🎯',
    });
  }

  // Conseil de succès
  if (quality.overall === 'excellent') {
    tips.push({
      type: 'stability',
      message: 'Position parfaite ! Maintenez pour scanner.',
      priority: 'info',
      icon: '✅',
    });
  }

  // Trier par priorité: critical > helpful > info
  return tips.sort((a, b) => {
    const priority = { critical: 0, helpful: 1, info: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

/**
 * Hook React pour utiliser l'analyseur de qualité
 * @param videoRef - Référence au élément vidéo
 * @param interval - Intervalle d'analyse en ms (défaut: 1000ms)
 */
export function useCameraQualityAnalyzer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  interval: number = 1000
): {
  quality: CameraQuality | null;
  tips: QualityTip[];
  isAnalyzing: boolean;
} {
  const [quality, setQuality] = React.useState<CameraQuality | null>(null);
  const [tips, setTips] = React.useState<QualityTip[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    const intervalId = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const newQuality = analyzeCameraQuality(videoRef.current);
        setQuality(newQuality);
        setTips(generateQualityTips(newQuality));
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
      setIsAnalyzing(false);
    };
  }, [videoRef, interval]);

  return { quality, tips, isAnalyzing };
}
