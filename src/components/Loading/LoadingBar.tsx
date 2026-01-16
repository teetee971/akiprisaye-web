/**
 * LoadingBar Component
 * 
 * Top loading bar that animates during route transitions
 * Provides visual feedback for navigation events
 */

'use client';

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setProgress(0);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div 
      className="loading-bar fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 transition-all duration-200"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Chargement de la page"
    />
  );
}
