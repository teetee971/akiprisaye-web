/**
 * Messagerie interne — A KI PRI SA YÉ
 *
 * Permet aux utilisateurs connectés de s'envoyer des messages privés.
 * Stockage : Firebase Firestore (collection "conversations").
 * Temps réel via onSnapshot.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, UserPlus, ArrowLeft, Search, Loader2, X } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  subscribeToConversations,
  subscribeToMessages,
  getOrCreateConversation,
  sendMessage,
  markAsRead,
  findUserByEmail,
  type Conversation,
  type Message,
} from '../services/messagingService';
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

function displayName(conv: Conversation, myUid: string): string {
  const otherUid = conv.participants.find((p) => p !== myUid) ?? '';
  return conv.participantNames[otherUid] || 'Utilisateur';
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Messagerie() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);

  // Archiving & export
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('akiprisaye_archived_convs');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });
  const [showArchived, setShowArchived] = useState(false);

  // New conversation panel
  const [showNewConv, setShowNewConv] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

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

  // ── Subscribe to conversations ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  // ── Subscribe to active conversation messages ────────────────────────────────
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(activeConvId, setMessages);
    return unsub;
  }, [activeConvId]);

  // ── Auto-scroll messages ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Mark as read when opening a conversation ─────────────────────────────────
  useEffect(() => {
    if (activeConvId && user) {
      markAsRead(activeConvId, user.uid).catch(() => {});
    }
  }, [activeConvId, user]);

  // ── Active conversation object ───────────────────────────────────────────────
  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!user || !activeConvId || !newText.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(activeConvId, user.uid, newText, activeConv?.participants ?? []);
      setNewText('');
      inputRef.current?.focus();
    } catch (e) {
      console.error('Erreur envoi message:', e);
    } finally {
      setSending(false);
    }
  }, [user, activeConvId, newText, sending, activeConv]);

  const toggleArchive = (convId: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
        if (activeConvId === convId) setActiveConvId(null);
      }
      try {
        localStorage.setItem('akiprisaye_archived_convs', JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  };

  const exportConversationCSV = () => {
    if (messages.length === 0 || !activeConv || !user) return;
    const name = displayName(activeConv, user.uid);
    const rows = [
      ['De', 'À', 'Message', 'Date'],
      ...messages.map((m) => {
        const isMe = m.from === user.uid;
        const fromLabel = isMe ? (user.displayName || user.email || 'Moi') : name;
        const toLabel = isMe ? name : (user.displayName || user.email || 'Moi');
        const date = m.at?.toDate ? m.at.toDate().toLocaleString('fr-FR') : '';
        return [fromLabel, toLabel, m.text.replace(/"/g, '""'), date];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${name.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartConversation = async () => {
    if (!user || !searchEmail.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      if (searchEmail.trim().toLowerCase() === user.email?.toLowerCase()) {
        setSearchError('Vous ne pouvez pas vous envoyer un message à vous-même.');
        return;
      }
      const found = await findUserByEmail(searchEmail.trim());
      if (!found) {
        setSearchError('Aucun utilisateur trouvé avec cet e-mail. Il doit être inscrit sur A KI PRI SA YÉ.');
        return;
      }
      const myName = user.displayName || user.email || user.uid;
      const convId = await getOrCreateConversation(user.uid, myName, found.uid, found.displayName);
      setActiveConvId(convId);
      setShowNewConv(false);
      setSearchEmail('');
    } catch (e) {
      setSearchError('Erreur lors de la recherche. Réessayez.');
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 gap-6">
        <Helmet>
          <title>Messagerie — A KI PRI SA YÉ</title>
        </Helmet>
        <div className="text-center mb-2">
          <MessageCircle className="w-14 h-14 text-blue-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-1">Messagerie interne</h1>
          <p className="text-slate-400">Connectez-vous pour accéder à vos messages.</p>
        </div>
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread[user.uid] ?? 0), 0);

  return (
    <>
      <Helmet>
        <title>Messagerie{totalUnread > 0 ? ` (${totalUnread})` : ''} — A KI PRI SA YÉ</title>
        <meta name="description" content="Messagerie interne entre utilisateurs A KI PRI SA YÉ" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 pt-10 flex flex-col">
        {/* Hero banner */}
        <div className="px-4 pt-4 pb-0">
          <HeroImage
            src={PAGE_HERO_IMAGES.messagerie}
            alt="Messagerie"
            gradient="from-slate-950 to-blue-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              💬 Messagerie
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              Vos messages et échanges avec la communauté
            </p>
          </HeroImage>
        </div>
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 sticky top-16 z-10">
          <Link to="/mon-compte" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white flex-1">
            Messagerie
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                {totalUnread}
              </span>
            )}
          </h1>
          <button
            onClick={() => { setShowNewConv(true); setSearchError(''); setSearchEmail(''); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            aria-label="Nouvelle conversation"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>

        {/* New conversation modal */}
        {showNewConv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/60 cursor-default"
              onClick={() => setShowNewConv(false)}
              tabIndex={-1}
              aria-label="Fermer"
            />
            <GlassCard className="relative z-10 w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Nouvelle conversation</h2>
                <button onClick={() => setShowNewConv(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400">
                Entrez l'adresse e-mail d'un utilisateur inscrit sur A KI PRI SA YÉ.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartConversation()}
                  placeholder="email@exemple.fr"
                  className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleStartConversation}
                  disabled={searchLoading || !searchEmail.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              {searchError && (
                <p className="text-red-400 text-sm">{searchError}</p>
              )}
            </GlassCard>
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full">
          {/* Conversation list */}
          <aside
            className={`${activeConvId ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-slate-800 bg-slate-900`}
          >
            {conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
                <MessageCircle className="w-12 h-12 text-slate-600" />
                <p className="text-slate-400 font-medium">Aucune conversation</p>
                <p className="text-slate-500 text-sm">
                  Cliquez sur <strong className="text-blue-400">Nouveau</strong> pour démarrer un échange.
                </p>
              </div>
            ) : (
              <>
                {/* Archive toggle */}
                {archivedIds.size > 0 && (
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-300 border-b border-slate-800 text-left flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" /></svg>
                    {showArchived ? 'Masquer les archivées' : `Voir les archivées (${archivedIds.size})`}
                  </button>
                )}
                <ul className="flex-1 overflow-y-auto divide-y divide-slate-800">
                  {conversations
                    .filter((c) => showArchived ? archivedIds.has(c.id) : !archivedIds.has(c.id))
                    .map((conv) => {
                      const name = displayName(conv, user.uid);
                      const unreadCount = conv.unread[user.uid] ?? 0;
                      const isActive = conv.id === activeConvId;
                      const isArchived = archivedIds.has(conv.id);
                      return (
                        <li key={conv.id}>
                          <div className={`flex items-center pr-1 ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}>
                            <button
                              className="flex-1 text-left px-4 py-3 flex items-start gap-3 transition-colors"
                              onClick={() => setActiveConvId(conv.id)}
                            >
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-semibold truncate text-sm ${unreadCount > 0 ? 'text-white' : 'text-slate-300'}`}>
                                    {name}
                                    {isArchived && <span className="ml-1 text-yellow-500 text-xs">📦</span>}
                                  </span>
                                  <span className="text-xs text-slate-500 flex-shrink-0">
                                    {formatTime(conv.lastAt)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {conv.lastMessage || 'Démarrer la conversation…'}
                                  </p>
                                  {unreadCount > 0 && (
                                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full text-xs text-white font-bold flex items-center justify-center">
                                      {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                            {/* Archive quick button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleArchive(conv.id); }}
                              title={isArchived ? 'Désarchiver' : 'Archiver'}
                              className="p-2 text-slate-600 hover:text-yellow-400 transition-colors"
                              aria-label={isArchived ? 'Désarchiver la conversation' : 'Archiver la conversation'}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" /></svg>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}
          </aside>

          {/* Message thread */}
          {activeConvId ? (
            <main className="flex flex-col flex-1 min-h-0">
              {/* Thread header */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
                <button
                  className="sm:hidden text-slate-400 hover:text-white"
                  onClick={() => setActiveConvId(null)}
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {activeConv && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {displayName(activeConv, user.uid).charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white text-sm flex-1">{displayName(activeConv, user.uid)}</span>
                    <button
                      onClick={exportConversationCSV}
                      disabled={messages.length === 0}
                      title="Exporter la conversation en CSV"
                      className="text-slate-400 hover:text-green-400 disabled:opacity-30 transition-colors p-1"
                      aria-label="Exporter la conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button
                      onClick={() => activeConvId && toggleArchive(activeConvId)}
                      title={activeConvId && archivedIds.has(activeConvId) ? 'Désarchiver' : 'Archiver la conversation'}
                      className="text-slate-400 hover:text-yellow-400 transition-colors p-1"
                      aria-label="Archiver/désarchiver"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" /></svg>
                    </button>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm mt-8">
                    Aucun message. Envoyez le premier !
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.from === user.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                          {formatTime(msg.at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message… (Entrée pour envoyer)"
                  rows={1}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 overflow-auto"
                  style={{ minHeight: '2.5rem' }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newText.trim()}
                  aria-label="Envoyer"
                  className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </main>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-medium mb-1">Sélectionnez une conversation</p>
                <p className="text-slate-500 text-sm">ou créez-en une nouvelle avec le bouton <strong className="text-blue-400">Nouveau</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
