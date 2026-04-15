/**
 * OutreachDashboardPage.tsx — Outreach & backlinks management dashboard.
 * Route: /outreach (private, noIndex)
 */

import { useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import {
  getBacklinks,
  addBacklink,
  updateBacklinkStatus,
  getBacklinkStats,
  type BacklinkRecord,
} from '../utils/backlinkTracker';

// ── Outreach targets data ──────────────────────────────────────────────────────

interface OutreachTarget {
  domain: string;
  name: string;
  type: 'media' | 'blog' | 'directory' | 'forum' | 'partner';
  territory: string;
  status: 'new' | 'contacted' | 'replied' | 'live' | 'declined';
  targetPage: string;
  anchorSuggestion: string;
}

const OUTREACH_TARGETS: OutreachTarget[] = [
  { domain: 'la1ere.francetvinfo.fr', name: "La 1ère (Guadeloupe)", type: 'media', territory: 'gp', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'guide prix alimentaire Guadeloupe' },
  { domain: 'guadeloupe.franceantilles.fr', name: 'France-Antilles Guadeloupe', type: 'media', territory: 'gp', status: 'new', targetPage: '/prix/coca-cola-1-5l-guadeloupe', anchorSuggestion: 'prix Coca-Cola Guadeloupe' },
  { domain: 'martinique.franceantilles.fr', name: 'France-Antilles Martinique', type: 'media', territory: 'mq', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'guide prix alimentaire Martinique' },
  { domain: 'eaux-vives-magazine.com', name: 'Eaux Vives Magazine', type: 'blog', territory: 'gp', status: 'new', targetPage: '/inflation-alimentaire-dom', anchorSuggestion: 'inflation alimentaire Outre-mer' },
  { domain: 'linfo.re', name: "L'info.re (La Réunion)", type: 'media', territory: 're', status: 'new', targetPage: '/prix-enseigne/leclerc/RE', anchorSuggestion: 'prix Leclerc La Réunion' },
  { domain: 'clicanoo.com', name: 'Clicanoo', type: 'media', territory: 're', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'comparateur prix La Réunion' },
  { domain: 'guyane.franceantilles.fr', name: 'France-Antilles Guyane', type: 'media', territory: 'gf', status: 'new', targetPage: '/moins-cher/GF', anchorSuggestion: 'produits moins chers Guyane' },
  { domain: 'mayottehebdo.com', name: 'Mayotte Hebdo', type: 'media', territory: 'yt', status: 'new', targetPage: '/prix-enseigne/carrefour/YT', anchorSuggestion: 'prix supermarché Mayotte' },
  { domain: 'outremers360.com', name: 'Outremer 360', type: 'media', territory: 'gp', status: 'new', targetPage: '/comparateur-supermarches-dom', anchorSuggestion: 'comparateur supermarchés DOM' },
  { domain: 'rci.fm', name: 'RCI Guadeloupe', type: 'media', territory: 'gp', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'pouvoir achat Guadeloupe' },
  { domain: 'rfomartinique.fr', name: 'RFO Martinique', type: 'media', territory: 'mq', status: 'new', targetPage: '/inflation-alimentaire-dom', anchorSuggestion: 'vie chère Martinique' },
  { domain: 'wiiiz.fr', name: 'Wiiiz (coupons DOM)', type: 'partner', territory: 'gp', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'bons plans Guadeloupe' },
  { domain: 'bonplangp.com', name: 'Bon Plan GP', type: 'blog', territory: 'gp', status: 'new', targetPage: '/moins-cher/GP', anchorSuggestion: 'produits moins chers Guadeloupe' },
  { domain: 'vivre-en-guadeloupe.com', name: 'Vivre en Guadeloupe', type: 'blog', territory: 'gp', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'guide vie Guadeloupe' },
  { domain: 'domtomjob.com', name: 'DomTomJob', type: 'directory', territory: 'gp', status: 'new', targetPage: '/comparateur-supermarches-dom', anchorSuggestion: 'coût vie DOM-TOM' },
  { domain: 'reunionnaisdumonde.com', name: 'Réunionnais du Monde', type: 'forum', territory: 're', status: 'new', targetPage: '/moins-cher/RE', anchorSuggestion: 'prix alimentaires La Réunion' },
  { domain: 'zinfos974.com', name: 'Zinfos 974', type: 'media', territory: 're', status: 'new', targetPage: '/inflation-alimentaire-dom', anchorSuggestion: 'inflation La Réunion 2026' },
  { domain: 'imaz-press-reunion.com', name: 'Imaz Press Réunion', type: 'media', territory: 're', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'comparateur prix Réunion' },
  { domain: 'conso974.re', name: 'Conso 974', type: 'blog', territory: 're', status: 'new', targetPage: '/moins-cher/RE', anchorSuggestion: 'moins cher La Réunion' },
  { domain: 'antillaises.fr', name: 'Antillaises.fr', type: 'blog', territory: 'mq', status: 'new', targetPage: '/prix-enseigne/carrefour/MQ', anchorSuggestion: 'supermarché Martinique' },
  { domain: 'martinique.org', name: 'Martinique.org', type: 'directory', territory: 'mq', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'guide Martinique' },
  { domain: 'guyaweb.com', name: 'Guyaweb', type: 'media', territory: 'gf', status: 'new', targetPage: '/prix-enseigne/leclerc/GF', anchorSuggestion: 'prix Leclerc Guyane' },
  { domain: 'blada.com', name: 'Blada.com', type: 'directory', territory: 'gp', status: 'new', targetPage: '/comparateur-supermarches-dom', anchorSuggestion: 'annuaire Guadeloupe' },
  { domain: 'caraib-creole.com', name: 'Caraib Créole', type: 'blog', territory: 'mq', status: 'new', targetPage: '/moins-cher/MQ', anchorSuggestion: 'bons plans Martinique' },
  { domain: 'journal-de-mayotte.com', name: 'Journal de Mayotte', type: 'media', territory: 'yt', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'vie chère Mayotte' },
  { domain: 'mayottechannel.com', name: 'Mayotte Channel', type: 'media', territory: 'yt', status: 'new', targetPage: '/prix-enseigne/carrefour/YT', anchorSuggestion: 'courses Mayotte' },
  { domain: 'dom-tomjob.fr', name: 'Dom-Tom Job', type: 'directory', territory: 'gf', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'coût vie Guyane' },
  { domain: 'antiane.net', name: 'Antiane.net INSEE', type: 'partner', territory: 'gp', status: 'new', targetPage: '/inflation-alimentaire-dom', anchorSuggestion: 'données INSEE Antilles' },
  { domain: 'guadeloupienne.fr', name: 'La Guadeloupéenne', type: 'blog', territory: 'gp', status: 'new', targetPage: '/moins-cher/GP', anchorSuggestion: 'économies Guadeloupe' },
  { domain: 'karibu-mag.com', name: 'Karibu Mag', type: 'blog', territory: 'mq', status: 'new', targetPage: '/guide-prix-alimentaire-dom', anchorSuggestion: 'budget alimentaire Martinique' },
];

// ── Territory flag helpers ────────────────────────────────────────────────────

const TERRITORY_FLAGS: Record<string, string> = {
  gp: '🇬🇵', mq: '🇲🇶', gf: '🇬🇫', re: '🇷🇪', yt: '🇾🇹',
};

const STATUS_COLOR: Record<OutreachTarget['status'], string> = {
  new:       'bg-zinc-400/15 text-zinc-400',
  contacted: 'bg-blue-400/15 text-blue-300',
  replied:   'bg-amber-400/15 text-amber-300',
  live:      'bg-emerald-400/15 text-emerald-300',
  declined:  'bg-rose-400/15 text-rose-300',
};

const BACKLINK_STATUS_COLOR: Record<BacklinkRecord['status'], string> = {
  live:    'bg-emerald-400/15 text-emerald-300',
  pending: 'bg-amber-400/15 text-amber-300',
  lost:    'bg-rose-400/15 text-rose-300',
};

type Tab = 'targets' | 'live' | 'add';

// ── Component ─────────────────────────────────────────────────────────────────

export default function OutreachDashboardPage() {
  const [tab, setTab] = useState<Tab>('targets');
  const [backlinks, setBacklinks] = useState<BacklinkRecord[]>(() => getBacklinks());
  const stats = getBacklinkStats();

  const [form, setForm] = useState<Partial<BacklinkRecord>>({
    status: 'pending',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddBacklink = () => {
    if (!form.sourceDomain || !form.targetUrl) {
      setFormError('Le domaine source et la page cible sont requis.');
      return;
    }
    const record: BacklinkRecord = {
      sourceDomain:  form.sourceDomain,
      sourceUrl:     form.sourceUrl,
      targetUrl:     form.targetUrl,
      anchor:        form.anchor,
      status:        form.status ?? 'pending',
      firstSeenAt:   new Date().toISOString(),
      territory:     form.territory,
      pageType:      form.pageType,
    };
    addBacklink(record);
    setBacklinks(getBacklinks());
    setForm({ status: 'pending' });
    setFormError(null);
    setTab('live');
  };

  return (
    <>
      <SEOHead
        title="Outreach Dashboard — Gestion des backlinks"
        description="Tableau de bord de prospection et suivi des backlinks."
        noIndex
      />

      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold text-white">🔗 Outreach Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Prospection et suivi des backlinks</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Cibles" value={OUTREACH_TARGETS.length} />
            <StatCard label="Backlinks live" value={stats.live} accent="emerald" />
            <StatCard label="En attente" value={stats.pending} accent="amber" />
            <StatCard label="Perdus" value={stats.lost} accent="rose" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-0">
            {(['targets', 'live', 'add'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === t
                    ? 'border border-b-[#0a0a0f] border-white/10 bg-white/5 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'targets' ? '🎯 Cibles Outreach' : t === 'live' ? '✅ Backlinks' : '➕ Ajouter'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'targets' && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3 text-left">Domaine</th>
                    <th className="px-4 py-3 text-left">Territoire</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Page cible</th>
                  </tr>
                </thead>
                <tbody>
                  {OUTREACH_TARGETS.map((t) => (
                    <tr key={t.domain} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-zinc-200">{t.name}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        {TERRITORY_FLAGS[t.territory] ?? '🌍'} {t.territory.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 capitalize">{t.type}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs text-zinc-500">
                        {t.targetPage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'live' && (
            <div>
              {backlinks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-zinc-500">
                  Aucun backlink enregistré. Utilisez l'onglet "Ajouter" pour en créer.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wide text-zinc-500">
                        <th className="px-4 py-3 text-left">Domaine</th>
                        <th className="px-4 py-3 text-left">Page cible</th>
                        <th className="px-4 py-3 text-left">Ancre</th>
                        <th className="px-4 py-3 text-left">Statut</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backlinks.map((bl, i) => (
                        <tr key={i} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-zinc-200">{bl.sourceDomain}</td>
                          <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-zinc-500">{bl.targetUrl}</td>
                          <td className="px-4 py-3 text-xs text-zinc-400">{bl.anchor ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${BACKLINK_STATUS_COLOR[bl.status]}`}>
                              {bl.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={bl.status}
                              onChange={(e) => {
                                updateBacklinkStatus(bl.sourceDomain, e.target.value as BacklinkRecord['status']);
                                setBacklinks(getBacklinks());
                              }}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                            >
                              <option value="pending">pending</option>
                              <option value="live">live</option>
                              <option value="lost">lost</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'add' && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-5 text-sm font-bold text-white">Ajouter un backlink</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Domaine source *" value={form.sourceDomain ?? ''} onChange={(v) => setForm((f) => ({ ...f, sourceDomain: v }))} placeholder="example.com" />
                <Field label="URL source" value={form.sourceUrl ?? ''} onChange={(v) => setForm((f) => ({ ...f, sourceUrl: v }))} placeholder="https://example.com/article" />
                <Field label="Page cible *" value={form.targetUrl ?? ''} onChange={(v) => setForm((f) => ({ ...f, targetUrl: v }))} placeholder="/guide-prix-alimentaire-dom" />
                <Field label="Ancre" value={form.anchor ?? ''} onChange={(v) => setForm((f) => ({ ...f, anchor: v }))} placeholder="guide prix alimentaire" />
                <Field label="Territoire" value={form.territory ?? ''} onChange={(v) => setForm((f) => ({ ...f, territory: v }))} placeholder="GP" />
                <div>
                  <label htmlFor="outreach-form-status" className="mb-1 block text-xs font-semibold text-zinc-400">Statut</label>
                  <select
                    id="outreach-form-status"
                    value={form.status ?? 'pending'}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BacklinkRecord['status'] }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 focus:border-emerald-400/50 focus:outline-none"
                  >
                    <option value="pending">pending</option>
                    <option value="live">live</option>
                    <option value="lost">lost</option>
                  </select>
                </div>
              </div>
              {formError && <p className="mt-2 text-xs text-rose-400">{formError}</p>}
              <button
                onClick={handleAddBacklink}
                className="mt-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Enregistrer le backlink
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'amber' | 'rose' }) {
  const color = accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-400' : accent === 'rose' ? 'text-rose-400' : 'text-white';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-400/50 focus:outline-none"
      />
    </div>
  );
}
