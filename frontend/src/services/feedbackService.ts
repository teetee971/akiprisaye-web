 
 
/**
 * Haptic Feedback Service - v1.0.0
 * 
 * Gère les retours haptiques (vibrations) et audio pour les scans
 * Améliore l'expérience utilisateur avec des feedbacks sensoriels
 */

import React from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

/**
 * Patterns de vibration prédéfinis
 */
export const HAPTIC_PATTERNS = {
  // Vibration courte pour détection
  detection: [50] as number[],
  
  // Double vibration pour succès
  success: [100, 50, 50] as number[],
  
  // Vibration longue pour erreur
  error: [200] as number[],
  
  // Vibration légère pour feedback général
  light: [25] as number[],
  
  // Vibration moyenne
  medium: [50] as number[],
  
  // Vibration forte
  strong: [100] as number[],
} as const;

/**
 * Types de sons disponibles
 */
export type SoundType = 'beep' | 'success' | 'error' | 'click';

/**
 * Configuration du feedback sensoriel
 */
export interface FeedbackConfig {
  hapticEnabled: boolean;
  audioEnabled: boolean;
  volume: number; // 0-1
}

/**
 * Classe pour gérer les feedbacks sensoriels
 */
class FeedbackService {
  private config: FeedbackConfig;
  private audioContext: AudioContext | null = null;
  
  constructor() {
    // Charger config depuis safeLocalStorage ou utiliser valeurs par défaut
    this.config = safeLocalStorage.getJSON<FeedbackConfig>('feedbackConfig', {
      hapticEnabled: true,
      audioEnabled: true,
      volume: 0.5,
    });
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...config };
    safeLocalStorage.setJSON('feedbackConfig', this.config);
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): FeedbackConfig {
    return { ...this.config };
  }

  /**
   * Vérifie si le navigateur supporte les vibrations
   */
  private hasVibrationSupport(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Déclenche une vibration haptique
   * @param pattern - Pattern de vibration ou nom de pattern prédéfini
   */
  vibrate(pattern: number[] | keyof typeof HAPTIC_PATTERNS): void {
    if (!this.config.hapticEnabled) return;
    if (!this.hasVibrationSupport()) {
      if (import.meta.env.DEV) {
        console.log('[Haptic] Vibration not supported');
      }
      return;
    }

    const vibrationPattern = typeof pattern === 'string' ? HAPTIC_PATTERNS[pattern] : pattern;
    
    try {
      navigator.vibrate(vibrationPattern);
      if (import.meta.env.DEV) {
        console.log('[Haptic] Vibration triggered:', vibrationPattern);
      }
    } catch (error) {
      console.error('[Haptic] Vibration error:', error);
    }
  }

  /**
   * Initialise l'AudioContext (nécessaire pour jouer des sons)
   */
  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Joue un son de type "beep" (scanner classique)
   * @param frequency - Fréquence en Hz (défaut: 1000Hz)
   * @param duration - Durée en ms (défaut: 100ms)
   */
  playBeep(frequency: number = 1000, duration: number = 100): void {
    if (!this.config.audioEnabled) return;
    
    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'square'; // Son de type scanner

      // Envelope ADSR simple
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.config.volume, now + 0.01); // Attack
      gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // Release

      oscillator.start(now);
      oscillator.stop(now + duration / 1000);

      if (import.meta.env.DEV) {
        console.log('[Audio] Beep played:', frequency, 'Hz');
      }
    } catch (error) {
      console.error('[Audio] Beep error:', error);
    }
  }

  /**
   * Joue un son de succès (double beep ascendant)
   */
  playSuccess(): void {
    if (!this.config.audioEnabled) return;
    
    this.playBeep(800, 80);
    setTimeout(() => this.playBeep(1200, 120), 100);
  }

  /**
   * Joue un son d'erreur (beep descendant)
   */
  playError(): void {
    if (!this.config.audioEnabled) return;
    
    this.playBeep(400, 200);
  }

  /**
   * Joue un son de clic (feedback léger)
   */
  playClick(): void {
    if (!this.config.audioEnabled) return;
    
    this.playBeep(600, 30);
  }

  /**
   * Feedback complet pour détection de code-barres
   */
  onDetection(): void {
    this.vibrate('detection');
    this.playBeep();
  }

  /**
   * Feedback complet pour succès de scan
   */
  onSuccess(): void {
    this.vibrate('success');
    this.playSuccess();
  }

  /**
   * Feedback complet pour erreur de scan
   */
  onError(): void {
    this.vibrate('error');
    this.playError();
  }

  /**
   * Feedback pour interaction générale (bouton, etc.)
   */
  onClick(): void {
    this.vibrate('light');
    this.playClick();
  }

  /**
   * Arrête toutes les vibrations en cours
   */
  stopVibration(): void {
    if (this.hasVibrationSupport()) {
      navigator.vibrate(0);
    }
  }

  /**
   * Nettoie les ressources audio
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Instance singleton
export const feedbackService = new FeedbackService();

/**
 * Hook React pour utiliser le service de feedback
 */
export function useFeedback() {
  const [config, setConfig] = React.useState<FeedbackConfig>(feedbackService.getConfig());

  const updateConfig = React.useCallback((newConfig: Partial<FeedbackConfig>) => {
    feedbackService.updateConfig(newConfig);
    setConfig(feedbackService.getConfig());
  }, []);

  React.useEffect(() => {
    // Cleanup au démontage
    return () => {
      feedbackService.stopVibration();
    };
  }, []);

  return {
    config,
    updateConfig,
    vibrate: feedbackService.vibrate.bind(feedbackService),
    playBeep: feedbackService.playBeep.bind(feedbackService),
    playSuccess: feedbackService.playSuccess.bind(feedbackService),
    playError: feedbackService.playError.bind(feedbackService),
    playClick: feedbackService.playClick.bind(feedbackService),
    onDetection: feedbackService.onDetection.bind(feedbackService),
    onSuccess: feedbackService.onSuccess.bind(feedbackService),
    onError: feedbackService.onError.bind(feedbackService),
    onClick: feedbackService.onClick.bind(feedbackService),
  };
}
