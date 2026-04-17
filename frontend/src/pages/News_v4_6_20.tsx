/**
 * News_v4_6_20.tsx — Release note v4.6.20 "Horizon Souverain"
 *
 * Page dédiée à la note de version v4.6.20 présentant l'explosion du
 * gisement de données, le moteur d'arbitrage géographique et le focus
 * souveraineté & circuits courts.
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Database, MapPin, Leaf, Cpu, ArrowLeft, ExternalLink } from 'lucide-react';

interface Section {
  icon: React.ReactNode;
  title: string;
  items: string[];
}

const SECTIONS: Section[] = [
  {
    icon: <Database className="w-5 h-5 text-emerald-400" />,
    title: '📊 Explosion du Gisement de Données',
    items: [
      'Le catalogue passe de quelques dizaines à 254 articles réels audités sur le terrain.',
      "Zone de couverture étendue : Le Moule, Saint-François, Morne-à-l'Eau et Les Abymes.",
      'Nouvelles enseignes : Carrefour Milenis, U Express, Carrefour Market Bayside, Leader Price et Shilo H Int.',
    ],
  },
  {
    icon: <MapPin className="w-5 h-5 text-amber-400" />,
    title: "📉 Moteur d'Arbitrage Géographique",
    items: [
      "Détection d'anomalies : écarts allant jusqu'à 42 % sur l'huile de tournesol et 31 % sur les tomates locales entre communes voisines.",
      'Optimisation de panier : comparez instantanément vos marques préférées (Coca-Cola, Kiri, Nutella) entre formats "Express" et Hyper.',
    ],
  },
  {
    icon: <Leaf className="w-5 h-5 text-green-400" />,
    title: '🇬🇵 Focus Souveraineté & Circuits Courts',
    items: [
      'Sucre de Marie-Galante (Grande-Anse) vs Sachet Gardel.',
      'Farine GMA (Grands Moulins des Antilles — Jarry).',
      'Rhum Damoiseau 50 % (Le Moule — Bellevue).',
    ],
  },
  {
    icon: <Cpu className="w-5 h-5 text-sky-400" />,
    title: '⚙️ Hardening Technique (Codex Engine)',
    items: [
      'Intelligence Artificielle : le moteur de recherche utilise désormais la Similarité de Jaccard pour reconnaître les produits même si les libellés sur les tickets sont abrégés.',
      "Scan Mobile Ready : injection massive de codes EAN (codes-barres). L'application est prête pour le scan en rayon.",
      'Infrastructure Industrielle : migration réussie vers un environnement de build 2 vCPU / 1 Go RAM sur Railway pour une fluidité totale malgré le poids des données.',
    ],
  },
];

export default function News_v4_6_20() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>v4.6.20 "Horizon Souverain" — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Release note v4.6.20 : 254 articles audités, moteur d'arbitrage géographique, focus souveraineté et hardening technique Codex Engine."
        />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Back link */}
        <Link
          to="/versions"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux versions
        </Link>

        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono font-bold text-2xl text-white">v4.6.20</span>
            <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2.5 py-0.5 rounded-full font-semibold tracking-wide">
              Horizon Souverain
            </span>
            <span className="text-xs text-slate-500">avril 2026</span>
          </div>
          <h1 className="text-xl font-semibold text-white leading-snug">
            La Guadeloupe a son gisement, l'arbitrage est désormais entre vos mains.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Cette mise à jour est la plus importante depuis le lancement du projet. Nous passons
            d'un catalogue de démonstration à une base de données de souveraineté économique
            couvrant l'essentiel de la Grande-Terre.
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-5">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                {section.icon}
                {section.title}
              </h2>
              <ul className="space-y-2 pl-1">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call-to-action */}
        <div className="bg-slate-900 border border-emerald-800/50 rounded-2xl p-6 space-y-3 text-center">
          <p className="text-slate-300 text-sm leading-relaxed italic">
            "Avec la v4.6.20, nous ne listons plus des prix, nous fournissons une arme contre
            l'inflation. En rendant les prix transparents du Moule aux Abymes, nous redonnons le
            pouvoir de choix au citoyen guadeloupéen. Observer pour ne plus subir."
          </p>
          <a
            href="https://akiprisaye-web.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Accéder à la plateforme
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Footer nav */}
        <div className="text-center">
          <Link
            to="/versions"
            className="text-xs text-slate-500 hover:text-slate-400 underline transition-colors"
          >
            Voir toutes les versions →
          </Link>
        </div>
      </div>
    </div>
  );
}
