/**
 * DetectionFraude — Détection d'anomalies et signalement de hausses suspectes
 * Route : /detection-fraude
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldAlert, TrendingUp, Flag, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Collecte des prix',
    desc: 'Les prix sont collectés en continu via les contributions citoyennes et les enseignes partenaires.',
    done: true,
  },
  {
    step: '2',
    title: 'Calcul des écarts',
    desc: "Chaque prix est comparé à la moyenne territoriale et à l'historique du produit.",
    done: true,
  },
  {
    step: '3',
    title: 'Score d\'anomalie',
    desc: "Un algorithme de scoring détecte les variations statistiquement anormales (> 2σ).",
    done: false,
  },
  {
    step: '4',
    title: 'Alerte et signalement',
    desc: "Les anomalies sont remontées pour validation humaine avant signalement public.",
    done: false,
  },
];

const EXISTING_TOOLS = [
  { label: 'Signaler un abus de prix', route: '/signalement', icon: Flag },
  { label: 'Observatoire des prix', route: '/observatoire', icon: BarChart2 },
  { label: 'Alertes prix personnalisées', route: '/alertes-prix', icon: AlertTriangle },
  { label: 'Rapport citoyen', route: '/rapport-citoyen', icon: TrendingUp },
];

export default function DetectionFraude() {
  return (
    <>
      <Helmet>
        <title>Détection de fraude et anomalies de prix — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Signalement des hausses de prix inhabituelles et détection automatique des anomalies via apprentissage automatique — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/detection-fraude" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.detectionFraude}
            alt="Détection de fraude et anomalies de prix"
            gradient="from-slate-950 to-red-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-red-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-red-300">
                Détection fraude
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              🚨 Détection de fraude
            </h1>
            <p className="text-red-100 text-sm mt-1 drop-shadow">
              Signalement des hausses de prix inhabituelles et anomalies détectées par IA
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          {/* Intro */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              Les DOM-COM sont particulièrement exposés aux hausses de prix injustifiées.
              Ce module combine la surveillance citoyenne et des algorithmes de détection automatique
              pour identifier et signaler les anomalies de prix aux autorités compétentes
              (DGCCRF, observatoires locaux).
            </p>
          </div>

          {/* Pipeline de détection */}
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">🔍 Comment ça marche</h2>
            {HOW_IT_WORKS.map(({ step, title, desc, done }) => (
              <div key={step} className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                  ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{title}</p>
                    {done ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">V3</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Signalement citoyen */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Signalez un abus dès maintenant</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">
              Sans attendre l'automatisation, vous pouvez déjà signaler manuellement
              toute hausse de prix suspecte observée dans votre territoire.
            </p>
            <Link
              to="/signalement"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <Flag className="w-4 h-4" />
              Signaler un abus
            </Link>
          </div>

          {/* Outils disponibles */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">🔧 Outils de surveillance disponibles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXISTING_TOOLS.map(({ label, route, icon: Icon }) => (
                <Link
                  key={label}
                  to={route}
                  className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Icon className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
