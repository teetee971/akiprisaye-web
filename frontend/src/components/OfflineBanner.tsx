import React, { useState, useEffect } from 'react';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div style={{
      backgroundColor: '#d32f2f', // Un rouge un peu plus pro
      color: 'white',
      textAlign: 'center',
      padding: '8px 10px',
      fontSize: '13px',
      fontWeight: 'bold',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Effet de ressort
      transform: isOffline ? 'translateY(0)' : 'translateY(-110%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    }}>
      <span>📡</span> Mode Hors-ligne : Données en cache (Cloudflare indisponible)
    </div>
  );
};
