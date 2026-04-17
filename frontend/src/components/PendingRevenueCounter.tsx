import React, { useState, useEffect } from 'react';

export const PendingRevenueCounter = () => {
  const [stats, setStats] = useState({ count: 0, total: 0 });

  const calculateStats = () => {
    const queue = JSON.parse(localStorage.getItem('revenue_queue') || '[]');
    const count = queue.length;
    const total = queue.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    setStats({ count, total });
  };

  useEffect(() => {
    calculateStats();
    // On vérifie toutes les 5 secondes si de nouveaux clics ont été mis en soute
    const interval = setInterval(calculateStats, 5000);
    window.addEventListener('storage', calculateStats);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', calculateStats);
    };
  }, []);

  if (stats.count === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #4caf50',
        borderRadius: '12px',
        padding: '15px',
        margin: '10px 0',
        color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold' }}>
          🕒 SYNCHRO EN COURS
        </span>
        <span style={{ fontSize: '18px' }}>💰</span>
      </div>
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{stats.total.toFixed(2)}€</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>
          {stats.count} clics en attente d'envoi
        </div>
      </div>
      <div
        style={{
          marginTop: '10px',
          height: '4px',
          backgroundColor: '#333',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '100%',
            backgroundColor: '#4caf50',
            animation: 'pulse 1.5s infinite',
          }}
        ></div>
      </div>
    </div>
  );
};
