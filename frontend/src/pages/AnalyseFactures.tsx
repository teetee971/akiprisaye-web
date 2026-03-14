/**
 * AnalyseFactures — Analyse des factures par OCR et IA
 * Route : /analyse-factures
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  FileText, Upload, BarChart2, TrendingUp, Download, AlertTriangle, ScanLine
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const CAPABILITIES = [
  {
    icon: Upload,
    title: 'Upload de factures',
    desc: 'Importez vos tickets de caisse ou factures au format PDF ou photo.',
    available: false,
    plannedVersion: 'V3',
  },
  {
    icon: ScanLine,
    title: 'OCR des reçus (en développement)',
    desc: 'Scan de tickets de caisse via OCR Tesseract.js intégré dans le scanner.',
    available: true,
    route: '/scan-ocr',
  },
  {
    icon: BarChart2,
    title: 'Catégorisation automatique',
    desc: 'Les dépenses sont classées automatiquement (alimentation, hygiène, etc.).',
    available: false,
    plannedVersion: 'V3',
  },
  {
    icon: TrendingUp,
    title: 'Tendances de dépenses',
    desc: 'Graphiques mensuels de vos habitudes de consommation par catégorie.',
    available: false,
    plannedVersion: 'V3',
  },
  {
    icon: Download,
    title: 'Export CSV / PDF',
    desc: 'Téléchargez votre rapport de dépenses en CSV ou PDF.',
    available: false,
    plannedVersion: 'V3',
  },
];

const ALTERNATIVE_TOOLS = [
  { label: 'Scanner OCR tickets de caisse', route: '/scan-ocr', icon: ScanLine },
  { label: 'Historique de mes recherches', route: '/historique-prix', icon: FileText },
  { label: 'Mes économies réalisées', route: '/mes-economies', icon: TrendingUp },
  { label: 'Simulateur budget familial', route: '/simulateur-budget', icon: BarChart2 },
];

export default function AnalyseFactures() {
  return (
    <>
      <Helmet>
        <title>Analyse des factures — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Analysez vos factures et tickets de caisse pour suivre vos dépenses et détecter les hausses de prix — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/analyse-factures" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.analyseFactures}
            alt="Analyse des factures et tickets de caisse"
            gradient="from-slate-950 to-violet-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-violet-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                Analyse financière
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              🧾 Analyse des factures
            </h1>
            <p className="text-violet-100 text-sm mt-1 drop-shadow">
              Historique des dépenses et analyse des tendances par extraction intelligente
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          {/* Avertissement */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Module en développement (V3)</p>
              <p className="text-sm text-amber-700 mt-0.5">
                L'analyse complète des factures PDF avec catégorisation automatique est prévue en V3.
                En attendant, utilisez le scanner OCR pour analyser vos tickets de caisse.
              </p>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">Fonctionnalités prévues</h2>
            {CAPABILITIES.map(({ icon: Icon, title, desc, available, plannedVersion, route }) => (
              <div
                key={title}
                className={`flex gap-4 bg-white border rounded-xl p-4 ${available ? 'border-gray-200' : 'border-dashed border-gray-300'}`}
              >
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${available ? 'bg-violet-50' : 'bg-gray-50'}`}>
                  <Icon className={`w-5 h-5 ${available ? 'text-violet-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{title}</p>
                    {available ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Disponible
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {plannedVersion}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  {available && route && (
                    <Link
                      to={route}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium mt-1 inline-block"
                    >
                      Essayer maintenant →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Alternatives disponibles */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">🔧 Outils disponibles dès maintenant</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALTERNATIVE_TOOLS.map(({ label, route, icon: Icon }) => (
                <Link
                  key={label}
                  to={route}
                  className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-colors"
                >
                  <Icon className="w-4 h-4 text-violet-600 flex-shrink-0" />
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
