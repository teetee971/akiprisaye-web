/**
 * BadgeUnlockModal Component
 * Modal with animation when badge is unlocked
 */

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Award } from 'lucide-react';
import type { UserBadge } from '../../types/gamification';

interface BadgeUnlockModalProps {
  badge: UserBadge;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeUnlockModal({ badge, isOpen, onClose }: BadgeUnlockModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Fermer le dialogue"
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Animated Background */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <Sparkles size={16 + Math.random() * 16} className="text-yellow-400 opacity-70" />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="text-center space-y-6 relative z-10">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-5xl" role="img" aria-label={badge.name}>
                  {badge.icon}
                </span>
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-pulse">
                <Award size={20} className="text-white" />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 id="badge-title" className="text-2xl font-bold text-gray-900">
              Badge débloqué ! 🎉
            </h2>
            <p className="text-xl font-semibold text-blue-600">{badge.name}</p>
            <p className="text-gray-600">{badge.description}</p>
          </div>

          {/* XP Reward */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Récompense</div>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              +{badge.xpReward} XP
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            Continuer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
