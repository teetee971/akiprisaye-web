// src/services/alertsService.ts
// Alerts service: create/read/update simple in-memory alerts for roadmap

export type Alert = {
  id: string
  title: string
  body?: string
  level?: 'info' | 'warning' | 'critical'
  createdAt?: string
  resolved?: boolean
}

const _store: Alert[] = []

export async function getAlerts(): Promise<Alert[]> {
  return _store
}

export async function createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
  const newAlert: Alert = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    resolved: false,
    ...alert,
  }
  _store.push(newAlert)
  return newAlert
}

export async function markResolved(id: string): Promise<boolean> {
  const a = _store.find((x) => x.id === id)
  if (!a) return false
  a.resolved = true
  return true
}

export default { getAlerts, createAlert, markResolved }
