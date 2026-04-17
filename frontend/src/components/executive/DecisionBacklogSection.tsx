import React from 'react';

export interface Decision {
  id: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact?: string;
  effort?: 'low' | 'medium' | 'high';
  category?: string;
}

interface DecisionBacklogSectionProps {
  decisions?: Decision[];
}

const priorityBadge: Record<Decision['priority'], string> = {
  critical: 'bg-red-900 text-red-200',
  high: 'bg-orange-900 text-orange-200',
  medium: 'bg-yellow-900 text-yellow-200',
  low: 'bg-gray-800 text-gray-400',
};

export function DecisionBacklogSection({ decisions = [] }: DecisionBacklogSectionProps) {
  if (decisions.length === 0) {
    return (
      <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">🎯 Backlog décisions</h2>
        <p className="text-gray-400 text-sm">
          Aucune décision en attente. Lancez le workflow Executive OS.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-3">
        🎯 Backlog décisions ({decisions.length})
      </h2>
      <ul className="space-y-2">
        {decisions.slice(0, 8).map((d) => (
          <li key={d.id} className="bg-gray-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs rounded px-1.5 py-0.5 font-semibold ${priorityBadge[d.priority]}`}
              >
                {d.priority}
              </span>
              {d.category && <span className="text-xs text-gray-500">{d.category}</span>}
            </div>
            <p className="text-sm text-white">{d.action}</p>
            {d.impact && <p className="text-xs text-gray-400 mt-0.5">Impact : {d.impact}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default DecisionBacklogSection;
