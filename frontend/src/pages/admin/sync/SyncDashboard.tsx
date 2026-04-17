/**
 * Dashboard de synchronisation - Page Admin
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  syncSchedulerService,
  syncLoggerService,
  type ScheduledJob,
  type SyncLog,
} from '../../../services/sync';
import SyncHistory from '../../../components/admin/sync/SyncHistory';
import SyncConfig from '../../../components/admin/sync/SyncConfig';
import ManualSync from '../../../components/admin/sync/ManualSync';
import SyncStats from '../../../components/admin/sync/SyncStats';

export default function SyncDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
    averageDuration: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'config'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/mon-compte');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, isAdmin, navigate]);

  const loadData = () => {
    setLoading(true);
    try {
      const scheduledJobs = syncSchedulerService.getScheduledJobs();
      const syncLogs = syncLoggerService.getSyncLogs();
      const logsStats = syncLoggerService.getLogsStats();

      setJobs(scheduledJobs);
      setLogs(syncLogs);
      setStats(logsStats);
    } catch (error) {
      console.error('Error loading sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobToggle = (jobId: string, enabled: boolean) => {
    syncSchedulerService.toggleJob(jobId, enabled);
    loadData();
  };

  const handleManualRun = async (jobId: string) => {
    try {
      await syncSchedulerService.runJobManually(jobId);
      loadData();
    } catch (error) {
      console.error('Error running job:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Accès refusé. Cette page est réservée aux administrateurs.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Synchronisation des données</h1>
        <p className="text-gray-600">
          Gérez la synchronisation automatique avec OpenFoodFacts et OpenPrices
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuration
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <SyncStats stats={stats} />

          {/* Jobs Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Jobs planifiés</h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{job.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          job.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : job.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status === 'running'
                          ? 'En cours'
                          : job.status === 'error'
                            ? 'Erreur'
                            : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Planning: {job.schedule}</p>
                    {job.lastRun && (
                      <p className="text-sm text-gray-500 mt-1">
                        Dernière exécution: {new Date(job.lastRun).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={job.enabled}
                        onChange={(e) => handleJobToggle(job.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">Activé</span>
                    </label>
                    <button
                      onClick={() => handleManualRun(job.id)}
                      disabled={job.status === 'running'}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Exécuter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Sync */}
          <ManualSync onSync={loadData} />
        </div>
      )}

      {activeTab === 'history' && <SyncHistory logs={logs} onRefresh={loadData} />}

      {activeTab === 'config' && <SyncConfig onSave={loadData} />}
    </div>
  );
}
