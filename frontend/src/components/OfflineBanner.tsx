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

  if (!isOffline) return null;

  return (
    <div style={{
      backgroundColor: '#ff9800',
      color: 'white',
      textAlign: 'center',
      padding: '5px 10px',
      fontSize: '12px',
      fontWeight: 'bold',
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 9999,
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      ⚠️ Mode Hors-ligne : Affichage des dernières données enregistrées
    </div>
  );
};
