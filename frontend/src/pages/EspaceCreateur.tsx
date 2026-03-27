import React from 'react';

// Animation CSS pour le Ticker et l'Alerte
const styles = `
  @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
  @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
`;

const EspaceCreateur: React.FC = () => {
  // Similation des données du radar
  const radar = { ville: "Pointe-à-Pitre", region: "Guadeloupe" };

  return (
    <div style={{padding: '20px', color: 'white', background: '#0f172a', minHeight: '100vh'}}>
      <style>{styles}</style>

      {/* 🚀 TICKER LIVE SEARCH */}
      <div style={{background: 'rgba(0,0,0,0.3)', padding: '8px 0', borderY: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '20px', borderRadius: '8px'}}>
        <div style={{display: 'inline-block', animation: 'marquee 25s linear infinite', fontSize: '0.85em', color: '#60a5fa'}}>
           🚀 LIVE SEARCH : [Riz Basmati] à Baie-Mahault ... [Huile] à Fort-de-France ... [Pneus] à Cayenne ... Alerte prix détectée sur [Lait] ...
        </div>
      </div>

      <h1 style={{fontSize: '1.8em', fontWeight: 'bold'}}>✨ Espace Créateur</h1>
      <p style={{opacity: 0.6, fontSize: '0.9em'}}>Rôle : <span style={{color: '#fbbf24'}}>admin</span></p>

      {/* 📡 BADGE RADAR & HISTORIQUE */}
      <div style={{marginTop: '15px', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', border: '1px solid #10b981'}}>
        <p style={{color: '#10b981', fontWeight: 'bold', fontSize: '0.8em'}}>📡 RADAR ACTIVÉ (Géo + Temps)</p>
        <p style={{fontSize: '0.7em', opacity: 0.8}}>• Dernière MàJ : 27/03 à 10:25 | • Précédente : 27/03 à 09:45</p>
      </div>

      {/* ⚠️ ALERTE PIC D'AUDIENCE */}
      <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', animation: 'pulse 2s infinite'}}>
        <span style={{width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%'}}></span>
        <div style={{fontSize: '0.85em', color: '#fca5a5'}}>
          <strong>⚠️ ALERTE PIC :</strong> Trafic intense détecté en Guadeloupe (+45%).
        </div>
      </div>

      {/* 📈 GRAPHIQUE AFFLUENCE */}
      <div style={{marginTop: '25px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
          <h3 style={{fontSize: '0.95em', fontWeight: 'bold'}}>📈 Affluence Live & Pics (Antilles)</h3>
          <span style={{fontSize: '0.75em', color: '#10b981'}}>● {radar.ville}</span>
        </div>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px'}}>
          {[20, 40, 60, 95, 70, 40, 25].map((h, i) => (
            <div key={i} style={{flex: 1, background: h > 80 ? '#fbbf24' : '#3b82f6', height: h+'%', borderRadius: '4px'}} />
          ))}
        </div>
        <p style={{fontSize: '0.7em', marginTop: '10px', opacity: 0.5}}>🔥 Prochain pic estimé : 18h30</p>
      </div>

      {/* 🏆 PODIUM & FIDÉLITÉ */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px'}}>
        <div style={{background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)'}}>
          <h3 style={{fontSize: '0.8em', color: '#60a5fa', marginBottom: '8px'}}>🏆 Top Produits</h3>
          <p style={{fontSize: '0.7em'}}>🥇 Riz | 🥈 Huile | 🥉 Eau</p>
        </div>
        <div style={{background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
          <h3 style={{fontSize: '0.8em', color: '#10b981', marginBottom: '8px'}}>💎 Fidélité</h3>
          <p style={{fontSize: '0.9em', fontWeight: 'bold'}}>78%</p>
        </div>
      </div>

      {/* 🧠 CONSEIL DE L'IA */}
      <div style={{marginTop: '25px', padding: '18px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 100%)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: '16px'}}>
        <h3 style={{fontSize: '0.9em', fontWeight: 'bold', color: '#a855f7', marginBottom: '8px'}}>🧠 Conseil de l'IA Briefing</h3>
        <p style={{fontSize: '0.8em', lineHeight: '1.4', opacity: 0.9}}>
          Thierry, la Guadeloupe domine ce matin. Focus recommandé sur les prix "Madiana" en Martinique pour cet après-midi.
        </p>
      </div>
    </div>
  );
};

export default EspaceCreateur;
