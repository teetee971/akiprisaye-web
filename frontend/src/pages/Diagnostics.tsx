import { useCallback, useEffect, useMemo, useState } from 'react';
import { clear, exportJson, getEvents, isTelemetryEnabled, stats, type TelemetryEvent } from '../telemetry';

export default function Diagnostics() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof stats>> | null>(null);

  const enabled = isTelemetryEnabled();

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const [latest, telemetryStats] = await Promise.all([getEvents(50), stats(50)]);
    setEvents(latest.reverse());
    setSummary(telemetryStats);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalShown = useMemo(() => events.length, [events]);

  if (!enabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Diagnostics</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            La télémétrie locale est désactivée. Activez-la via <code>VITE_TELEMETRY_DEBUG=1</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Diagnostics locaux</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Données strictement locales (IndexedDB/localStorage), export manuel uniquement.
        </p>

        <div className="mt-4 grid sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Total: <strong>{summary?.total ?? 0}</strong></div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Cache hit rate: <strong>{summary?.cacheHitRate ?? 0}%</strong></div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">Médiane durée: <strong>{summary?.medianDurationMs ?? '-'} ms</strong></div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            Status: <strong>OK {summary?.statusBreakdown.OK ?? 0}</strong> / <strong>PARTIAL {summary?.statusBreakdown.PARTIAL ?? 0}</strong> / <strong>NO_DATA {summary?.statusBreakdown.NO_DATA ?? 0}</strong> / <strong>UNAVAILABLE {summary?.statusBreakdown.UNAVAILABLE ?? 0}</strong>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              const content = await exportJson();
              const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `telemetry-local-${new Date().toISOString()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Exporter JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              await clear();
              await refresh();
            }}
            className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm"
          >
            Vider
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Derniers événements ({totalShown}/50)</h2>
        <div className="mt-3 space-y-2 max-h-[60vh] overflow-auto">
          {events.map((event, index) => (
            <div key={`${event.ts}-${index}`} className="text-xs font-mono p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
              <div><strong>{event.kind}</strong> • {event.ts}</div>
              <div>status={event.status ?? 'null'} territory={event.territory} mode={event.mode} queryLen={event.queryLen} eanLen={event.eanLen} durationMs={event.durationMs ?? 'null'}</div>
              <div>sources=[{event.sourcesUsed.join(', ')}] warnings={event.warningsCount}</div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-slate-500">Aucun événement.</p>}
        </div>
      </div>
    </div>
  );
}
