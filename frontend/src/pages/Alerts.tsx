// src/pages/Alerts.tsx
import React, { useEffect, useState } from 'react'
import { getAlerts } from '../services/alertsService'
import type { SanitaryAlert } from '../types/alerts'
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

type Alert = SanitaryAlert;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    async function load() {
      const result = await getAlerts()
      setAlerts(result.alerts)
    }
    load()
  }, [])

  return (
    <main>
      <HeroImage
        src={PAGE_HERO_IMAGES.alerts}
        alt="Alertes prix"
        gradient="from-slate-950 to-red-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🔔 Alertes prix</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Recevez une alerte quand un prix baisse</p>
      </HeroImage>
      {alerts.length === 0 ? (
        <p>No alerts.</p>
      ) : (
        <ul>
          {alerts.map((al) => (
            <li key={al.id}>
              <strong>{al.title}</strong>
              <div>{al.reason ?? al.risk ?? al.instructions}</div>
              <small>{al.severity} — {al.status === 'resolved' ? 'resolved' : 'open'}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
