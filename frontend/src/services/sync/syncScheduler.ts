/**
 * Service de planification des synchronisations
 * Note: Implémentation frontend basique. Pour une production réelle,
 * utiliser un vrai scheduler backend avec node-cron ou Cloudflare Workers Cron
 */

import type {
  ScheduledJob,
  JobDefinition,
  SyncSchedulerConfig,
  SyncResult,
} from './types';
import { safeLocalStorage } from '../../utils/safeLocalStorage';
import { openPricesService } from './openPricesService';
import { syncLoggerService } from './syncLogger';
import { syncProduct, getLocalProductEANs } from './openFoodFactsService';

const STORAGE_KEY = 'akiprisaye_sync_jobs';
const CONFIG_KEY = 'akiprisaye_sync_config';

/**
 * Configuration par défaut du scheduler
 */
export const DEFAULT_CONFIG: SyncSchedulerConfig = {
  productsSyncInterval: '0 2 * * *', // 2h du matin tous les jours
  pricesSyncInterval: '0 */6 * * *', // Toutes les 6h
  maxProductsPerSync: 1000,
  maxPricesPerSync: 5000,
  maxRetries: 3,
  retryDelayMs: 5000,
  notifyOnError: true,
  notifyOnComplete: false,
};

/**
 * Récupère la configuration du scheduler
 */
