/**
 * Groupes de Parole Citoyens — A KI PRI SA YÉ
 *
 * Espace d'échange encadré par territoire pour les citoyens
 * concernés par la vie chère dans les territoires ultramarins.
 *
 * Fonctionnalités :
 *  - Groupes filtrés par territoire (drapeau + nom)
 *  - Chat texte + photo
 *  - Modération IA automatique (filtre de mots-clés)
 *  - Comptes utilisateurs vérifiés (Firebase Auth)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  MessageCircle,
  Send,
  Users,
  Plus,
  ArrowLeft,
  Flag,
  Image,
  Loader2,
  X,
  AlertTriangle,
  LogIn,
  LogOut,
  Globe,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  subscribeToGroups,
  subscribeToGroupMessages,
  createGroup,
  joinGroup,
  leaveGroup,
  sendGroupMessage,
  flagMessage,
  type GroupParole,
  type GroupMessage,
} from '../services/groupesParoleService';
import { TERRITORIES, type TerritoryCode } from '../constants/territories';
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

/** Territories shown in the filter — only active ones with a flag */
const ACTIVE_TERRITORIES = Object.values(TERRITORIES).filter((t) => t.active && t.flag);

// ── Component ──────────────────────────────────────────────────────────────────

export default function GroupesParole() {
  const { groupId: routeGroupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Territory filter
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode | null>(null);

  // Groups list
  const [groups, setGroups] = useState<GroupParole[]>([]);

  // Active group + its messages
  const [activeGroupId, setActiveGroupId] = useState<string | null>(routeGroupId ?? null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);

  // Photo URL input (simple URL for now)
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  // Create group modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createTerritory, setCreateTerritory] = useState<TerritoryCode>('gp');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Flag modal
  const [flagMsgId, setFlagMsgId] = useState<string | null>(null);
  const [flagReason, setFlagReasonText] = useState('');
  const [flagging, setFlagging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Auth listener ─────────────────────────────────────────────────────────────
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

  // ── Subscribe to groups ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToGroups(selectedTerritory, setGroups);
    return unsub;
  }, [selectedTerritory]);

  // ── Subscribe to active group messages ────────────────────────────────────────
  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToGroupMessages(activeGroupId, setMessages);
    return unsub;
  }, [activeGroupId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Sync URL param ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (routeGroupId) setActiveGroupId(routeGroupId);
  }, [routeGroupId]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;
  const isMember = activeGroup && user ? activeGroup.members.includes(user.uid) : false;
  const userDisplayName = user?.displayName || user?.email || 'Citoyen';

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSelectGroup = useCallback((id: string) => {
    setActiveGroupId(id);
    navigate(`/groupes-parole/${id}`, { replace: true });
  }, [navigate]);

  const handleBackToList = useCallback(() => {
    setActiveGroupId(null);
    navigate('/groupes-parole', { replace: true });
  }, [navigate]);

  const handleSend = useCallback(async () => {
    if (!user || !activeGroupId || (!newText.trim() && !photoUrl.trim()) || sending) return;
    if (!isMember) return;
    setSending(true);
    try {
      await sendGroupMessage(
        activeGroupId,
        user.uid,
        userDisplayName,
        newText,
        photoUrl.trim() || undefined,
      );
      setNewText('');
      setPhotoUrl('');
      setShowPhotoInput(false);
      inputRef.current?.focus();
    } catch (e) {
      console.error('Erreur envoi message:', e);
    } finally {
      setSending(false);
    }
  }, [user, activeGroupId, newText, photoUrl, sending, isMember, userDisplayName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleJoin = async () => {
    if (!user || !activeGroupId) return;
    try {
      await joinGroup(activeGroupId, user.uid);
    } catch (e) {
      console.error('Erreur rejoindre groupe:', e);
    }
  };

  const handleLeave = async () => {
    if (!user || !activeGroupId) return;
    try {
      await leaveGroup(activeGroupId, user.uid);
    } catch (e) {
      console.error('Erreur quitter groupe:', e);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !createName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const id = await createGroup(
        createTerritory,
        createName,
        createDesc,
        user.uid,
        userDisplayName,
      );
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      handleSelectGroup(id);
    } catch (e) {
      setCreateError('Erreur lors de la création. Réessayez.');
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleFlag = async () => {
    if (!flagMsgId || !activeGroupId || !flagReason.trim()) return;
    // '__report__' is a sentinel for a general group problem report (not a specific message)
    if (flagMsgId === '__report__') {
      setFlagMsgId(null);
      setFlagReasonText('');
      return;
    }
    setFlagging(true);
    try {
      await flagMessage(activeGroupId, flagMsgId, flagReason.trim());
      setFlagMsgId(null);
      setFlagReasonText('');
    } catch (e) {
      console.error('Erreur signalement:', e);
    } finally {
      setFlagging(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 gap-6">
        <Helmet>
          <title>Groupes de Parole — A KI PRI SA YÉ</title>
        </Helmet>
        <div className="text-center mb-2">
          <MessageCircle className="w-14 h-14 text-purple-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-1">Groupes de Parole Citoyens</h1>
          <p className="text-slate-400">Connectez-vous pour participer aux échanges citoyens.</p>
        </div>
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────

  const activeTerritoryInfo = selectedTerritory ? TERRITORIES[selectedTerritory] : null;

  return (
    <>
      <Helmet>
        <title>Groupes de Parole Citoyens — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Échanges citoyens encadrés par territoire sur la vie chère dans les outre-mer."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 pt-16 flex flex-col">
        {/* Hero banner */}
        <div className="px-4 pt-4 pb-0">
          <HeroImage
            src={PAGE_HERO_IMAGES.groupesParole}
            alt="Groupes de Parole Citoyens"
            gradient="from-slate-950 to-teal-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              🗣️ Groupes de Parole Citoyens
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              Échangez avec d'autres consommateurs de votre territoire
            </p>
          </HeroImage>
        </div>
        {/* ── Page header ── */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-16 z-10">
          <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-bold text-white flex-1">
              🗣️ Groupes de Parole Citoyens
            </h1>
            <button
              onClick={() => { setShowCreate(true); setCreateError(''); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              aria-label="Créer un groupe"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Créer un groupe</span>
            </button>
          </div>
        </div>

        {/* ── Territory filter ── */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 sticky top-28 z-10 overflow-x-auto">
          <div className="max-w-6xl mx-auto flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedTerritory(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTerritory === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Tous
            </button>
            {ACTIVE_TERRITORIES.map((t) => (
              <button
                key={t.code}
                onClick={() => setSelectedTerritory(t.code as TerritoryCode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedTerritory === t.code
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={t.name}
              >
                <span>{t.flag}</span>
                <span className="hidden sm:inline">{t.name}</span>
                <span className="sm:hidden">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Create group modal ── */}
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowCreate(false)}
          >
            <GlassCard
              className="w-full max-w-md p-6 space-y-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Créer un groupe de parole</h2>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Territoire *</label>
                  <select
                    value={createTerritory}
                    onChange={(e) => setCreateTerritory(e.target.value as TerritoryCode)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {ACTIVE_TERRITORIES.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nom du groupe *</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Ex: Vie chère à Pointe-à-Pitre"
                    maxLength={80}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Décrivez l'objet du groupe…"
                    rows={3}
                    maxLength={300}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>

              {createError && (
                <p className="text-red-400 text-sm">{createError}</p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={creating || !createName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Créer
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Flag message modal ── */}
        {flagMsgId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setFlagMsgId(null)}
          >
            <GlassCard
              className="w-full max-w-sm p-6 space-y-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-400" />
                  Signaler ce message
                </h2>
                <button onClick={() => setFlagMsgId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400">
                Précisez la raison du signalement. Notre équipe de modération examinera ce message.
              </p>
              <select
                value={flagReason}
                onChange={(e) => setFlagReasonText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">— Choisir une raison —</option>
                <option value="Propos haineux ou discriminatoires">Propos haineux ou discriminatoires</option>
                <option value="Harcèlement ou intimidation">Harcèlement ou intimidation</option>
                <option value="Spam ou publicité">Spam ou publicité</option>
                <option value="Contenu faux ou trompeur">Contenu faux ou trompeur</option>
                <option value="Contenu violent ou choquant">Contenu violent ou choquant</option>
                <option value="Autre raison">Autre raison</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setFlagMsgId(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleFlag}
                  disabled={flagging || !flagReason}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                >
                  {flagging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  Signaler
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Main split layout ── */}
        <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full">
          {/* ── Groups sidebar ── */}
          <aside
            className={`${activeGroupId ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-slate-800 bg-slate-900`}
          >
            {groups.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
                <Users className="w-12 h-12 text-slate-600" />
                <p className="text-slate-400 font-medium">
                  {selectedTerritory
                    ? `Aucun groupe pour ${activeTerritoryInfo?.name ?? selectedTerritory}`
                    : 'Aucun groupe disponible'}
                </p>
                <p className="text-slate-500 text-sm">
                  Cliquez sur <strong className="text-purple-400">Créer un groupe</strong> pour démarrer.
                </p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-slate-800">
                {groups.map((group) => {
                  const territory = TERRITORIES[group.territory];
                  const isActive = group.id === activeGroupId;
                  return (
                    <li key={group.id}>
                      <button
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                          isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                        }`}
                        onClick={() => handleSelectGroup(group.id)}
                      >
                        {/* Territory flag avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                          {territory?.flag ?? '🌐'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate text-sm text-white">
                              {group.name}
                            </span>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {formatTime(group.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {territory?.name ?? group.territory}
                            </span>
                            <span className="text-xs text-slate-600">·</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {group.memberCount}
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* ── Group chat thread ── */}
          {activeGroupId ? (
            <main className="flex flex-col flex-1 min-h-0">
              {/* Thread header */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
                <button
                  className="sm:hidden text-slate-400 hover:text-white"
                  onClick={handleBackToList}
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {activeGroup && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                      {TERRITORIES[activeGroup.territory]?.flag ?? '🌐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{activeGroup.name}</p>
                      <p className="text-xs text-slate-500">
                        {TERRITORIES[activeGroup.territory]?.name} ·{' '}
                        <Users className="w-3 h-3 inline" /> {activeGroup.memberCount} membres
                      </p>
                    </div>
                    {/* Join / Leave button */}
                    {isMember ? (
                      <button
                        onClick={handleLeave}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                        title="Quitter ce groupe"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Quitter</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleJoin}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                        title="Rejoindre ce groupe"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Rejoindre</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm mt-8">
                    {isMember
                      ? 'Aucun message. Lancez la discussion !'
                      : 'Rejoignez le groupe pour voir et envoyer des messages.'}
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.from === user.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        {/* Sender name (only for others) */}
                        {!isMe && (
                          <span className="text-xs text-slate-500 px-1">{msg.fromName}</span>
                        )}
                        <div className="relative">
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              msg.flagged
                                ? 'bg-orange-900/40 border border-orange-700/50 text-orange-200'
                                : isMe
                                ? 'bg-purple-600 text-white rounded-br-sm'
                                : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                            }`}
                          >
                            {msg.flagged && (
                              <div className="flex items-center gap-1 text-xs text-orange-400 mb-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Message signalé — en cours de modération</span>
                              </div>
                            )}
                            {msg.text && (
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            )}
                            {msg.photoUrl && (
                              <a
                                href={msg.photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1"
                              >
                                <img
                                  src={msg.photoUrl}
                                  alt="Photo partagée"
                                  className="max-w-full rounded-lg max-h-48 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </a>
                            )}
                            <p className={`text-xs mt-1 ${isMe ? 'text-purple-200' : 'text-slate-500'}`}>
                              {formatTime(msg.at)}
                            </p>
                          </div>
                          {/* Flag button (visible on hover, not for own messages) */}
                          {!isMe && !msg.flagged && (
                            <button
                              onClick={() => { setFlagMsgId(msg.id); setFlagReasonText(''); }}
                              className="absolute -right-7 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-orange-400 p-1"
                              title="Signaler ce message"
                              aria-label="Signaler ce message"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              {isMember ? (
                <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-2">
                  {/* Photo URL row */}
                  {showPhotoInput && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="URL d'une image (https://…)"
                        className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => { setShowPhotoInput(false); setPhotoUrl(''); }}
                        className="text-slate-400 hover:text-white p-2"
                        aria-label="Annuler photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {/* Text + actions row */}
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => setShowPhotoInput((v) => !v)}
                      className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                        showPhotoInput
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                      aria-label="Ajouter une photo"
                      title="Ajouter une image (URL)"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrire un message… (Entrée pour envoyer)"
                      rows={1}
                      className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-32 overflow-auto"
                      style={{ minHeight: '2.5rem' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || (!newText.trim() && !photoUrl.trim())}
                      aria-label="Envoyer"
                      className="flex-shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    🤖 Modération automatique active · Restez respectueux ·{' '}
                    <button
                      onClick={() => setFlagMsgId('__report__')}
                      className="underline hover:text-slate-400 transition-colors"
                    >
                      Signaler un problème
                    </button>
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900 border-t border-slate-800 px-4 py-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">
                    Rejoignez ce groupe pour participer à la discussion.
                  </p>
                  <button
                    onClick={handleJoin}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 mx-auto"
                  >
                    <LogIn className="w-4 h-4" />
                    Rejoindre le groupe
                  </button>
                </div>
              )}
            </main>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-medium mb-1">Sélectionnez un groupe</p>
                <p className="text-slate-500 text-sm">
                  ou créez-en un nouveau avec{' '}
                  <strong className="text-purple-400">Créer un groupe</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
