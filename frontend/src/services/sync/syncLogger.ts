/**
 * Service de logging des synchronisations
 */

import type { SyncLog, SyncResult } from './types';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

const STORAGE_KEY = 'akiprisaye_sync_logs';
const MAX_LOGS = 100; // Nombre maximum de logs à conserver

/**
 * Génère un ID unique pour un log
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Récupère tous les logs de sync depuis le localStorage
 */
export function getSyncLogs(): SyncLog[] {
  try {
    const logs = safeLocalStorage.getJSON<SyncLog[]>(STORAGE_KEY, []);
    return logs || [];
  } catch (error) {
    console.error('Error loading sync logs:', error);
    return [];
  }
}

/**
 * Sauvegarde les logs de sync dans le localStorage
 */
function saveSyncLogs(logs: SyncLog[]): void {
  try {
    // Limiter le nombre de logs
    const limitedLogs = logs.slice(-MAX_LOGS);
    safeLocalStorage.setJSON(STORAGE_KEY, limitedLogs);
  } catch (error) {
    console.error('Error saving sync logs:', error);
  }
}

/**
 * Crée un nouveau log de synchronisation
 */
export function createSyncLog(jobId: string): SyncLog {
  const log: SyncLog = {
    id: generateLogId(),
    jobId,
    startTime: new Date(),
    status: 'running',
  };

  const logs = getSyncLogs();
  logs.push(log);
  saveSyncLogs(logs);

  return log;
}

/**
 * Met à jour un log de synchronisation
 */
export function updateSyncLog(logId: string, updates: Partial<SyncLog>): void {
  const logs = getSyncLogs();
  const index = logs.findIndex((log) => log.id === logId);

  if (index !== -1) {
    logs[index] = {
      ...logs[index],
      ...updates,
    };
    saveSyncLogs(logs);
  }
}

/**
 * Marque un log comme complété
 */
export function completeSyncLog(logId: string, result: SyncResult): void {
  updateSyncLog(logId, {
    endTime: new Date(),
    status: 'completed',
    result,
  });
}

/**
 * Marque un log comme échoué
 */
export function failSyncLog(logId: string, error: string): void {
  updateSyncLog(logId, {
    endTime: new Date(),
    status: 'failed',
    error,
  });
}

/**
 * Récupère les logs d'un job spécifique
 */
export function getLogsByJobId(jobId: string): SyncLog[] {
  const logs = getSyncLogs();
  return logs.filter((log) => log.jobId === jobId);
}

/**
 * Récupère le dernier log d'un job
 */
export function getLastLogByJobId(jobId: string): SyncLog | null {
  const logs = getLogsByJobId(jobId);
  return logs.length > 0 ? logs[logs.length - 1] : null;
}

/**
 * Récupère les logs par statut
 */
export function getLogsByStatus(status: SyncLog['status']): SyncLog[] {
  const logs = getSyncLogs();
  return logs.filter((log) => log.status === status);
}

/**
 * Récupère les logs récents (dernières 24h)
 */
export function getRecentLogs(hours: number = 24): SyncLog[] {
  const logs = getSyncLogs();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  return logs.filter((log) => new Date(log.startTime) >= cutoff);
}

/**
 * Nettoie les vieux logs (plus de X jours)
 */
export function cleanupOldLogs(days: number = 30): number {
  const logs = getSyncLogs();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filteredLogs = logs.filter((log) => new Date(log.startTime) >= cutoff);
  const removed = logs.length - filteredLogs.length;

  saveSyncLogs(filteredLogs);

  return removed;
}

/**
 * Supprime tous les logs
 */
export function clearAllLogs(): void {
  safeLocalStorage.remove(STORAGE_KEY);
}

/**
 * Exporte les logs au format JSON
 */
export function exportLogs(): string {
  const logs = getSyncLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Importe des logs depuis JSON
 */
export function importLogs(jsonData: string): boolean {
  try {
    const logs = JSON.parse(jsonData) as SyncLog[];

    // Validation basique
    if (!Array.isArray(logs)) {
      throw new Error('Invalid logs format');
    }

    saveSyncLogs(logs);
    return true;
  } catch (error) {
    console.error('Error importing logs:', error);
    return false;
  }
}

/**
 * Calcule des statistiques sur les logs
 */
export function getLogsStats(): {
  total: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  averageDuration: number;
} {
  const logs = getSyncLogs();

  const completed = logs.filter((log) => log.status === 'completed');
  const failed = logs.filter((log) => log.status === 'failed');
  const running = logs.filter((log) => log.status === 'running');

  const successRate =
    logs.length > 0 ? (completed.length / (completed.length + failed.length)) * 100 : 0;

  const durations = completed
    .filter((log) => log.result?.duration)
    .map((log) => log.result!.duration);

  const averageDuration =
    durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

  return {
    total: logs.length,
    completed: completed.length,
    failed: failed.length,
    running: running.length,
    successRate: Math.round(successRate * 100) / 100,
    averageDuration: Math.round(averageDuration),
  };
}

/**
 * Log un message dans la console avec le contexte du job
 */
export function logMessage(jobId: string, level: 'info' | 'warn' | 'error', message: string): void {
  const timestamp = new Date().toISOString();
  const prefix = `[Sync ${jobId}] [${timestamp}]`;

  switch (level) {
    case 'info':
      console.log(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`);
      break;
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
  }
}

/**
 * Export du service
 */
export const syncLoggerService = {
  getSyncLogs,
  createSyncLog,
  updateSyncLog,
  completeSyncLog,
  failSyncLog,
  getLogsByJobId,
  getLastLogByJobId,
  getLogsByStatus,
  getRecentLogs,
  cleanupOldLogs,
  clearAllLogs,
  exportLogs,
  importLogs,
  getLogsStats,
  logMessage,
};

export default syncLoggerService;