export function getSchedulerConfig(): SyncSchedulerConfig {
  try {
    const config = safeLocalStorage.getJSON<SyncSchedulerConfig>(CONFIG_KEY, DEFAULT_CONFIG);
    return config || DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error loading scheduler config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Sauvegarde la configuration du scheduler
 */
export function setSchedulerConfig(config: Partial<SyncSchedulerConfig>): void {
  try {
    const currentConfig = getSchedulerConfig();
    const newConfig = { ...currentConfig, ...config };
    safeLocalStorage.setJSON(CONFIG_KEY, newConfig);
  } catch (error) {
    console.error('Error saving scheduler config:', error);
  }
}

/**
 * Handler pour la synchronisation des produits OpenFoodFacts
 */
async function syncOpenFoodFactsProducts(): Promise<SyncResult> {
  syncLoggerService.logMessage('sync-off-products', 'info', 'Starting OpenFoodFacts sync...');

  const config = getSchedulerConfig();
  const eans = getLocalProductEANs().slice(0, config.maxProductsPerSync);

  const aggregate: SyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime: new Date(),
    endTime: new Date(),
    duration: 0,
  };

  for (const ean of eans) {
    const result = await syncProduct(ean);
    aggregate.itemsProcessed += result.itemsProcessed;
    aggregate.itemsAdded += result.itemsAdded;
    aggregate.itemsUpdated += result.itemsUpdated;
    aggregate.itemsSkipped += result.itemsSkipped;
    aggregate.errors.push(...result.errors);
    if (!result.success) aggregate.success = false;
  }

  aggregate.endTime = new Date();
  aggregate.duration = aggregate.endTime.getTime() - aggregate.startTime.getTime();

  syncLoggerService.logMessage('sync-off-products', 'info',
    `Completed: ${aggregate.itemsAdded} added, ${aggregate.itemsUpdated} updated, ${aggregate.errors.length} errors`
  );

  return aggregate;
}

/**
 * Handler pour la synchronisation des prix OpenPrices
 */
async function syncOpenPrices(): Promise<SyncResult> {
  syncLoggerService.logMessage('sync-op-prices', 'info', 'Starting OpenPrices sync...');

  try {
    const result = await openPricesService.fullSync();

    syncLoggerService.logMessage('sync-op-prices', 'info',
      `Completed: ${result.itemsAdded} prices added, ${result.errors.length} errors`
    );

    return result;
  } catch (error) {
    syncLoggerService.logMessage('sync-op-prices', 'error', 
      `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return {
      success: false,
      itemsProcessed: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
    };
  }
}

/**
 * Handler pour le nettoyage des vieux prix
 */
async function cleanupOldPrices(): Promise<SyncResult> {
  syncLoggerService.logMessage('cleanup-old-prices', 'info', 'Starting cleanup...');

  // Nettoyer les logs de plus de 30 jours
  const removed = syncLoggerService.cleanupOldLogs(30);

  const result: SyncResult = {
    success: true,
    itemsProcessed: removed,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime: new Date(),
    endTime: new Date(),
    duration: 0,
  };

  syncLoggerService.logMessage('cleanup-old-prices', 'info', 
    `Completed: ${removed} old logs removed`
  );

  return result;
}

/**
 * Définitions des jobs planifiés
 */
export const SYNC_JOBS: JobDefinition[] = [
  {
    id: 'sync-off-products',
    name: 'Sync OpenFoodFacts Products',
    schedule: '0 2 * * *', // Tous les jours à 2h
    handler: syncOpenFoodFactsProducts,
    description: 'Synchronise les produits depuis OpenFoodFacts',
  },
  {
    id: 'sync-op-prices',
    name: 'Sync OpenPrices',
    schedule: '0 */6 * * *', // Toutes les 6h
    handler: syncOpenPrices,
    description: 'Synchronise les prix depuis OpenPrices',
  },
  {
    id: 'cleanup-old-prices',
    name: 'Cleanup Old Prices',
    schedule: '0 3 * * 0', // Dimanche à 3h
    handler: cleanupOldPrices,
    description: 'Nettoie les données obsolètes',
  },
];

/**
 * Récupère tous les jobs planifiés
 */
export function getScheduledJobs(): ScheduledJob[] {
  try {
    const jobs = safeLocalStorage.getJSON<ScheduledJob[]>(STORAGE_KEY, []);
    if (jobs && jobs.length > 0) {
      return jobs;
    }

    // Initialiser avec les jobs par défaut
    const defaultJobs: ScheduledJob[] = SYNC_JOBS.map(def => ({
      id: def.id,
      name: def.name,
      schedule: def.schedule,
      status: 'idle',
      enabled: true,
    }));

    saveScheduledJobs(defaultJobs);
    return defaultJobs;
  } catch (error) {
    console.error('Error loading scheduled jobs:', error);
    return [];
  }
}

/**
 * Sauvegarde les jobs planifiés
 */
function saveScheduledJobs(jobs: ScheduledJob[]): void {
  try {
    safeLocalStorage.setJSON(STORAGE_KEY, jobs);
  } catch (error) {
    console.error('Error saving scheduled jobs:', error);
  }
}

/**
 * Met à jour un job planifié
 */
export function updateScheduledJob(
  jobId: string,
  updates: Partial<ScheduledJob>
): void {
  const jobs = getScheduledJobs();
  const index = jobs.findIndex(job => job.id === jobId);

  if (index !== -1) {
    jobs[index] = {
      ...jobs[index],
      ...updates,
    };
    saveScheduledJobs(jobs);
  }
}

/**
 * Active/désactive un job
 */
export function toggleJob(jobId: string, enabled: boolean): void {
  updateScheduledJob(jobId, { enabled });
}

/**
 * Exécute un job manuellement
 */
export async function runJobManually(jobId: string): Promise<SyncResult> {
  const job = getScheduledJobs().find(j => j.id === jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Trouver le handler
  const jobDef = SYNC_JOBS.find(def => def.id === jobId);
  if (!jobDef) {
    throw new Error(`Job definition for ${jobId} not found`);
  }

  // Marquer le job comme en cours
  updateScheduledJob(jobId, {
    status: 'running',
    lastRun: new Date(),
  });

  // Créer un log
  const log = syncLoggerService.createSyncLog(jobId);

  try {
    // Exécuter le job avec retry
    const config = getSchedulerConfig();
    let result: SyncResult | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        result = await jobDef.handler();
        
        if (result.success) {
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < config.maxRetries) {
          syncLoggerService.logMessage(jobId, 'warn', 
            `Attempt ${attempt + 1} failed, retrying in ${config.retryDelayMs}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, config.retryDelayMs));
        }
      }
    }

    if (!result || !result.success) {
      throw lastError || new Error('Job failed after retries');
    }

    // Mettre à jour le job
    updateScheduledJob(jobId, {
      status: 'idle',
      lastResult: result,
    });

    // Compléter le log
    syncLoggerService.completeSyncLog(log.id, result);

    // Notification si configurée
    if (config.notifyOnComplete) {
      console.log(`✅ Job ${job.name} completed successfully`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Marquer le job en erreur
    updateScheduledJob(jobId, {
      status: 'error',
    });

    // Marquer le log en erreur
    syncLoggerService.failSyncLog(log.id, errorMessage);

    // Notification si configurée
    if (getSchedulerConfig().notifyOnError) {
      console.error(`❌ Job ${job.name} failed: ${errorMessage}`);
    }

    throw error;
  }
}

/**
 * Obtient le prochain temps d'exécution d'un job (simplifié)
 * Note: Pour une vraie implémentation, utiliser une lib comme cron-parser
 */
export function getNextRunTime(_schedule: string): Date | null {
  // Implémentation simplifiée : retourne dans 1 heure pour l'instant
  const next = new Date();
  next.setHours(next.getHours() + 1);
  return next;
}

/**
 * Réinitialise tous les jobs
 */
export function resetAllJobs(): void {
  const defaultJobs: ScheduledJob[] = SYNC_JOBS.map(def => ({
    id: def.id,
    name: def.name,
    schedule: def.schedule,
    status: 'idle',
    enabled: true,
  }));

  saveScheduledJobs(defaultJobs);
}

/**
 * Export du service
 */
export const syncSchedulerService = {
  getSchedulerConfig,
  setSchedulerConfig,
  getScheduledJobs,
  updateScheduledJob,
  toggleJob,
  runJobManually,
  getNextRunTime,
  resetAllJobs,
  SYNC_JOBS,
  DEFAULT_CONFIG,
};

export default syncSchedulerService;
