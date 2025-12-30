/**
 * DataSourceWarning Component
 * 
 * Displays critical warnings about data sources throughout the application.
 * Shows when data is demonstration/non-official.
 * Updated to Civic Glass design - NO EMOJIS
 */

import { GlassCard } from './ui/GlassCard';
import { DataBadge } from './ui/DataBadge';

export function DataSourceWarning({ dataStatus, requiredSources, compact = false }) {
  // Only show warning if data is not official
  if (dataStatus === 'OFFICIEL' || dataStatus === 'OFFICIAL') {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-red-600/10 border-l-4 border-red-500 p-3 text-sm backdrop-blur-sm">
        <p className="text-red-200 font-semibold">
          <span className="font-bold">AVERTISSEMENT:</span> Données de démonstration - Ne pas utiliser en production
        </p>
      </div>
    );
  }

  return (
    <GlassCard className="border-2 border-red-500 bg-red-900/20">
      <div className="flex items-start gap-4">
        <div className="px-3 py-1 bg-red-600/30 border border-red-500 rounded text-red-200 font-bold flex-shrink-0">!</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-200 mb-2">
            AVERTISSEMENT CRITIQUE - Données non officielles
          </h3>
          
          <div className="space-y-3 text-sm text-red-300">
            <p className="font-semibold">
              Les données affichées sont des DONNÉES DE DÉMONSTRATION.
            </p>
            
            <p>
              Elles ne doivent <strong>PAS</strong> être utilisées pour des décisions réelles
              ou être citées comme référence.
            </p>

            {requiredSources && requiredSources.length > 0 && (
              <div className="pt-3 border-t border-red-500/30">
                <p className="font-semibold mb-2">
                  Sources officielles requises :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {requiredSources.map((source, index) => (
                    <li key={index}>{source}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-red-500/30">
              <p className="text-xs">
                <strong>Statut actuel :</strong> {dataStatus || 'DEMONSTRATION'}
                <br />
                <strong>Action requise :</strong> Remplacer par données officielles tracées
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function OfficialDataBadge({ source, date, link }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-500/50 rounded-lg text-xs font-mono backdrop-blur-sm">
      <span className="text-green-200">
        <strong className="text-green-300">Source:</strong> {source}
      </span>
      {date && (
        <>
          <span className="text-green-500/50">•</span>
          <span className="text-green-200">{date}</span>
        </>
      )}
      {link && (
        <a 
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-100 underline"
        >
          Lien
        </a>
      )}
    </div>
  );
}

export function DataUnavailableNotice({ dataType, suggestedSources }) {
  return (
    <GlassCard className="border-2 border-amber-400 bg-amber-900/20">
      <div className="flex items-start gap-4">
        <div className="px-2 py-1 bg-amber-600/30 border border-amber-500 rounded text-amber-200 font-bold flex-shrink-0 text-sm">INFO</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-200 mb-2">
            Donnée non disponible
          </h3>
          
          <p className="text-sm text-amber-300 mb-3">
            Les données pour <strong>{dataType}</strong> ne sont pas encore disponibles.
          </p>

          <p className="text-sm text-amber-300 mb-3">
            Ce module nécessite des données issues de sources officielles.
          </p>

          {suggestedSources && suggestedSources.length > 0 && (
            <div className="pt-3 border-t border-amber-500/30">
              <p className="text-sm font-semibold text-amber-200 mb-2">
                Sources officielles suggérées :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-amber-300">
                {suggestedSources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-amber-500/30">
            <p className="text-xs text-amber-400">
              <strong>Note:</strong> Vous disposez d'une source officielle ? Contactez-nous pour l'intégrer.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default DataSourceWarning;
