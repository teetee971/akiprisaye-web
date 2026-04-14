import React from 'react';
import { BrainCircuit, Clock3 } from 'lucide-react';
import type { GhostwriterHistoryEntry } from '../../services/ghostwriterService';

interface CreatorAudiencePanelProps {
  ghostwriterPost: string;
  audienceBriefing: string;
  ghostwriterCopied: boolean;
  onCopy: () => void;
  postHistory: GhostwriterHistoryEntry[];
}

const CreatorAudiencePanel: React.FC<CreatorAudiencePanelProps> = ({
  ghostwriterPost,
  audienceBriefing,
  ghostwriterCopied,
  onCopy,
  postHistory,
}) => (
  <>
    <section className="mb-8 rounded-3xl border border-violet-500/30 bg-slate-900/50 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BrainCircuit className="text-violet-400" /> Ghostwriter Social
        </h2>
        <button
          type="button"
          onClick={onCopy}
          className="text-xs bg-violet-600 px-3 py-2 rounded-lg font-bold hover:bg-violet-500 transition"
        >
          {ghostwriterCopied ? 'Copié !' : 'Copier le texte'}
        </button>
      </div>
      <div className="whitespace-pre-wrap font-sans text-sm text-slate-300 bg-slate-950 p-5 rounded-xl border border-slate-800 leading-relaxed">
        {ghostwriterPost}
      </div>
      {audienceBriefing && (
        <p className="mt-3 text-xs text-violet-300/70 italic border-t border-slate-800 pt-3">
          💡 {audienceBriefing}
        </p>
      )}
    </section>

    {postHistory.length > 0 && (
      <section className="mb-8 rounded-3xl border border-slate-700/40 bg-slate-900/30 p-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock3 size={14} /> Historique posts ({postHistory.length})
        </h2>
        <div className="space-y-3">
          {postHistory.map((entry) => (
            <details
              key={entry.id}
              className="group bg-slate-950/70 rounded-xl border border-slate-800 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-slate-900/50 transition">
                <span className="text-xs text-slate-400">
                  {new Date(entry.generatedAt).toLocaleString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[60%] text-right">
                  {entry.post.split('\n')[0]}
                </span>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-slate-800">
                <pre className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed mb-3">
                  {entry.post}
                </pre>
                {entry.briefing && (
                  <p className="text-[11px] text-violet-300/60 italic mb-3">💡 {entry.briefing}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(entry.post);
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition"
                >
                  Copier
                </button>
              </div>
            </details>
          ))}
        </div>
      </section>
    )}
  </>
);

export default CreatorAudiencePanel;
