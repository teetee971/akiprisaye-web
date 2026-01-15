import React from 'react';
import { Check, Sparkles, TrendingUp, Shield, Zap, X, Lock, Database, FileText, Bell, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pricingPlans = [
  {
    id: 'citoyen',
    name: 'CITOYEN',
    icon: '🟢',
    price: '0',
    period: '€ / mois',
    subtitle: 'Gratuite – sans limite',
    description: 'Toujours gratuit',
    features: [
      'Accès complet aux données publiques observées',
      'Fiches enseignes (localisation GPS, infos pratiques)',
      'Produits les moins chers par magasin',
      'Ajout de produits observés au panier citoyen',
      'Comparateurs essentiels : Vols, Bateaux/ferries, Forfaits mobiles & internet, Eau & électricité',
      'Modules pédagogiques (prix, logistique, délais)',
      'Glossaire & FAQ citoyenne',
      'Sans compte obligatoire',
      'Sans publicité – sans affiliation',
    ],
    cta: 'Commencer gratuitement',
    ctaLink: '/',
    popular: false,
    note: '📌 Objectif : informer, comprendre, comparer. Cette formule restera toujours gratuite.',
    color: 'from-green-600 to-green-700',
    badge: null,
  },
  {
    id: 'citoyen_plus',
    name: 'CITOYEN+',
    icon: '🔵',
    price: '3,99',
    period: '€ / mois',
    subtitle: 'Confort & gain de temps',
    annualPrice: '39 € / an',
    description: 'ou 39 € / an',
    features: [
      'Tout le mode Citoyen',
      'Comparaison multi-enseignes sur votre panier',
      'Historique des prix (3, 6, 12 mois)',
      'Filtres avancés (territoire, période, type de produit)',
      'Export PDF "panier observé"',
      'Interface allégée (moins d\'écrans pédagogiques répétitifs)',
      'Accès prioritaire aux nouvelles fonctionnalités de confort',
    ],
    cta: 'Choisir Citoyen+',
    ctaLink: '/inscription?plan=citoyen_plus',
    popular: true,
    note: '📌 Objectif : gagner du temps sans perdre en neutralité. Aucune recommandation, aucun conseil d\'achat.',
    color: 'from-blue-600 to-blue-700',
    badge: '⭐ Populaire',
  },
  {
    id: 'analyse',
    name: 'ANALYSE',
    icon: '🟣',
    price: '9,90',
    period: '€ / mois',
    subtitle: 'Associations · Journalistes · Experts · Institutions',
    annualPrice: '99 € / an',
    description: 'ou 99 € / an',
    features: [
      'Tout Citoyen+',
      'Indices territoriaux détaillés',
      'Comparaisons DOM ↔ Métropole',
      'Accès complet aux modules logistiques : fret maritime & aérien, délais & tensions, chaîne complète',
      'Historique étendu multi-années',
      'Exports CSV & graphiques',
      'Vue agrégée multi-territoires',
      'Données prêtes pour étude, rapport ou publication',
    ],
    cta: 'Choisir Analyse',
    ctaLink: '/inscription?plan=analyse',
    popular: false,
    note: '📌 Objectif : analyser, documenter, expliquer.',
    warning: '⚠️ Toujours : pas de notation de territoire, pas de jugement, pas de prédiction, pas d\'affiliation',
    color: 'from-purple-600 to-purple-700',
    badge: null,
  },
];

const optionalFeatures = [
  { id: 'history_extended', name: 'Historique étendu 24–36 mois', icon: '📊', price: '+1,99 €' },
  { id: 'exports_unlimited', name: 'Exports illimités', icon: '📁', price: '+1,99 €' },
  { id: 'price_alerts', name: 'Alertes de variation de prix observé', icon: '🔔', price: '+2,99 €' },
  { id: 'monthly_report', name: 'Rapport mensuel automatique (PDF)', icon: '🧾', price: '+2,99 €' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (planId: string) => {
    const target = `/inscription?plan=${planId}`;
    if (!user) {
      navigate(`/connexion?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-md border-b border-blue-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Observatoire citoyen des prix – données publiques agrégées
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            💰 Tarifs & Accès
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
            A KI PRI SA YÉ
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Observatoire citoyen des prix – données publiques agrégées
          </p>
        </div>
      </div>

      {/* Fundamental Principle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-2xl p-8 mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                🔒 Principe fondamental
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed mb-4">
                <strong>L'accès à l'information citoyenne reste gratuit. Toujours.</strong>
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                A KI PRI SA YÉ est un outil d'information, pas un service commercial.
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                Les données affichées sont publiques, observées, descriptives, <strong>sans affiliation</strong>, <strong>sans publicité</strong>, <strong>sans vente de données</strong>.
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Les formules payantes servent uniquement à financer :
              </p>
              <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 ml-4 mt-2 space-y-1">
                <li>l'analyse</li>
                <li>l'agrégation</li>
                <li>les outils de confort</li>
                <li>et la maintenance de la plateforme</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-2 ${
                plan.popular
                  ? 'border-blue-500 dark:border-blue-600 transform scale-105'
                  : 'border-slate-200 dark:border-slate-700'
              } p-6 flex flex-col transition-all hover:shadow-xl`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-full shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Icon & Title */}
              <div className="mb-4">
                <div className="text-4xl mb-3">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {plan.subtitle}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-lg text-slate-600 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>
                {plan.annualPrice && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {plan.annualPrice}
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note */}
              {plan.note && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {plan.note}
                  </p>
                </div>
              )}

              {/* Warning */}
              {plan.warning && (
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    {plan.warning}
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 px-6 text-center font-bold rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                    : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            ➕ Options (facultatives)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            (Aucune option ne bloque l'accès citoyen)
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {optionalFeatures.map((feature) => (
              <div
                key={feature.id}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                  {feature.name}
                </h3>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {feature.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transparency & Ethics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            🧭 Transparence & cadre éthique
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                Ce que fait A KI PRI SA YÉ
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Observer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Comparer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Décrire</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Expliquer</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                Ce que l'outil ne fait pas
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Ne conseille pas</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Ne vend pas</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Ne classe pas les territoires</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Ne collecte pas de données personnelles sensibles</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Ne suit pas les utilisateurs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Why Paid Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center">
            📘 Pourquoi certaines fonctionnalités sont payantes ?
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-center mb-4 max-w-3xl mx-auto">
            Les données observées restent accessibles gratuitement.
          </p>
          <p className="text-slate-700 dark:text-slate-300 text-center mb-6 max-w-3xl mx-auto">
            Les formules payantes financent :
          </p>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">l'infrastructure</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">l'agrégation intelligente</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">l'historique</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
              <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">les outils d'analyse</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-center mt-6 text-sm">
            sans publicité, sans affiliation, sans conflit d'intérêt.
          </p>
        </div>
      </div>

      {/* Public Commitment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">
                🔔 Engagement public
              </h2>
              <p className="text-blue-100 mb-4 leading-relaxed">
                A KI PRI SA YÉ s'engage à maintenir :
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>un socle citoyen gratuit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>une neutralité stricte</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>une transparence totale sur ses méthodes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
