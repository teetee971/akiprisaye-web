// src/pages/Alerts.tsx
import React, { useEffect, useState } from 'react'
import { getAlerts } from '../services/alertsService'
import type { SanitaryAlert } from '../types/alerts'

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
      <h1>Alerts</h1>
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
