// src/pages/Alerts.tsx
import React, { useEffect, useState } from 'react'
import alertsService, { Alert } from '../services/alertsService'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    async function load() {
      const a = await alertsService.getAlerts()
      setAlerts(a)
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
              <div>{al.body}</div>
              <small>{al.level} — {al.resolved ? 'resolved' : 'open'}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
