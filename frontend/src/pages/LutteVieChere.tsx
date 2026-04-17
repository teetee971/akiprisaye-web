/**
 * Lutte contre la Vie Chère - Complete Page
 * Comprehensive information about fighting high prices in French overseas territories
 */

import {
  TrendingDown,
  Users,
  FileText,
  Phone,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Mail,
  Shield,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { LUTTE_VIE_CHERE_STATS } from '../data/lutteVieChereStats';

import { SEOHead } from '../components/ui/SEOHead';
export function LutteVieChere() {
  const stats = LUTTE_VIE_CHERE_STATS;

  return (
    <>
      <SEOHead
        title="Lutte contre la vie chère — Actions et ressources Outre-mer"
        description="Ressources, associations et actions citoyennes pour lutter contre la vie chère dans les territoires d'Outre-mer."
        canonical="https://teetee971.github.io/akiprisaye-web/vie-chere"
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-6 pb-2">
          <HeroImage
            src={PAGE_HERO_IMAGES.lutteVieChere}
            alt="Solidarité citoyenne — lutte contre la vie chère"
            gradient="from-blue-900 to-purple-950"
            height="h-52 sm:h-72"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
              Lutte contre la Vie Chère
            </h1>
            <p className="text-lg md:text-xl text-slate-200 drop-shadow max-w-3xl">
              Ensemble, agissons pour des prix justes dans les territoires d'Outre-mer
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <a
                href="#signaler"
                className="px-5 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm"
              >
                Signaler un prix abusif
              </a>
              <a
                href="#ressources"
                className="px-5 py-2 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm"
              >
                Accéder aux ressources
              </a>
            </div>
          </HeroImage>
        </div>

        {/* Statistics Section */}
        <div className="container mx-auto px-4 -mt-8">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Dernière mise à jour : {stats.updatedAt}
          </p>
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-600" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-8 h-8 text-orange-500 flex-shrink-0" />
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.totalReports.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Signalements effectués
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  transmis aux autorités compétentes (DGCCRF)
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.activeActions}
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Actions en cours
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  en cours d'enquête ou de concertation
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.averageSavings}€
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Économies moyennes/mois
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  estimées pour les citoyens ayant adopté les bons plans
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-purple-400 to-purple-600" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8 text-purple-500 flex-shrink-0" />
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.participatingUsers.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Citoyens engagés
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ayant contribué à l'observatoire en 2026
                </div>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
              Notre Mission
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                La vie chère dans les territoires d'Outre-mer est une réalité qui affecte
                quotidiennement des millions de citoyens. <strong>A KI PRI SA YÉ</strong> s'engage
                activement dans la lutte pour des prix justes et transparents.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-5">
                Notre plateforme permet de :
              </p>

              {/* Nos chiffres clés inline strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 not-prose">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">+43 %</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">
                    surcoût alimentaire moyen
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">DOM vs Hexagone</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    30 %
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">
                    seuil légal BQP dépassé
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    dans 6 territoires
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">9</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">
                    territoires sous surveillance
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    citoyenne permanente
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  <span>Comparer les prix en temps réel entre les territoires et la métropole</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  <span>Signaler les prix anormalement élevés aux autorités compétentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  <span>Suivre l'évolution des prix et détecter les hausses injustifiées</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  <span>Informer et sensibiliser les consommateurs</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Active Actions Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              Actions en Cours
            </h2>
            <div className="space-y-4">
              {/* Action 1 — en cours */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                    🇬🇵 Hausse injustifiée — Produits de base (Guadeloupe)
                  </h3>
                  <Link
                    to="/signalement"
                    className="flex-shrink-0 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-medium transition-colors self-start"
                  >
                    Signaler aussi
                  </Link>
                </div>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                  Augmentation de 15% sur plusieurs produits alimentaires de base détectée.
                  Signalement transmis à la DGCCRF.
                </p>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  Statut : En cours d'enquête · Mis à jour le 7 mars 2026
                </div>
              </div>

              {/* Action 2 — collecte */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    🇷🇪 Observatoire des prix — Nouvelle campagne (La Réunion)
                  </h3>
                  <Link
                    to="/signalement"
                    className="flex-shrink-0 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors self-start"
                  >
                    Signaler aussi
                  </Link>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Lancement d'une collecte participative de données sur les produits frais locaux.
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Statut : Collecte en cours · 247 contributions reçues · Mis à jour le 7 mars 2026
                </div>
              </div>

              {/* Action 3 — résolu */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                    🇲🇶 Baisse confirmée — Distribution (Martinique)
                    <CheckCircle
                      className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                  </h3>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  Suite aux signalements, une enseigne a revu ses tarifs à la baisse sur 50+
                  produits.
                </p>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Statut : <span className="font-semibold">✅ Résolu le 2 mars 2026</span> · Impact
                  : −3,2% en moyenne
                </div>
              </div>
            </div>
          </div>

          {/* Contact Institutions */}
          <div
            id="ressources"
            className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg"
          >
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
              Contacter les Institutions
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">
                  DGCCRF — Direction Générale de la Concurrence
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://signal.conso.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    Signaler en ligne (SignalConso)
                  </a>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>39 39 (Service gratuit + prix d'appel)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">
                  Associations de Consommateurs
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://www.ufc-quechoisir.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    UFC-Que Choisir
                  </a>
                  <a
                    href="https://www.famillesrurales.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    Familles Rurales
                  </a>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">
                  Défenseur des droits
                </h3>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recours pour inégalités de traitement
                  </p>
                  <a
                    href="https://www.defenseurdesdroits.fr/fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    defenseurdesdroits.fr
                  </a>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>09 69 39 00 00 (gratuit)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Ressources Citoyennes
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Link
                to="/methodologie"
                className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
              >
                <BookOpen className="w-6 h-6 text-blue-500 mb-2" aria-hidden="true" />
                <h4 className="font-semibold mb-1 text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  Guide du Consommateur
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Vos droits et recours en cas de prix abusifs
                </p>
              </Link>

              <Link
                to="/observatoire"
                className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group"
              >
                <TrendingUp className="w-6 h-6 text-green-500 mb-2" aria-hidden="true" />
                <h4 className="font-semibold mb-1 text-slate-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                  Observatoire des Prix
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Données officielles et analyses territoriales
                </p>
              </Link>

              <Link
                to="/faq"
                className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group"
              >
                <Mail className="w-6 h-6 text-purple-500 mb-2" aria-hidden="true" />
                <h4 className="font-semibold mb-1 text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  Questions Fréquentes
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Réponses aux questions les plus courantes
                </p>
              </Link>

              <a
                href="https://www.iedom.fr/iedom/publications-26.html"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors group"
              >
                <Shield className="w-6 h-6 text-orange-500 mb-2" aria-hidden="true" />
                <h4 className="font-semibold mb-1 text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
                  Rapport IEDOM 2023
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Analyses économiques des DOM-TOM par l'IEDOM
                </p>
              </a>
            </div>
          </div>

          {/* CTA Section */}
          <div
            id="signaler"
            className="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white rounded-xl p-8 mb-12 text-center shadow-xl"
          >
            <h2 className="text-3xl font-bold mb-4">Vous constatez un prix abusif ?</h2>
            <p className="text-lg mb-6 opacity-90">
              Signalez-le en quelques clics et contribuez à la lutte collective
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/signalement"
                className="inline-block px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
              >
                Faire un signalement
              </Link>
              <Link
                to="/contribuer"
                className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Rejoindre la communauté
              </Link>
            </div>
          </div>

          {/* Nos Victoires Citoyennes */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
            <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
              🏆 Nos Victoires Citoyennes
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              Ces résultats concrets prouvent que la mobilisation citoyenne fonctionne.
            </p>
            <div className="relative border-l-2 border-green-400 dark:border-green-600 pl-6 space-y-8">
              {/* Victory 1 */}
              <div className="relative">
                <div className="absolute -left-[1.625rem] top-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                    Mars 2026 · Martinique 🇲🇶
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">
                    −3,2% sur 50+ produits dans une enseigne suite aux signalements citoyens
                    coordonnés.
                  </p>
                </div>
              </div>
              {/* Victory 2 */}
              <div className="relative">
                <div className="absolute -left-[1.625rem] top-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                    Fév. 2026 · Guadeloupe 🇬🇵
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">
                    E.Leclerc Saint-Denis ouvre avec des tarifs −20% sur la concurrence locale, sous
                    pression citoyenne.
                  </p>
                </div>
              </div>
              {/* Victory 3 */}
              <div className="relative">
                <div className="absolute -left-[1.625rem] top-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                    Jan. 2026 · National 🇫🇷
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">
                    BQP 2026 : liste étendue à 6 200 produits (+200 vs 2025) suite à la pression
                    citoyenne des DOM-TOM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
