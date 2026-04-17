/**
 * AppMobile — Page paramètres et infos de l'app mobile Capacitor
 * Route : /app-mobile
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Smartphone,
  Bell,
  BellOff,
  Trash2,
  HardDrive,
  AppWindow,
  QrCode,
  ShoppingBag,
  CheckCircle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  isNative,
  getPlatform,
  requestPushPermission,
  getLocalCacheSize,
  clearOldCache,
} from '../services/mobileService';

const APP_VERSION = '4.6.20';

export default function AppMobile() {
  const [platform] = useState<'ios' | 'android' | 'web'>(getPlatform);
  const [native] = useState<boolean>(isNative);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [cacheInfo, setCacheInfo] = useState(getLocalCacheSize);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  }, []);

  const handlePushToggle = useCallback(async () => {
    if (pushEnabled) {
      toast('Les notifications doivent être désactivées dans les paramètres du navigateur.', {
        icon: 'ℹ️',
      });
      return;
    }
    const granted = await requestPushPermission();
    setPushEnabled(granted);
    toast(granted ? '🔔 Notifications activées !' : '🔕 Permission refusée', {
      icon: granted ? '✅' : '❌',
    });
  }, [pushEnabled]);

  const handleClearCache = useCallback(async () => {
    setClearing(true);
    await new Promise((r) => setTimeout(r, 500));
    const removed = clearOldCache();
    setCacheInfo(getLocalCacheSize());
    setClearing(false);
    toast.success(`${removed} entrée(s) obsolète(s) supprimée(s)`);
  }, []);

  const platformLabel = platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Web';
  const platformIcon = platform === 'ios' ? '🍎' : platform === 'android' ? '🤖' : '🌐';

  return (
    <>
      <Helmet>
        <title>App Mobile — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Informations sur l'application mobile A KI PRI SA YÉ — iOS, Android, cache, push notifications."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-violet-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                App Mobile
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">📱 A KI PRI SA YÉ Mobile</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Paramètres, cache, notifications push et informations de l'app native
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
          {/* ── Device info ── */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AppWindow className="w-5 h-5 text-violet-400" />
              <h2 className="text-base font-bold text-white">Infos appareil</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Plateforme</p>
                <p className="font-semibold text-white">
                  {platformIcon} {platformLabel}
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Mode</p>
                <p className="font-semibold text-white">
                  {native ? '📦 Natif Capacitor' : '🌐 Web browser'}
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Version app</p>
                <p className="font-semibold text-white">v{APP_VERSION}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">App ID</p>
                <p className="font-semibold text-white font-mono text-xs">com.akiprisaye.app</p>
              </div>
            </div>
          </section>

          {/* ── Cache mobile ── */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-yellow-400" />
              <h2 className="text-base font-bold text-white">Cache mobile</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Entrées stockées</p>
                <p className="text-2xl font-black text-white">{cacheInfo.items}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Taille estimée</p>
                <p className="text-2xl font-black text-white">{cacheInfo.estimatedKB} KB</p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="flex items-center gap-2 bg-rose-700 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {clearing ? 'Nettoyage…' : 'Vider le cache'}
            </button>
          </section>

          {/* ── Push notifications ── */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              {pushEnabled ? (
                <Bell className="w-5 h-5 text-emerald-400" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
              <h2 className="text-base font-bold text-white">Notifications push</h2>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {pushEnabled ? 'Activées' : 'Désactivées'}
                </p>
                <p className="text-xs text-slate-400">
                  {pushEnabled
                    ? 'Vous recevrez les alertes de prix et rappels produits.'
                    : 'Activez pour recevoir les alertes en temps réel.'}
                </p>
              </div>
              <button
                onClick={handlePushToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushEnabled ? 'bg-emerald-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 flex gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                Sur iOS/Android natif, les push utilisent{' '}
                <strong>@capacitor/push-notifications</strong>. En mode web, l'API Notification du
                navigateur est utilisée.
              </p>
            </div>
          </section>

          {/* ── Facturation stores ── */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">Facturation app stores</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App Store iOS */}
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <p className="font-bold text-white text-sm">App Store</p>
                    <p className="text-xs text-slate-400">iOS · iPadOS</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-slate-200">
                      Abonnement Pro : <strong className="text-white">2,99 €/mois</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-slate-200">
                      Annuel : <strong className="text-white">24,99 €/an</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Play */}
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-bold text-white text-sm">Google Play</p>
                    <p className="text-xs text-slate-400">Android</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-slate-200">
                      Abonnement Pro : <strong className="text-white">2,99 €/mois</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-slate-200">
                      Annuel : <strong className="text-white">24,99 €/an</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-violet-900/20 border border-violet-700/30 rounded-lg p-3 flex gap-2">
              <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-200">
                Disponible sur l'App Store et Google Play — <strong>sortie prévue T3 2026</strong>.
                Commission Apple/Google : 30% (15% small business).
              </p>
            </div>
          </section>

          {/* ── QR Code ── */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-white">QR Code de téléchargement</h2>
            </div>
            <div className="flex flex-col items-center justify-center bg-slate-900 rounded-xl border-2 border-dashed border-slate-600 py-12 gap-3">
              <QrCode className="w-16 h-16 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">QR code de téléchargement</p>
              <p className="text-xs text-slate-500">Disponible bientôt — T3 2026</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
