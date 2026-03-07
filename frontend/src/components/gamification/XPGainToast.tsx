 
/**
 * XPGainToast Component
 * Toast notification for XP gains
 */

import React, { useEffect, useState } from 'react';
import { Zap, X } from 'lucide-react';
import type { XPGainEvent } from '../../types/gamification';

interface XPGainToastProps {
  event: XPGainEvent;
  onDismiss?: () => void;
  duration?: number;
}

const sourceIcons: Record<string, string> = {
  scan: '📱',
  comparison: '⚖️',
  contribution: '✍️',
  badge: '🏅',
  challenge: '🎯',
  streak: '🔥',
  social: '👥'
};

export function XPGainToast({ event, onDismiss, duration = 4000 }: XPGainToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-50 transform transition-all duration-300 ${
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label={event.source}>
              {sourceIcons[event.source] || '⭐'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-yellow-300 flex-shrink-0" />
              <span className="font-bold text-xl">+{event.points} XP</span>
            </div>
            <p className="text-sm text-white/90">
              {event.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full transition-all"
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/**
 * XPGainToastContainer Component
 * Container for multiple XP gain toasts
 */
interface XPGainToastContainerProps {
  events: XPGainEvent[];
  onDismiss: (timestamp: number) => void;
}

export function XPGainToastContainer({ events, onDismiss }: XPGainToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-3">
      {events.map((event, index) => (
        <XPGainToast
          key={event.timestamp}
          event={event}
          onDismiss={() => onDismiss(event.timestamp)}
        />
      ))}
    </div>
  );
}
