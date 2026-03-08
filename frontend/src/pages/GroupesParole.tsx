/**
 * Groupes de Parole Citoyens — A KI PRI SA YÉ
 *
 * Permet aux utilisateurs de créer des groupes de discussion citoyens
 * et d'y publier des messages modérés.
 * Stockage : Firebase Firestore (collection "groupes_parole").
 */

import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, Plus, ArrowLeft, Send, Loader2, MessageSquare, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  subscribeToGroupes,
  subscribeToMessages,
  createGroupe,
  postMessage,
  type GroupeParole,
  type GroupeMessage,
} from '../services/groupesParoleService';
import { GlassCard } from '../components/ui/glass-card';
import AuthForm from '../components/AuthForm';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(ts: { toDate?: () => Date } | null): string {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const TERRITORIES = [
  { value: 'Guadeloupe', label: '🇬🇵 Guadeloupe' },
  { value: 'Martinique', label: '🇲🇶 Martinique' },
  { value: 'Guyane', label: '🇬🇫 Guyane' },
  { value: 'La Réunion', label: '🇷🇪 La Réunion' },
  { value: 'Mayotte', label: '🇾🇹 Mayotte' },
  { value: 'Saint-Martin', label: '🇲🇫 Saint-Martin' },
  { value: 'Saint-Barthélemy', label: '🇧🇱 Saint-Barthélemy' },
  { value: 'Saint-Pierre-et-Miquelon', label: '🇵🇲 Saint-Pierre-et-Miquelon' },
  { value: 'Wallis-et-Futuna', label: '🇼🇫 Wallis-et-Futuna' },
  { value: 'Polynésie française', label: '🇵🇫 Polynésie française' },
  { value: 'Nouvelle-Calédonie', label: '🇳🇨 Nouvelle-Calédonie' },
  { value: 'France métropolitaine', label: '🇫🇷 France métropolitaine' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function GroupesParole() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [groupes, setGroupes] = useState<GroupeParole[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GroupeMessage[]>([]);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // New group panel
  const [showNewGroupe, setShowNewGroupe] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTerritory, setNewTerritory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Auth listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // ── Subscribe to groups ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToGroupes(setGroupes);
    return unsub;
  }, []);

  // ── Subscribe to messages of active group ────────────────────────────────────
  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(activeGroupId, setMessages);
    return unsub;
  }, [activeGroupId]);

  // ── Auto-scroll messages ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeGroupe = groupes.find((g) => g.id === activeGroupId) ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!user || !activeGroupId || !newText.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      const name = user.displayName || user.email || 'Citoyen';
      await postMessage(activeGroupId, newText, user.uid, name);
      setNewText('');
      inputRef.current?.focus();
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateGroupe = async () => {
    if (!user || !newTitle.trim() || !newTerritory || !newDescription.trim()) {
      setCreateError('Veuillez remplir tous les champs.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const name = user.displayName || user.email || 'Citoyen';
      const id = await createGroupe(newTitle, newTerritory, newDescription, user.uid, name);
      setShowNewGroupe(false);
      setNewTitle('');
      setNewTerritory('');
      setNewDescription('');
      setActiveGroupId(id);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 gap-6">
        <Helmet>
          <title>Groupes de Parole Citoyens — A KI PRI SA YÉ</title>
        </Helmet>
        <div className="text-center mb-2">
          <Users className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-1">Groupes de Parole Citoyens</h1>
          <p className="text-slate-400">Connectez-vous pour participer aux discussions citoyennes.</p>
        </div>
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>Groupes de Parole Citoyens — A KI PRI SA YÉ</title>
        <meta name="description" content="Espaces de discussion citoyens sur la vie chère et les prix en outre-mer" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 pt-16 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 sticky top-16 z-10">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Users className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white flex-1">Groupes de Parole Citoyens</h1>
          {user && (
            <button
              onClick={() => { setShowNewGroupe(true); setCreateError(''); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
              aria-label="Créer un groupe"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau groupe</span>
            </button>
          )}
        </div>

        {/* New group modal */}
        {showNewGroupe && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowNewGroupe(false)}
          >
            <GlassCard
              className="w-full max-w-md p-6 space-y-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Créer un groupe de parole</h2>
                <button onClick={() => setShowNewGroupe(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Titre du groupe *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex : Prix des fruits et légumes en Martinique"
                    maxLength={120}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Territoire *</label>
                  <select
                    value={newTerritory}
                    onChange={(e) => setNewTerritory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Sélectionnez un territoire --</option>
                    {TERRITORIES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Description *</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Décrivez le sujet de discussion de ce groupe…"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                {createError && (
                  <p className="text-red-400 text-sm">{createError}</p>
                )}
                <button
                  onClick={handleCreateGroupe}
                  disabled={creating || !newTitle.trim() || !newTerritory || !newDescription.trim()}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Créer le groupe
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full">
          {/* Group list */}
          <aside
            className={`${activeGroupId ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-slate-800 bg-slate-900`}
          >
            {groupes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
                <Users className="w-12 h-12 text-slate-600" />
                <p className="text-slate-400 font-medium">Aucun groupe pour l'instant</p>
                <p className="text-slate-500 text-sm">
                  Cliquez sur <strong className="text-emerald-400">Nouveau groupe</strong> pour lancer une discussion.
                </p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-slate-800">
                {groupes.map((g) => {
                  const isActive = g.id === activeGroupId;
                  return (
                    <li key={g.id}>
                      <button
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                          isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                        }`}
                        onClick={() => setActiveGroupId(g.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {g.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm text-white">{g.title}</p>
                          <p className="text-xs text-emerald-400 truncate">{g.territory}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{g.description}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Message thread */}
          {activeGroupId ? (
            <main className="flex flex-col flex-1 min-h-0">
              {/* Thread header */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
                <button
                  className="sm:hidden text-slate-400 hover:text-white"
                  onClick={() => setActiveGroupId(null)}
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {activeGroupe && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {activeGroupe.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{activeGroupe.title}</p>
                      <p className="text-xs text-emerald-400">{activeGroupe.territory}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Group description banner */}
              {activeGroupe?.description && (
                <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-2">
                  <p className="text-xs text-slate-400 italic">{activeGroupe.description}</p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm mt-8">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                    Soyez le premier à prendre la parole !
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.authorUid === user.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isMe ? '' : 'flex items-end gap-2'}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1">
                            {msg.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          {!isMe && (
                            <p className="text-xs text-slate-400 mb-0.5 ml-1">{msg.authorName}</p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-sm'
                                : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-emerald-200' : 'text-slate-500'}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-2">
                {sendError && (
                  <p className="text-red-400 text-xs">{sendError}</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Prendre la parole… (Entrée pour envoyer)"
                    rows={1}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none max-h-32 overflow-auto"
                    style={{ minHeight: '2.5rem' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newText.trim()}
                    aria-label="Envoyer"
                    className="flex-shrink-0 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </main>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center text-center p-8">
              <div>
                <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-medium mb-1">Sélectionnez un groupe</p>
                <p className="text-slate-500 text-sm">
                  ou créez-en un nouveau avec le bouton <strong className="text-emerald-400">Nouveau groupe</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
